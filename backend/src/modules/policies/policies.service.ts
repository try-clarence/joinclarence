import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyStatus, PaymentPlan } from './entities/policy.entity';
import { CarriersService } from '../carriers/carriers.service';
import { BindPolicyDto } from './dto/bind-policy.dto';
import { CarrierQuote } from '../carriers/entities/carrier-quote.entity';
import { QuoteRequest } from '../quotes/entities/quote-request.entity';

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
    private readonly carriersService: CarriersService,
  ) {}

  /**
   * Bind a quote to create a policy
   */
  async bindPolicy(bindPolicyDto: BindPolicyDto): Promise<Policy> {
    const { carrierQuoteId, userId, paymentPlan, autoRenewal } = bindPolicyDto;

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
      const policy = this.policiesRepository.create({
        userId,
        quoteRequestId: carrierQuote.quoteRequestId,
        carrierQuoteId: carrierQuote.id,
        carrierId: carrierQuote.carrierId,
        policyNumber: bindResponse.policy_number,
        carrierPolicyId: bindResponse.policy_id,
        carrierBindId: bindResponse.bind_id,
        insuranceType: carrierQuote.insuranceType || 'commercial',
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
        carrierPolicyData: bindResponse,
      });

      const savedPolicy = await this.policiesRepository.save(policy);

      this.logger.log(
        `Policy ${savedPolicy.policyNumber} bound successfully for user ${userId}`,
      );

      return savedPolicy;
    } catch (error) {
      this.logger.error(
        `Failed to bind policy for quote ${carrierQuoteId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get policies for a user
   */
  async getUserPolicies(userId: string): Promise<Policy[]> {
    return this.policiesRepository.find({
      where: { userId },
      relations: ['carrier'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific policy by ID
   */
  async getPolicyById(policyId: string): Promise<Policy> {
    const policy = await this.policiesRepository.findOne({
      where: { id: policyId },
      relations: ['carrier', 'user', 'quoteRequest', 'carrierQuote'],
    });

    if (!policy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    return policy;
  }

  /**
   * Get policy by policy number
   */
  async getPolicyByNumber(policyNumber: string): Promise<Policy> {
    const policy = await this.policiesRepository.findOne({
      where: { policyNumber },
      relations: ['carrier', 'user'],
    });

    if (!policy) {
      throw new HttpException('Policy not found', HttpStatus.NOT_FOUND);
    }

    return policy;
  }

  /**
   * Get active policies for a user
   */
  async getActivePolicies(userId: string): Promise<Policy[]> {
    return this.policiesRepository.find({
      where: { userId, status: PolicyStatus.ACTIVE },
      relations: ['carrier'],
      order: { expirationDate: 'ASC' },
    });
  }

  /**
   * Get policies expiring soon (within 60 days)
   */
  async getPoliciesExpiringSoon(userId: string): Promise<Policy[]> {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    return this.policiesRepository
      .createQueryBuilder('policy')
      .where('policy.userId = :userId', { userId })
      .andWhere('policy.status = :status', { status: PolicyStatus.ACTIVE })
      .andWhere('policy.expirationDate <= :expirationDate', {
        expirationDate: sixtyDaysFromNow,
      })
      .andWhere('policy.expirationDate > :now', { now: new Date() })
      .orderBy('policy.expirationDate', 'ASC')
      .getMany();
  }

  /**
   * Cancel a policy
   */
  async cancelPolicy(policyId: string, reason?: string): Promise<Policy> {
    const policy = await this.getPolicyById(policyId);

    if (policy.status === PolicyStatus.CANCELLED) {
      throw new HttpException(
        'Policy already cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    policy.status = PolicyStatus.CANCELLED;
    policy.cancelledAt = new Date();

    this.logger.log(
      `Policy ${policy.policyNumber} cancelled. Reason: ${reason}`,
    );

    return this.policiesRepository.save(policy);
  }
}
