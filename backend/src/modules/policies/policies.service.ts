import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarriersService } from '../carriers/carriers.service';
import { CarrierQuote } from '../carriers/entities/carrier-quote.entity';
import { QuoteRequest } from '../quotes/entities/quote-request.entity';
import { QuoteRequestCoverage } from '../quotes/entities/quote-request-coverage.entity';
import { Payment } from '../payments/entities/payment.entity';
import { BindPolicyDto } from './dto/bind-policy.dto';
import { RenewPolicyDto } from './dto/renew-policy.dto';
import { PolicyDto } from './dto/policy-response.dto';
import { Policy } from './entities/policy.entity';
import {
  CarrierQuoteStatus,
  CoverageType,
  InsuranceType,
  PaymentMethod,
  PaymentPlan,
  PaymentStatus,
  PaymentType,
  PolicyStatus,
  RequestType,
} from '@/common/enums';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    @InjectRepository(Policy)
    private policiesRepository: Repository<Policy>,
    @InjectRepository(CarrierQuote)
    private carrierQuotesRepository: Repository<CarrierQuote>,
    @InjectRepository(QuoteRequest)
    private quoteRequestsRepository: Repository<QuoteRequest>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(QuoteRequestCoverage)
    private quoteRequestCoveragesRepository: Repository<QuoteRequestCoverage>,
    private readonly carriersService: CarriersService,
  ) {}

  /**
   * Transform a Policy entity to a PolicyDto with carrierName populated
   */
  private toPolicyDto(policy: Policy): PolicyDto {
    const dto = { ...policy } as any;
    if (policy.carrier) {
      dto.carrierName = policy.carrier.carrierName;
    }
    // Remove loaded relations that aren't part of the DTO
    delete dto.user;
    delete dto.carrier;
    delete dto.quoteRequest;
    delete dto.carrierQuote;
    return dto as PolicyDto;
  }

  /**
   * Bind a quote to create a policy
   */
  async bindPolicy(
    bindPolicyDto: BindPolicyDto,
    userId: string,
  ): Promise<{ policy: PolicyDto; transactionId: string }> {
    const { carrierQuoteId, paymentPlan, autoRenewal } = bindPolicyDto;

    // Get the carrier quote with relations
    const carrierQuote = await this.carrierQuotesRepository.findOne({
      where: { id: carrierQuoteId },
      relations: ['carrier'],
    });

    if (!carrierQuote) {
      throw new HttpException('Quote not found', HttpStatus.NOT_FOUND);
    }

    // Check if quote is still valid
    if (new Date() > carrierQuote.validUntil) {
      throw new HttpException('Quote has expired', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(
      `Binding policy for user ${userId} with quote ${carrierQuoteId}`,
    );

    try {
      // Call carrier API to bind the quote
      const bindResponse = await this.carriersService.bindQuote(
        carrierQuoteId,
        {
          payment_plan: paymentPlan,
          auto_renewal: autoRenewal ?? true,
          payment_method_id: bindPolicyDto.paymentMethodId,
          additional_notes: bindPolicyDto.additionalNotes,
        },
      );

      if (bindResponse.status !== 'bound') {
        this.logger.error(
          `Bind response status: ${bindResponse.status}, error: ${bindResponse.error_message}`,
        );
        throw new HttpException(
          bindResponse.error_message || 'Failed to bind policy',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate monthly amount if monthly payment plan
      let monthlyAmount = null;
      if (paymentPlan === PaymentPlan.MONTHLY && carrierQuote.monthlyPremium) {
        monthlyAmount = carrierQuote.monthlyPremium;
      } else if (paymentPlan === PaymentPlan.MONTHLY) {
        // Estimate monthly if not provided
        monthlyAmount = Math.ceil(carrierQuote.annualPremium / 12);
      }

      // Calculate payment schedule
      const effectiveDate = new Date(bindResponse.effective_date);
      const firstPaymentDue = new Date(effectiveDate);
      firstPaymentDue.setDate(firstPaymentDue.getDate() + 15); // 15 days from effective date

      let paymentsRemaining = null;
      if (paymentPlan === PaymentPlan.MONTHLY) {
        paymentsRemaining = 12;
      } else if (paymentPlan === PaymentPlan.QUARTERLY) {
        paymentsRemaining = 4;
      }

      // Build insured address from quote request
      const quoteRequest = await this.quoteRequestsRepository.findOne({
        where: { id: carrierQuote.quoteRequestId },
      });

      const insuredAddress = quoteRequest
        ? `${quoteRequest.streetAddress}${quoteRequest.addressUnit ? ' ' + quoteRequest.addressUnit : ''}, ${quoteRequest.city}, ${quoteRequest.state} ${quoteRequest.zipCode}`
        : 'Address not available';

      // Create policy record
      const policyData: Partial<Policy> = {
        userId,
        quoteRequestId: carrierQuote.quoteRequestId,
        carrierQuoteId: carrierQuote.id,
        carrierId: carrierQuote.carrierId,
        policyNumber: bindResponse.policy_number,
        carrierPolicyId: bindResponse.policy_id,
        carrierBindId: bindResponse.bind_id,
        // TODO: use enum, not string with casting. carrierQuote must use insuranceType enum.
        insuranceType: carrierQuote.insuranceType,
        coverageType: carrierQuote.coverageType,
        status: PolicyStatus.BOUND,
        coverageLimits: carrierQuote.coverageLimits,
        deductible: carrierQuote.deductible,
        annualPremium: carrierQuote.annualPremium,
        paymentPlan,
        monthlyAmount,
        effectiveDate: new Date(bindResponse.effective_date),
        expirationDate: new Date(bindResponse.expiration_date),
        boundAt: new Date(),
        insuredName: quoteRequest?.legalBusinessName || 'Unknown',
        insuredAddress,
        firstPaymentDue,
        nextPaymentDate: firstPaymentDue,
        paymentsRemaining,
        autoRenewal: autoRenewal ?? true,
        policyDocumentUrl: bindResponse.policy_documents.policy_url,
        declarationsUrl: bindResponse.policy_documents.declarations_url,
        certificateUrl: bindResponse.policy_documents.certificate_url,
        carrierContactInfo: bindResponse.carrier_contact,
        carrierPolicyData: bindResponse as unknown as Record<string, unknown>,
      };
      const policy = this.policiesRepository.create(policyData);

      const savedPolicy = await this.policiesRepository.save(policy);

      // Determine payment amount based on plan
      let paymentAmount = carrierQuote.annualPremium;
      if (paymentPlan === PaymentPlan.MONTHLY && carrierQuote.monthlyPremium) {
        paymentAmount = carrierQuote.monthlyPremium;
      } else if (
        paymentPlan === PaymentPlan.QUARTERLY &&
        carrierQuote.quarterlyPremium
      ) {
        paymentAmount = carrierQuote.quarterlyPremium;
      }

      // Create Payment record
      const payment = this.paymentsRepository.create({
        userId,
        policyId: savedPolicy.id,
        paymentType: PaymentType.INITIAL,
        amount: paymentAmount,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        carrierPaymentId: bindResponse.bind_id,
        paidAt: new Date(),
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      this.logger.log(
        `Policy ${savedPolicy.policyNumber} bound successfully for user ${userId} with payment ${savedPayment.id}`,
      );

      // Load carrier relation to populate carrierName
      const policyWithCarrier = await this.policiesRepository.findOne({
        where: { id: savedPolicy.id },
        relations: ['carrier'],
      });

      return {
        policy: this.toPolicyDto(policyWithCarrier ?? savedPolicy),
        transactionId: savedPayment.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bind policy for quote ${carrierQuoteId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get policies for a user (excludes soft-deleted)
   */
  async getUserPolicies(userId: string): Promise<PolicyDto[]> {
    const policies = await this.policiesRepository.find({
      where: { userId, deletedAt: null },
      relations: ['carrier'],
      order: { createdAt: 'DESC' },
    });
    return policies.map((p) => this.toPolicyDto(p));
  }

  /**
   * Get a specific policy by ID
   */
  async getPolicyById(policyId: string): Promise<PolicyDto> {
    const policy = await this.policiesRepository.findOne({
      where: { id: policyId },
      relations: ['carrier', 'user', 'quoteRequest', 'carrierQuote'],
    });

    if (!policy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    return this.toPolicyDto(policy);
  }

  /**
   * Get policy by policy number
   */
  async getPolicyByNumber(policyNumber: string): Promise<PolicyDto> {
    const policy = await this.policiesRepository.findOne({
      where: { policyNumber },
      relations: ['carrier', 'user'],
    });

    if (!policy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    return this.toPolicyDto(policy);
  }

  /**
   * Get active policies for a user (excludes soft-deleted)
   */
  async getActivePolicies(userId: string): Promise<PolicyDto[]> {
    const policies = await this.policiesRepository.find({
      where: { userId, status: PolicyStatus.ACTIVE, deletedAt: null },
      relations: ['carrier'],
      order: { expirationDate: 'ASC' },
    });
    return policies.map((p) => this.toPolicyDto(p));
  }

  /**
   * Get policies expiring soon (within 60 days, excludes soft-deleted)
   */
  async getPoliciesExpiringSoon(userId: string): Promise<PolicyDto[]> {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const policies = await this.policiesRepository
      .createQueryBuilder('policy')
      .leftJoinAndSelect('policy.carrier', 'carrier')
      .where('policy.userId = :userId', { userId })
      .andWhere('policy.status = :status', { status: PolicyStatus.ACTIVE })
      .andWhere('policy.deletedAt IS NULL')
      .andWhere('policy.expirationDate <= :expirationDate', {
        expirationDate: sixtyDaysFromNow,
      })
      .andWhere('policy.expirationDate > :now', { now: new Date() })
      .orderBy('policy.expirationDate', 'ASC')
      .getMany();
    return policies.map((p) => this.toPolicyDto(p));
  }

  /**
   * Cancel a policy
   */
  async cancelPolicy(policyId: string, reason?: string): Promise<PolicyDto> {
    const policyDto = await this.getPolicyById(policyId);

    if (policyDto.status === PolicyStatus.CANCELLED) {
      throw new HttpException(
        'Policy already cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch the raw entity to update
    const policy = await this.policiesRepository.findOne({
      where: { id: policyId },
      relations: ['carrier'],
    });

    policy.status = PolicyStatus.CANCELLED;
    policy.cancelledAt = new Date();

    this.logger.log(
      `Policy ${policy.policyNumber} cancelled. Reason: ${reason}`,
    );

    const saved = await this.policiesRepository.save(policy);
    return this.toPolicyDto(saved);
  }

  /**
   * Renew a policy by requesting new quotes from the same carrier and binding
   */
  async renewPolicy(
    policyId: string,
    renewDto: RenewPolicyDto,
    userId: string,
  ): Promise<{ policy: PolicyDto; transactionId: string }> {
    // Fetch existing policy with relations
    const existingPolicy = await this.policiesRepository.findOne({
      where: { id: policyId },
      relations: ['carrier', 'carrierQuote', 'quoteRequest'],
    });

    if (!existingPolicy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    if (
      existingPolicy.status !== PolicyStatus.BOUND &&
      existingPolicy.status !== PolicyStatus.ACTIVE
    ) {
      throw new HttpException(
        'Only bound or active policies can be renewed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const quoteRequest = existingPolicy.quoteRequest;
    if (!quoteRequest) {
      throw new HttpException(
        'Original quote request not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch coverage types from original quote request
    const coverages = await this.quoteRequestCoveragesRepository.find({
      where: { quoteRequestId: quoteRequest.id, isSelected: true },
    });

    const selectedCoverages = coverages.map((c) => c.coverageType);
    if (selectedCoverages.length === 0) {
      // Fallback to the existing policy's coverage type
      selectedCoverages.push(existingPolicy.coverageType as CoverageType);
    }

    this.logger.log(
      `Renewing policy ${existingPolicy.policyNumber} for user ${userId}`,
    );

    try {
      // Build carrier quote request from original data
      const requestData = {
        insuranceType: quoteRequest.insuranceType,
        requestType: RequestType.RENEWAL,
        businessInfo: {
          legalBusinessName: quoteRequest.legalBusinessName || 'Unknown',
          legalStructure: quoteRequest.legalStructure || 'Unknown',
          industry: quoteRequest.industry || 'Unknown',
          industryCode: quoteRequest.industryCode,
          yearStarted: quoteRequest.yearStarted,
        },
        address: {
          addressType: quoteRequest.addressType || 'physical',
          streetAddress: quoteRequest.streetAddress || '123 Main St',
          addressUnit: quoteRequest.addressUnit,
          city: quoteRequest.city || 'Unknown',
          state: quoteRequest.state || 'CA',
          zipCode: quoteRequest.zipCode || '00000',
        },
        financialInfo: {
          revenue2024: quoteRequest.revenue2024,
          expenses2024: quoteRequest.expenses2024,
          fullTimeEmployees: quoteRequest.fullTimeEmployees,
          totalPayroll: quoteRequest.totalPayroll,
        },
        contact: {
          firstName: quoteRequest.contactFirstName || 'Unknown',
          lastName: quoteRequest.contactLastName || 'Unknown',
          email: quoteRequest.contactEmail || 'unknown@example.com',
          phone: quoteRequest.contactPhone || '+10000000000',
        },
        selectedCoverages,
      };

      // Request quotes from the same carrier
      const newQuotes = await this.carriersService.requestQuote(
        existingPolicy.carrierId,
        quoteRequest.id,
        requestData as any,
      );

      // Find the first QUOTED result matching original coverage type
      const matchingQuote = newQuotes.find(
        (q) =>
          q.status === CarrierQuoteStatus.QUOTED &&
          q.coverageType === existingPolicy.coverageType,
      );

      if (!matchingQuote) {
        throw new HttpException(
          'No renewal quote available from carrier',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Use the payment plan from the DTO or fall back to existing
      const paymentPlan = renewDto.paymentPlan || existingPolicy.paymentPlan;

      // Bind the new quote
      const bindResponse = await this.carriersService.bindQuote(
        matchingQuote.id,
        {
          payment_plan: paymentPlan,
          auto_renewal: existingPolicy.autoRenewal,
          payment_method_id: renewDto.paymentMethodId,
          additional_notes: renewDto.additionalNotes,
        },
      );

      if (bindResponse.status !== 'bound') {
        throw new HttpException(
          bindResponse.error_message || 'Failed to bind renewal policy',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate monthly amount
      let monthlyAmount = null;
      if (paymentPlan === PaymentPlan.MONTHLY && matchingQuote.monthlyPremium) {
        monthlyAmount = matchingQuote.monthlyPremium;
      } else if (paymentPlan === PaymentPlan.MONTHLY) {
        monthlyAmount = Math.ceil(matchingQuote.annualPremium / 12);
      }

      const effectiveDate = new Date(bindResponse.effective_date);
      const firstPaymentDue = new Date(effectiveDate);
      firstPaymentDue.setDate(firstPaymentDue.getDate() + 15);

      let paymentsRemaining = null;
      if (paymentPlan === PaymentPlan.MONTHLY) {
        paymentsRemaining = 12;
      } else if (paymentPlan === PaymentPlan.QUARTERLY) {
        paymentsRemaining = 4;
      }

      // Create new policy record
      const newPolicyData: Partial<Policy> = {
        userId,
        quoteRequestId: quoteRequest.id,
        carrierQuoteId: matchingQuote.id,
        carrierId: existingPolicy.carrierId,
        policyNumber: bindResponse.policy_number,
        carrierPolicyId: bindResponse.policy_id,
        carrierBindId: bindResponse.bind_id,
        insuranceType: existingPolicy.insuranceType as InsuranceType,
        coverageType: existingPolicy.coverageType as CoverageType,
        status: PolicyStatus.BOUND,
        coverageLimits: matchingQuote.coverageLimits,
        deductible: matchingQuote.deductible,
        annualPremium: matchingQuote.annualPremium,
        paymentPlan,
        monthlyAmount,
        effectiveDate: new Date(bindResponse.effective_date),
        expirationDate: new Date(bindResponse.expiration_date),
        boundAt: new Date(),
        insuredName: existingPolicy.insuredName,
        insuredAddress: existingPolicy.insuredAddress,
        firstPaymentDue,
        nextPaymentDate: firstPaymentDue,
        paymentsRemaining,
        autoRenewal: existingPolicy.autoRenewal,
        policyDocumentUrl: bindResponse.policy_documents.policy_url,
        declarationsUrl: bindResponse.policy_documents.declarations_url,
        certificateUrl: bindResponse.policy_documents.certificate_url,
        carrierContactInfo: bindResponse.carrier_contact,
        carrierPolicyData: bindResponse as unknown as Record<string, unknown>,
      };
      const newPolicy = this.policiesRepository.create(newPolicyData);

      const savedPolicy = await this.policiesRepository.save(newPolicy);

      // Determine payment amount based on plan
      let paymentAmount = matchingQuote.annualPremium;
      if (paymentPlan === PaymentPlan.MONTHLY && matchingQuote.monthlyPremium) {
        paymentAmount = matchingQuote.monthlyPremium;
      } else if (
        paymentPlan === PaymentPlan.QUARTERLY &&
        matchingQuote.quarterlyPremium
      ) {
        paymentAmount = matchingQuote.quarterlyPremium;
      }

      // Create Payment record
      const payment = this.paymentsRepository.create({
        userId,
        policyId: savedPolicy.id,
        paymentType: PaymentType.INITIAL,
        amount: paymentAmount,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        carrierPaymentId: bindResponse.bind_id,
        paidAt: new Date(),
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      this.logger.log(
        `Policy ${savedPolicy.policyNumber} renewed successfully from ${existingPolicy.policyNumber}`,
      );

      // Load carrier relation to populate carrierName
      const policyWithCarrier = await this.policiesRepository.findOne({
        where: { id: savedPolicy.id },
        relations: ['carrier'],
      });

      return {
        policy: this.toPolicyDto(policyWithCarrier ?? savedPolicy),
        transactionId: savedPayment.id,
      };
    } catch (error) {
      this.logger.error(`Failed to renew policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a policy
   * @param policyId - The ID of the policy to delete
   * @returns The deleted policy
   */
  async deletePolicy(policyId: string): Promise<PolicyDto> {
    const policy = await this.policiesRepository.findOne({
      where: { id: policyId, deletedAt: null },
      relations: ['carrier'],
    });

    if (!policy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    // Only allow deletion of cancelled or expired policies
    if (
      policy.status !== PolicyStatus.CANCELLED &&
      policy.status !== PolicyStatus.EXPIRED
    ) {
      throw new HttpException(
        'Only cancelled or expired policies can be deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    policy.deletedAt = new Date();
    const deletedPolicy = await this.policiesRepository.save(policy);

    this.logger.log(`Policy ${policy.policyNumber} soft deleted`);

    return this.toPolicyDto(deletedPolicy);
  }
}
