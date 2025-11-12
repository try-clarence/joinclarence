import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest, QuoteRequestStatus } from './entities/quote-request.entity';
import { QuoteRequestCoverage } from './entities/quote-request-coverage.entity';
import { CarriersService } from '../carriers/carriers.service';
import { CreateQuoteRequestDto, SelectCoveragesDto } from './dto/create-quote-request.dto';
import { CarrierQuoteRequestDto } from '../carriers/dto/quote-request.dto';

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
   * Create a new quote request (Step 1)
   */
  async createQuoteRequest(
    createQuoteRequestDto: CreateQuoteRequestDto,
  ): Promise<QuoteRequest> {
    this.logger.log(
      `Creating quote request for session ${createQuoteRequestDto.sessionId}`,
    );

    const quoteRequest = new QuoteRequest();
    Object.assign(quoteRequest, createQuoteRequestDto);
    quoteRequest.status = QuoteRequestStatus.DRAFT;

    return this.quoteRequestsRepository.save(quoteRequest);
  }

  /**
   * Update quote request (Steps 2-5)
   */
  async updateQuoteRequest(
    id: string,
    updateData: Partial<CreateQuoteRequestDto>,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { id },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(quoteRequest, updateData);
    return this.quoteRequestsRepository.save(quoteRequest);
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
      throw new HttpException(
        'No coverages selected',
        HttpStatus.BAD_REQUEST,
      );
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
   * Get quote request with quotes
   */
  async getQuoteRequestWithQuotes(quoteRequestId: string): Promise<any> {
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

    // Get quotes
    const quotes = await this.carriersService.getQuotesForRequest(
      quoteRequestId,
    );

    return {
      quoteRequest,
      coverages,
      quotes,
    };
  }

  /**
   * Get quote request by session ID
   */
  async getQuoteRequestBySession(sessionId: string): Promise<QuoteRequest> {
    const quoteRequest = await this.quoteRequestsRepository.findOne({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });

    if (!quoteRequest) {
      throw new HttpException('Quote request not found', HttpStatus.NOT_FOUND);
    }

    return quoteRequest;
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
