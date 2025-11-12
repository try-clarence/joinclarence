import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Carrier, CarrierHealthStatus } from './entities/carrier.entity';
import { CarrierQuote, CarrierQuoteStatus } from './entities/carrier-quote.entity';
import { CarrierQuoteRequestDto } from './dto/quote-request.dto';

interface CarrierApiQuoteResponse {
  quote_id: string;
  status: 'quoted' | 'declined' | 'referred';
  coverage_type: string;
  pricing: {
    annual_premium: number;
    monthly_premium?: number;
    quarterly_premium?: number;
    payment_in_full_discount?: number;
  };
  coverage_limits: any;
  deductible: number;
  effective_date: string;
  expiration_date: string;
  policy_form?: string;
  highlights?: string[];
  exclusions?: string[];
  optional_coverages?: any[];
  underwriting_notes?: any;
  decline_reason?: string;
  decline_code?: string;
  package_discount_percentage?: number;
  package_discount_amount?: number;
  valid_until: string;
}

interface CarrierApiBindResponse {
  policy_id: string;
  bind_id: string;
  policy_number: string;
  status: 'bound' | 'pending' | 'failed';
  effective_date: string;
  expiration_date: string;
  policy_documents: {
    policy_url?: string;
    declarations_url?: string;
    certificate_url?: string;
  };
  carrier_contact: any;
  error_message?: string;
}

@Injectable()
export class CarriersService {
  private readonly logger = new Logger(CarriersService.name);

  constructor(
    @InjectRepository(Carrier)
    private carriersRepository: Repository<Carrier>,
    @InjectRepository(CarrierQuote)
    private carrierQuotesRepository: Repository<CarrierQuote>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Get all active carriers
   */
  async findActiveCarriers(): Promise<Carrier[]> {
    return this.carriersRepository.find({
      where: { isActive: true },
      order: { carrierName: 'ASC' },
    });
  }

  /**
   * Get carriers that support specific insurance type and coverages
   */
  async findCarriersForCoverages(
    insuranceType: string,
    coverageTypes: string[],
  ): Promise<Carrier[]> {
    const carriers = await this.findActiveCarriers();

    return carriers.filter((carrier) => {
      // Check if carrier supports the insurance type
      const supportsType =
        insuranceType === 'commercial'
          ? carrier.supportsCommercial
          : carrier.supportsPersonal;

      if (!supportsType) return false;

      // Check if carrier supports at least one of the requested coverages
      const supportedCoverages = carrier.supportedCoverages || [];
      return coverageTypes.some((coverage) =>
        supportedCoverages.includes(coverage),
      );
    });
  }

  /**
   * Request a quote from a specific carrier
   */
  async requestQuote(
    carrierId: string,
    quoteRequestId: string,
    requestData: CarrierQuoteRequestDto,
  ): Promise<CarrierQuote[]> {
    const carrier = await this.carriersRepository.findOne({
      where: { id: carrierId },
    });

    if (!carrier) {
      throw new HttpException('Carrier not found', HttpStatus.NOT_FOUND);
    }

    if (!carrier.isActive) {
      throw new HttpException(
        'Carrier is not active',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `Requesting quotes from ${carrier.carrierName} for ${requestData.selectedCoverages.length} coverages`,
    );

    const quotes: CarrierQuote[] = [];
    const startTime = Date.now();

    try {
      // Request quotes for each selected coverage
      for (const coverageType of requestData.selectedCoverages) {
        // Only request if carrier supports this coverage
        if (!carrier.supportedCoverages?.includes(coverageType)) {
          this.logger.warn(
            `Carrier ${carrier.carrierCode} does not support ${coverageType}`,
          );
          continue;
        }

        try {
          const quote = await this.requestCoverageQuote(
            carrier,
            quoteRequestId,
            requestData,
            coverageType,
          );
          quotes.push(quote);
        } catch (error) {
          this.logger.error(
            `Failed to get quote for ${coverageType} from ${carrier.carrierCode}:`,
            error.message,
          );
          // Continue with other coverages even if one fails
        }
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(
        `Received ${quotes.length} quotes from ${carrier.carrierName} in ${responseTime}ms`,
      );

      return quotes;
    } catch (error) {
      this.logger.error(
        `Error requesting quotes from ${carrier.carrierCode}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Request a quote for a specific coverage type from a carrier
   */
  private async requestCoverageQuote(
    carrier: Carrier,
    quoteRequestId: string,
    requestData: CarrierQuoteRequestDto,
    coverageType: string,
  ): Promise<CarrierQuote> {
    const startTime = Date.now();

    try {
      // Build the carrier API request payload
      const apiRequest = this.buildCarrierApiRequest(requestData, coverageType);

      // Call carrier API
      const url = `${carrier.apiBaseUrl}/carriers/${carrier.carrierCode}/quote`;
      const headers = {
        'X-API-Key': carrier.apiKeyEncrypted,
        'Content-Type': 'application/json',
      };

      this.logger.debug(`Calling carrier API: POST ${url}`);
      this.logger.debug(`Request payload: ${JSON.stringify(apiRequest, null, 2)}`);

      const response = await firstValueFrom(
        this.httpService.post<CarrierApiQuoteResponse>(url, apiRequest, {
          headers,
        }),
      );

      const responseTime = Date.now() - startTime;
      const apiResponse = response.data;

      // Carrier API returns quotes array, extract the first quote for this coverage type
      const responseData: any = apiResponse;
      const quoteData = responseData.quotes && responseData.quotes.length > 0 
        ? responseData.quotes[0] 
        : null;

      if (!quoteData) {
        throw new Error('No quote data returned from carrier');
      }

      this.logger.log(
        `Got ${quoteData.status} quote from ${carrier.carrierCode} for ${coverageType}`,
      );

      // Map the carrier's response to our CarrierQuote entity
      const quote = this.carrierQuotesRepository.create({
        quoteRequestId,
        carrierId: carrier.id,
        carrierQuoteId: quoteData.quote_id,
        carrierResponse: apiResponse,
        status:
          quoteData.status === 'quoted'
            ? CarrierQuoteStatus.QUOTED
            : quoteData.status === 'declined'
              ? CarrierQuoteStatus.DECLINED
              : CarrierQuoteStatus.REFERRED,
        coverageType,
        insuranceType: requestData.insuranceType,
        annualPremium: quoteData.premium?.annual || 0,
        monthlyPremium: quoteData.premium?.monthly || 0,
        quarterlyPremium: quoteData.premium?.quarterly || 0,
        paymentInFullDiscount: quoteData.premium?.payment_in_full_discount || 0,
        coverageLimits: quoteData.coverage_limits,
        deductible: quoteData.deductible,
        effectiveDate: new Date(quoteData.effective_date),
        expirationDate: new Date(quoteData.expiration_date),
        policyForm: quoteData.policy_form,
        highlights: quoteData.highlights,
        exclusions: quoteData.exclusions,
        optionalCoverages: quoteData.optional_coverages,
        underwritingNotes: quoteData.underwriting_notes,
        declineReason: quoteData.decline_reason,
        declineCode: quoteData.decline_code,
        packageDiscountPercentage: responseData.package_discount?.percentage || null,
        packageDiscountAmount: responseData.package_discount?.amount || null,
        validUntil: new Date(responseData.valid_until),
        generatedViaLlm: false,
        cached: responseData.cached || false,
        responseTimeMs: responseTime,
      });

      return this.carrierQuotesRepository.save(quote);
    } catch (error) {
      const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(
        `Failed to get quote from ${carrier.carrierCode} for ${coverageType}:\n${errorDetails}`,
      );
      throw error;
    }
  }

  /**
   * Request quotes from all eligible carriers
   */
  async requestQuotesFromAllCarriers(
    quoteRequestId: string,
    requestData: CarrierQuoteRequestDto,
  ): Promise<CarrierQuote[]> {
    const carriers = await this.findCarriersForCoverages(
      requestData.insuranceType,
      requestData.selectedCoverages,
    );

    this.logger.log(
      `Requesting quotes from ${carriers.length} carriers for request ${quoteRequestId}`,
    );

    const allQuotes: CarrierQuote[] = [];

    // Request quotes from all carriers in parallel
    const quotePromises = carriers.map((carrier) =>
      this.requestQuote(carrier.id, quoteRequestId, requestData).catch(
        (error) => {
          this.logger.error(
            `Failed to get quotes from ${carrier.carrierCode}:`,
            error.message,
          );
          return []; // Return empty array on failure
        },
      ),
    );

    const results = await Promise.all(quotePromises);

    // Flatten the results
    results.forEach((quotes) => {
      allQuotes.push(...quotes);
    });

    this.logger.log(
      `Received total of ${allQuotes.length} quotes from ${carriers.length} carriers`,
    );

    return allQuotes;
  }

  /**
   * Bind a quote to create a policy
   */
  async bindQuote(
    carrierQuoteId: string,
    bindData: any,
  ): Promise<CarrierApiBindResponse> {
    const quote = await this.carrierQuotesRepository.findOne({
      where: { id: carrierQuoteId },
      relations: ['carrier'],
    });

    if (!quote) {
      throw new HttpException('Quote not found', HttpStatus.NOT_FOUND);
    }

    if (quote.status !== CarrierQuoteStatus.QUOTED) {
      throw new HttpException(
        'Quote cannot be bound',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if quote is still valid
    if (new Date() > quote.validUntil) {
      throw new HttpException('Quote has expired', HttpStatus.BAD_REQUEST);
    }

    const carrier = quote.carrier;

    this.logger.log(
      `Binding quote ${quote.carrierQuoteId} with ${carrier.carrierName}`,
    );

    try {
      const url = `${carrier.apiBaseUrl}/carriers/${carrier.carrierCode}/bind`;
      const headers = {
        'X-API-Key': carrier.apiKeyEncrypted,
        'Content-Type': 'application/json',
      };

      // Build proper bind request with required fields for carrier API
      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 30);
      const effectiveDateStr = effectiveDate.toISOString().split('T')[0];

      const bindRequest = {
        quote_id: quote.carrierQuoteId,
        effective_date: effectiveDateStr,
        payment_plan: bindData.payment_plan || 'annual',
        payment_info: {
          method: 'credit_card',
          token: bindData.payment_method_id || 'tok_test_123',
          billing_address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
          },
        },
        insured_info: {
          primary_contact: {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            phone: '+15551234567',
          },
        },
        signature: {
          full_name: 'Test User',
          signed_at: new Date().toISOString(),
          ip_address: '127.0.0.1',
        },
      };

      const response = await firstValueFrom(
        this.httpService.post<any>(url, bindRequest, {
          headers,
        }),
      );

      this.logger.log(
        `Bind response: ${JSON.stringify(response.data, null, 2)}`,
      );

      // Carrier API returns nested structure: { success: true, policy: {...}, ... }
      // Map to expected format
      const responseData: any = response.data;
      const policyData = responseData.policy || responseData;

      const bindResponse: CarrierApiBindResponse = {
        policy_id: policyData.policy_id,
        bind_id: responseData.bind_id,
        policy_number: policyData.policy_number,
        status: policyData.status === 'bound' ? 'bound' : 'pending',
        effective_date: policyData.effective_date,
        expiration_date: policyData.expiration_date,
        policy_documents: policyData.documents ? {
          policy_url: policyData.documents.find((d: any) => d.type === 'policy')?.url,
          declarations_url: policyData.documents.find((d: any) => d.type === 'declarations')?.url,
          certificate_url: policyData.documents.find((d: any) => d.type === 'certificate')?.url,
        } : {},
        carrier_contact: policyData.carrier_contact || {},
      };

      if (bindResponse.policy_number) {
        this.logger.log(
          `Successfully bound quote ${quote.carrierQuoteId} - Policy: ${bindResponse.policy_number}`,
        );
      }

      return bindResponse;
    } catch (error) {
      this.logger.error(
        `Failed to bind quote ${quote.carrierQuoteId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Health check for a carrier
   */
  async checkCarrierHealth(carrierId: string): Promise<void> {
    const carrier = await this.carriersRepository.findOne({
      where: { id: carrierId },
    });

    if (!carrier) {
      throw new HttpException('Carrier not found', HttpStatus.NOT_FOUND);
    }

    try {
      const url = `${carrier.apiBaseUrl}/carriers/${carrier.carrierCode}/health`;
      const headers = {
        'X-API-Key': carrier.apiKeyEncrypted,
      };

      await firstValueFrom(
        this.httpService.get(url, { headers, timeout: 5000 }),
      );

      // Update health status
      carrier.healthStatus = CarrierHealthStatus.OPERATIONAL;
      carrier.lastHealthCheck = new Date();
      await this.carriersRepository.save(carrier);

      this.logger.log(`Carrier ${carrier.carrierCode} is healthy`);
    } catch (error) {
      this.logger.error(
        `Health check failed for ${carrier.carrierCode}:`,
        error.message,
      );

      carrier.healthStatus = CarrierHealthStatus.DOWN;
      carrier.lastHealthCheck = new Date();
      await this.carriersRepository.save(carrier);
    }
  }

  /**
   * Build the carrier API request payload
   * Format matches CARRIER_API_SCHEMA.md specification
   */
  private buildCarrierApiRequest(
    requestData: CarrierQuoteRequestDto,
    coverageType: string,
  ): any {
    // Get effective date - default to 30 days from now
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 30);
    const effectiveDateStr = effectiveDate.toISOString().split('T')[0];

    // Build simplified request that works with carrier simulator
    return {
      quote_request_id: `qr_${Date.now()}`, // Generate unique quote request ID
      insurance_type: requestData.insuranceType,
      business_info: {
        legal_name: requestData.businessInfo.legalBusinessName,
        industry: requestData.businessInfo.industry,
        industry_code: requestData.businessInfo.industryCode,
        year_started: requestData.businessInfo.yearStarted,
        address: {
          street: requestData.address.streetAddress,
          city: requestData.address.city,
          state: requestData.address.state,
          zip: requestData.address.zipCode,
        },
        financial_info: {
          annual_revenue: Number(requestData.financialInfo.revenue2024) || 0,
          annual_payroll: Number(requestData.financialInfo.totalPayroll) || 0,
          full_time_employees: Number(requestData.financialInfo.fullTimeEmployees) || 0,
        },
        contact_info: {
          first_name: requestData.contact.firstName,
          last_name: requestData.contact.lastName,
          email: requestData.contact.email,
          phone: requestData.contact.phone,
        },
      },
      coverage_requests: [
        {
          coverage_type: coverageType,
          requested_limits: this.getDefaultLimitsForCoverage(coverageType),
          requested_deductible: this.getDefaultDeductibleForCoverage(coverageType),
          effective_date: effectiveDateStr,
        },
      ],
      additional_data: {
        prior_coverage: false,
        claims_history: [],
        credit_score_tier: 'good',
      },
    };
  }

  /**
   * Get default coverage limits based on coverage type
   */
  private getDefaultLimitsForCoverage(coverageType: string): any {
    const limitsMap = {
      general_liability: {
        per_occurrence: 1000000,
        general_aggregate: 2000000,
      },
      professional_liability: {
        per_claim: 1000000,
        aggregate: 2000000,
      },
      cyber_liability: {
        per_incident: 1000000,
        aggregate: 2000000,
      },
      workers_comp: {
        each_accident: 1000000,
        disease_policy_limit: 1000000,
        disease_each_employee: 1000000,
      },
      commercial_property: {
        building: 1000000,
        business_personal_property: 500000,
      },
      business_auto: {
        combined_single_limit: 1000000,
      },
    };

    return limitsMap[coverageType] || { per_occurrence: 1000000, aggregate: 2000000 };
  }

  /**
   * Get default deductible based on coverage type
   */
  private getDefaultDeductibleForCoverage(coverageType: string): number {
    const deductibleMap = {
      general_liability: 500,
      professional_liability: 5000,
      cyber_liability: 10000,
      workers_comp: 0,
      commercial_property: 1000,
      business_auto: 500,
    };

    return deductibleMap[coverageType] || 1000;
  }

  /**
   * Get quotes for a quote request
   */
  async getQuotesForRequest(quoteRequestId: string): Promise<CarrierQuote[]> {
    return this.carrierQuotesRepository.find({
      where: { quoteRequestId },
      relations: ['carrier'],
      order: { annualPremium: 'ASC' },
    });
  }
}
