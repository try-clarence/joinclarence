import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CarriersService } from '../carriers/carriers.service';
import { CarrierQuoteRequestDto } from '../carriers/dto/quote-request.dto';
import {
  SelectCoveragesDto,
  SubmitQuoteDto,
} from './dto/create-quote-request.dto';
import {
  GetInsuranceOptionsResponseDto,
  GetQuoteDetailResponseDto,
  InsuranceOptionDto,
} from './dto/quote-response.dto';
import { QuoteRequestCoverage } from './entities/quote-request-coverage.entity';
import { QuoteRequest } from './entities/quote-request.entity';
import {
  InsuranceOptionStatus,
  QuoteRequestStatus,
  CoverageType,
} from '@/common/enums';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(QuoteRequest)
    private quoteRequestsRepository: Repository<QuoteRequest>,
    @InjectRepository(QuoteRequestCoverage)
    private quoteRequestCoveragesRepository: Repository<QuoteRequestCoverage>,
    private readonly carriersService: CarriersService,
  ) {}

  /**
   * Get all quote requests (excludes soft-deleted)
   */
  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    return this.quoteRequestsRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Soft delete a quote request
   * @param quoteRequestId - The ID of the quote request to delete
   * @returns The deleted quote request
   */
  async deleteQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id: quoteRequestId, deletedAt: null },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    // Only allow deletion of quotes that are not purchased
    if (quoteRequest.status === QuoteRequestStatus.PURCHASED) {
      throw new HttpException(
        'Cannot delete a purchased quote request',
        HttpStatus.BAD_REQUEST,
      );
    }

    quoteRequest.deletedAt = new Date();
    const deletedQuote = await this.quoteRequestsRepository.save(quoteRequest);

    this.logger.log(`Quote request ${quoteRequestId} soft deleted`);

    return deletedQuote;
  }

  /**
   * Select coverages (Step 4)
   */
  async selectCoverages(
    quoteRequestId: string,
    selectCoveragesDto: SelectCoveragesDto,
  ): Promise<QuoteRequestCoverage[]> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    // Delete existing coverages
    await this.quoteRequestCoveragesRepository.delete({ quoteRequestId });

    // Create new coverage selections
    const coverages = selectCoveragesDto.selectedCoverages.map((coverageType) =>
      this.quoteRequestCoveragesRepository.create({
        quoteRequestId,
        coverageType,
        isSelected: true,
        isRecommended: false, // Can be set by an AI recommendation service
      }),
    );

    return this.quoteRequestCoveragesRepository.save(coverages);
  }

  /**
   * Submit quote request and get quotes from carriers
   */
  async submitQuoteRequest(quoteRequestId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    if (quoteRequest.status !== QuoteRequestStatus.DRAFT) {
      throw new HttpException(
        'Quote request already submitted',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate required fields
    this.validateQuoteRequest(quoteRequest);

    // Get selected coverages
    const coverages = await this.quoteRequestCoveragesRepository.find({
      where: { quoteRequestId, isSelected: true },
    });

    if (coverages.length === 0) {
      throw new HttpException('No coverages selected', HttpStatus.BAD_REQUEST);
    }

    // Update status
    quoteRequest.status = QuoteRequestStatus.SUBMITTED;
    quoteRequest.submittedAt = new Date();

    // Estimate completion time (30 seconds from now)
    quoteRequest.estimatedCompletionTime = new Date(Date.now() + 30000);

    await this.quoteRequestsRepository.save(quoteRequest);

    // Request quotes from carriers asynchronously
    this.processQuoteRequest(quoteRequest, coverages).catch((error) => {
      this.logger.error(
        `Failed to process quote request ${quoteRequestId}:`,
        error,
      );
    });

    return quoteRequest;
  }

  /**
   * Submit a complete quote in one call - creates quote, adds coverages, validates, and submits
   * This is the unified endpoint that replaces the multi-step process
   */
  async submitCompleteQuote(
    submitQuoteDto: SubmitQuoteDto,
  ): Promise<QuoteRequest> {
    this.logger.log(
      `Submitting complete quote for business: ${submitQuoteDto.legalBusinessName}`,
    );

    // Extract coverages from the DTO
    const { selectedCoverages, ...quoteData } = submitQuoteDto;

    // 1. Create the quote request with all data
    const quoteRequest = new QuoteRequest();
    Object.assign(quoteRequest, quoteData);
    quoteRequest.status = QuoteRequestStatus.DRAFT;

    const savedQuoteRequest =
      await this.quoteRequestsRepository.save(quoteRequest);
    this.logger.log(`Created quote request ${savedQuoteRequest.id}`);

    // 2. Create coverage selections
    const coverages = selectedCoverages.map((coverageType) =>
      this.quoteRequestCoveragesRepository.create({
        quoteRequestId: savedQuoteRequest.id,
        coverageType,
        isSelected: true,
        isRecommended: false,
      }),
    );
    await this.quoteRequestCoveragesRepository.save(coverages);
    this.logger.log(`Created ${coverages.length} coverage selections`);

    // 3. Validate required fields (already validated by DTO, but double-check)
    this.validateQuoteRequest(savedQuoteRequest);

    // 4. Update status to submitted
    savedQuoteRequest.status = QuoteRequestStatus.SUBMITTED;
    savedQuoteRequest.submittedAt = new Date();
    savedQuoteRequest.estimatedCompletionTime = new Date(Date.now() + 30000);

    await this.quoteRequestsRepository.save(savedQuoteRequest);

    // 5. Process quote request asynchronously (request quotes from carriers)
    this.processQuoteRequest(savedQuoteRequest, coverages).catch((error) => {
      this.logger.error(
        `Failed to process quote request ${savedQuoteRequest.id}:`,
        error,
      );
    });

    return savedQuoteRequest;
  }

  /**
   * Process quote request by requesting quotes from carriers
   */
  private async processQuoteRequest(
    quoteRequest: QuoteRequest,
    coverages: QuoteRequestCoverage[],
  ): Promise<void> {
    try {
      // Update status to processing
      quoteRequest.status = QuoteRequestStatus.PROCESSING;
      await this.quoteRequestsRepository.save(quoteRequest);

      // Build carrier quote request
      const carrierRequest: CarrierQuoteRequestDto = {
        insuranceType: quoteRequest.insuranceType as any,
        requestType: quoteRequest.requestType as any,
        businessInfo: {
          legalBusinessName: quoteRequest.legalBusinessName,
          dbaName: quoteRequest.dbaName,
          legalStructure: quoteRequest.legalStructure,
          businessWebsite: quoteRequest.businessWebsite,
          industry: quoteRequest.industry,
          industryCode: quoteRequest.industryCode,
          businessDescription: quoteRequest.businessDescription,
          fein: quoteRequest.fein,
          yearStarted: quoteRequest.yearStarted,
          yearsCurrentOwnership: quoteRequest.yearsCurrentOwnership,
        },
        address: {
          addressType: quoteRequest.addressType,
          streetAddress: quoteRequest.streetAddress,
          addressUnit: quoteRequest.addressUnit,
          city: quoteRequest.city,
          state: quoteRequest.state,
          zipCode: quoteRequest.zipCode,
        },
        financialInfo: {
          revenue2024: quoteRequest.revenue2024,
          expenses2024: quoteRequest.expenses2024,
          revenue2025Estimate: quoteRequest.revenue2025Estimate,
          expenses2025Estimate: quoteRequest.expenses2025Estimate,
          fullTimeEmployees: quoteRequest.fullTimeEmployees,
          partTimeEmployees: quoteRequest.partTimeEmployees,
          totalPayroll: quoteRequest.totalPayroll,
          contractorPercentage: quoteRequest.contractorPercentage,
        },
        contact: {
          firstName: quoteRequest.contactFirstName,
          lastName: quoteRequest.contactLastName,
          email: quoteRequest.contactEmail,
          phone: quoteRequest.contactPhone,
        },
        selectedCoverages: coverages.map((c) => c.coverageType),
        additionalComments: quoteRequest.additionalComments,
      };

      // Request quotes from all eligible carriers
      const quotes = await this.carriersService.requestQuotesFromAllCarriers(
        quoteRequest.id,
        carrierRequest,
      );

      this.logger.log(
        `Received ${quotes.length} quotes for request ${quoteRequest.id}`,
      );

      // Update status to quotes ready
      quoteRequest.status = QuoteRequestStatus.QUOTES_READY;
      quoteRequest.quotesReadyAt = new Date();
      await this.quoteRequestsRepository.save(quoteRequest);
    } catch (error) {
      this.logger.error(
        `Error processing quote request ${quoteRequest.id}:`,
        error,
      );
      quoteRequest.status = QuoteRequestStatus.DRAFT;
      await this.quoteRequestsRepository.save(quoteRequest);
      throw error;
    }
  }

  /**
   * Get quote request with quotes and insurance options
   */
  async getQuoteRequestWithQuotes(
    quoteRequestId: string,
  ): Promise<GetQuoteDetailResponseDto> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    // Get coverages
    const coverages = await this.quoteRequestCoveragesRepository.find({
      where: { quoteRequestId },
    });

    // Get insurance options (transformed carrier quotes)
    const insuranceOptionsResult =
      await this.getInsuranceOptions(quoteRequestId);

    return {
      quoteRequest,
      coverages,
      options: insuranceOptionsResult.options,
      quoteId: quoteRequestId,
    };
  }

  /**
   * Get insurance options for a quote request
   * Transforms carrier quotes into frontend-friendly insurance options
   */
  async getInsuranceOptions(
    quoteRequestId: string,
  ): Promise<GetInsuranceOptionsResponseDto> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id: quoteRequestId },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    // Get carrier quotes with carrier relation
    const carrierQuotes =
      await this.carriersService.getQuotesForRequest(quoteRequestId);

    // Transform carrier quotes to insurance options
    const options = carrierQuotes
      .filter((quote) => quote.status === 'quoted')
      .map((quote, index) => {
        const carrier = quote.carrier;
        const now = new Date();

        // Determine recommendation flags based on sorting
        // Quotes are already sorted by annualPremium ASC from carriersService
        const isPopularChoice = index === 0; // Lowest price
        const isBestValue =
          index === 1 || (carrierQuotes.length === 1 && index === 0);
        const isRecommended = isBestValue;

        return {
          id: quote.id,
          quoteId: quoteRequestId,
          carrier: carrier?.carrierName || 'Unknown Carrier',
          carrierLogo: undefined,
          carrierRating: {
            agency: 'A.M. Best',
            rating: 'A+',
            outlook: 'Stable',
          },
          annualPremium: Number(quote.annualPremium) || 0,
          monthlyPremium:
            Number(quote.monthlyPremium) ||
            Math.ceil((Number(quote.annualPremium) / 12) * 1.05),
          quarterlyPremium:
            Number(quote.quarterlyPremium) ||
            Math.ceil((Number(quote.annualPremium) / 4) * 1.025),
          coverageType: (quote.coverageType ||
            CoverageType.GENERAL_LIABILITY) as CoverageType,
          coverageLimits: quote.coverageLimits || {},
          coverageHighlights:
            quote.highlights || this.generateCoverageHighlights(quote),
          deductible: Number(quote.deductible) || 1000,
          features: this.generateFeatures(isRecommended),
          additionalBenefits: undefined,
          status:
            now > new Date(quote.validUntil)
              ? InsuranceOptionStatus.EXPIRED
              : InsuranceOptionStatus.AVAILABLE,
          availableUntil:
            quote.validUntil?.toISOString() ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          availableAddons: this.generateAddons(),
          recommended: isRecommended,
          popularChoice: isPopularChoice,
          bestValue: isBestValue,
          createdAt: quote.createdAt?.toISOString() || now.toISOString(),
          updatedAt: quote.createdAt?.toISOString() || now.toISOString(),
        };
      });

    return {
      options,
      quoteId: quoteRequestId,
    };
  }

  /**
   * Get a specific insurance option by ID
   */
  async getInsuranceOptionById(
    quoteRequestId: string,
    optionId: string,
  ): Promise<InsuranceOptionDto> {
    const result = await this.getInsuranceOptions(quoteRequestId);
    const option = result.options.find((opt) => opt.id === optionId);

    if (!option) {
      throw new HttpException(
        'Insurance option not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return option;
  }

  /**
   * Generate coverage highlights from quote data
   */
  private generateCoverageHighlights(quote: any): string[] {
    const highlights: string[] = [];
    const limits = quote.coverageLimits || {};

    if (limits.per_occurrence || limits.perOccurrence) {
      const perOcc = limits.per_occurrence || limits.perOccurrence;
      const aggregate =
        limits.general_aggregate || limits.aggregate || perOcc * 2;
      highlights.push(
        `General Liability: $${(perOcc / 1000000).toFixed(1)}M / $${(aggregate / 1000000).toFixed(1)}M`,
      );
    }

    if (quote.deductible) {
      highlights.push(
        `Deductible: $${Number(quote.deductible).toLocaleString()}`,
      );
    }

    if (quote.coverageType) {
      highlights.push(
        `Coverage Type: ${quote.coverageType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      );
    }

    return highlights.length > 0
      ? highlights
      : ['Standard Coverage', 'Claims Support', 'Online Management'];
  }

  /**
   * Generate features for an insurance option
   */
  private generateFeatures(isRecommended: boolean): string[] {
    const features = [
      '24/7 Claims Support',
      'Online Policy Management',
      'Fast Claims Processing',
      'Dedicated Account Manager',
    ];

    if (isRecommended) {
      features.push('No Deductible on Equipment', 'Extended Coverage Options');
    }

    return features;
  }

  /**
   * Generate available add-ons
   */
  private generateAddons(): any[] {
    return [
      {
        name: 'Cyber Liability',
        description: 'Protects against data breaches and cyber attacks',
        additionalCost: 500,
      },
      {
        name: 'Employment Practices Liability',
        description: 'Covers employment-related claims',
        additionalCost: 750,
      },
      {
        name: 'Commercial Auto',
        description: 'Coverage for business vehicles',
        additionalCost: 1200,
      },
    ];
  }

  /**
   * Validate quote request has all required fields
   */
  private validateQuoteRequest(quoteRequest: QuoteRequest): void {
    const requiredFields = [
      'legalBusinessName',
      'industry',
      'streetAddress',
      'city',
      'state',
      'zipCode',
      'contactFirstName',
      'contactLastName',
      'contactEmail',
      'contactPhone',
    ];

    const missingFields = requiredFields.filter(
      (field) => !quoteRequest[field],
    );

    if (missingFields.length > 0) {
      throw new HttpException(
        `Missing required fields: ${missingFields.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
