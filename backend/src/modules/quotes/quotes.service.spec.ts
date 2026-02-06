import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestCoverage } from './entities/quote-request-coverage.entity';
import { CarriersService } from '../carriers/carriers.service';
import { CoverageType, QuoteRequestStatus } from '@/common/enums';
import { IsNull } from 'typeorm';

describe('QuotesService', () => {
  let service: QuotesService;
  let quoteRequestRepository: any;
  let quoteRequestCoveragesRepository: any;
  let carriersService: any;
  let module: TestingModule;

  const mockQuoteRequest: Partial<QuoteRequest> = {
    id: 'quote-123',
    insuranceType: 'commercial' as any,
    requestType: 'new_coverage' as any,
    status: QuoteRequestStatus.DRAFT,
    legalBusinessName: 'Test Corp',
    industry: 'Technology',
    streetAddress: '123 Test St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    contactFirstName: 'John',
    contactLastName: 'Doe',
    contactEmail: 'john@test.com',
    contactPhone: '+15551234567',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockQuoteRequestRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockQuoteRequestCoveragesRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockCarriersService = {
      requestQuotesFromAllCarriers: jest.fn(),
      getQuotesForRequest: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: getRepositoryToken(QuoteRequest),
          useValue: mockQuoteRequestRepository,
        },
        {
          provide: getRepositoryToken(QuoteRequestCoverage),
          useValue: mockQuoteRequestCoveragesRepository,
        },
        {
          provide: CarriersService,
          useValue: mockCarriersService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    quoteRequestRepository = module.get(getRepositoryToken(QuoteRequest));
    quoteRequestCoveragesRepository = module.get(
      getRepositoryToken(QuoteRequestCoverage),
    );
    carriersService = module.get<CarriersService>(CarriersService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllQuoteRequests', () => {
    it('should return all quote requests ordered by createdAt DESC', async () => {
      const mockQuotes = [
        { ...mockQuoteRequest, id: 'quote-1' },
        { ...mockQuoteRequest, id: 'quote-2' },
      ];

      quoteRequestRepository.find.mockResolvedValue(mockQuotes);

      const result = await service.getAllQuoteRequests();

      expect(result).toEqual(mockQuotes);
      expect(quoteRequestRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should return empty array when no quote requests exist', async () => {
      quoteRequestRepository.find.mockResolvedValue([]);

      const result = await service.getAllQuoteRequests();

      expect(result).toEqual([]);
    });
  });

  describe('selectCoverages', () => {
    it('should save selected coverages for quote request', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);

      const coverages = [
        { coverageType: 'general_liability' },
        { coverageType: 'professional_liability' },
      ];

      quoteRequestCoveragesRepository.create.mockImplementation((data) => data);
      quoteRequestCoveragesRepository.save.mockResolvedValue(coverages);

      const result = await service.selectCoverages(mockQuoteRequest.id, {
        selectedCoverages: [
          CoverageType.GENERAL_LIABILITY,
          CoverageType.PROFESSIONAL_LIABILITY,
        ],
      });

      expect(result.length).toBe(2);
      expect(quoteRequestCoveragesRepository.delete).toHaveBeenCalled();
      expect(quoteRequestCoveragesRepository.save).toHaveBeenCalled();
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.selectCoverages('invalid-id', { selectedCoverages: [] }),
      ).rejects.toThrow('Quote request not found');
    });
  });

  describe('submitQuoteRequest', () => {
    it('should submit quote request and trigger carrier API calls', async () => {
      const quoteRequest = {
        ...mockQuoteRequest,
        status: QuoteRequestStatus.DRAFT,
      } as QuoteRequest;

      quoteRequestRepository.findOne.mockResolvedValue(quoteRequest);
      quoteRequestRepository.save.mockResolvedValue({
        ...quoteRequest,
        status: QuoteRequestStatus.SUBMITTED,
      });

      const coverages = [
        {
          quoteRequestId: mockQuoteRequest.id,
          coverageType: 'general_liability',
          isSelected: true,
        },
      ];

      quoteRequestCoveragesRepository.find.mockResolvedValue(coverages);

      carriersService.requestQuotesFromAllCarriers.mockResolvedValue([
        {
          id: 'quote-1',
          annualPremium: 1200,
        },
      ]);

      const result = await service.submitQuoteRequest(mockQuoteRequest.id);

      expect(result.status).toBe(QuoteRequestStatus.PROCESSING);
      expect(quoteRequestRepository.save).toHaveBeenCalled();
    });

    it('should throw error if quote already submitted', async () => {
      const quoteRequest = {
        ...mockQuoteRequest,
        status: QuoteRequestStatus.SUBMITTED,
      } as QuoteRequest;

      quoteRequestRepository.findOne.mockResolvedValue(quoteRequest);

      await expect(
        service.submitQuoteRequest(mockQuoteRequest.id),
      ).rejects.toThrow('Quote request already submitted');
    });

    it('should throw error if no coverages selected', async () => {
      const quoteRequest = {
        ...mockQuoteRequest,
        status: QuoteRequestStatus.DRAFT,
      } as QuoteRequest;

      quoteRequestRepository.findOne.mockResolvedValue(quoteRequest);
      quoteRequestCoveragesRepository.find.mockResolvedValue([]);

      await expect(
        service.submitQuoteRequest(mockQuoteRequest.id),
      ).rejects.toThrow('No coverages selected');
    });
  });

  describe('getQuoteRequestWithQuotes', () => {
    it('should return quote request with all quotes and coverages', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);

      const coverages = [
        { coverageType: 'general_liability', isSelected: true },
      ];
      quoteRequestCoveragesRepository.find.mockResolvedValue(coverages);

      const quotes = [
        {
          id: 'quote-1',
          annualPremium: 1200,
          carrier: { carrierName: 'Test Carrier' },
        },
      ];
      carriersService.getQuotesForRequest.mockResolvedValue(quotes);

      const result = await service.getQuoteRequestWithQuotes(
        mockQuoteRequest.id,
      );

      expect(result).toHaveProperty('quoteRequest');
      expect(result).toHaveProperty('coverages');
      expect(result).toHaveProperty('options');
      expect(result.coverages.length).toBe(1);
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getQuoteRequestWithQuotes('invalid-id'),
      ).rejects.toThrow('Quote request not found');
    });
  });

  describe('getInsuranceOptions', () => {
    it('should return insurance options transformed from carrier quotes', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);

      const carrierQuotes = [
        {
          id: 'carrier-quote-1',
          status: 'quoted',
          annualPremium: 1200,
          monthlyPremium: 105,
          quarterlyPremium: 310,
          coverageType: 'general_liability',
          coverageLimits: { per_occurrence: 1000000 },
          deductible: 500,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          carrier: { carrierName: 'Test Carrier' },
        },
        {
          id: 'carrier-quote-2',
          status: 'quoted',
          annualPremium: 1500,
          monthlyPremium: 130,
          quarterlyPremium: 390,
          coverageType: 'general_liability',
          coverageLimits: { per_occurrence: 2000000 },
          deductible: 1000,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          carrier: { carrierName: 'Another Carrier' },
        },
      ];

      carriersService.getQuotesForRequest.mockResolvedValue(carrierQuotes);

      const result = await service.getInsuranceOptions(mockQuoteRequest.id);

      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('quoteId', mockQuoteRequest.id);
      expect(result.options.length).toBe(2);

      // First option should be popular choice (lowest price)
      expect(result.options[0].popularChoice).toBe(true);
      expect(result.options[0].annualPremium).toBe(1200);

      // Second option should be best value / recommended
      expect(result.options[1].bestValue).toBe(true);
      expect(result.options[1].recommended).toBe(true);
    });

    it('should filter out declined quotes', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);

      const carrierQuotes = [
        {
          id: 'carrier-quote-1',
          status: 'quoted',
          annualPremium: 1200,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          carrier: { carrierName: 'Test Carrier' },
        },
        {
          id: 'carrier-quote-2',
          status: 'declined',
          declineReason: 'Risk too high',
          carrier: { carrierName: 'Another Carrier' },
        },
      ];

      carriersService.getQuotesForRequest.mockResolvedValue(carrierQuotes);

      const result = await service.getInsuranceOptions(mockQuoteRequest.id);

      expect(result.options.length).toBe(1);
      expect(result.options[0].id).toBe('carrier-quote-1');
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(service.getInsuranceOptions('invalid-id')).rejects.toThrow(
        'Quote request not found',
      );
    });
  });

  describe('submitCompleteQuote', () => {
    const validSubmitDto = {
      insuranceType: 'commercial',
      requestType: 'new_business',
      legalBusinessName: 'Test Corp',
      industry: 'Technology',
      streetAddress: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      contactFirstName: 'John',
      contactLastName: 'Doe',
      contactEmail: 'john@test.com',
      contactPhone: '+15551234567',
      selectedCoverages: ['general_liability', 'professional_liability'],
    } as any;

    it('should create quote, add coverages, and submit in one call', async () => {
      const savedQuoteRequest = {
        ...mockQuoteRequest,
        id: 'new-quote-123',
        status: QuoteRequestStatus.SUBMITTED,
        submittedAt: expect.any(Date),
      };

      quoteRequestRepository.save.mockResolvedValue(savedQuoteRequest);
      quoteRequestCoveragesRepository.create.mockImplementation((data) => data);
      quoteRequestCoveragesRepository.save.mockResolvedValue([
        { coverageType: 'general_liability', isSelected: true },
        { coverageType: 'professional_liability', isSelected: true },
      ]);
      carriersService.requestQuotesFromAllCarriers.mockResolvedValue([]);

      const result = await service.submitCompleteQuote(validSubmitDto);

      // Status could be SUBMITTED or PROCESSING (async processing starts immediately)
      expect([
        QuoteRequestStatus.SUBMITTED,
        QuoteRequestStatus.PROCESSING,
      ]).toContain(result.status);
      expect(quoteRequestRepository.save).toHaveBeenCalled();
      expect(quoteRequestCoveragesRepository.save).toHaveBeenCalled();
    });

    it('should create coverages for all selected coverage types', async () => {
      const savedQuoteRequest = {
        ...mockQuoteRequest,
        id: 'new-quote-123',
        status: QuoteRequestStatus.SUBMITTED,
      };

      quoteRequestRepository.save.mockResolvedValue(savedQuoteRequest);
      quoteRequestCoveragesRepository.create.mockImplementation((data) => data);
      quoteRequestCoveragesRepository.save.mockResolvedValue([]);
      carriersService.requestQuotesFromAllCarriers.mockResolvedValue([]);

      await service.submitCompleteQuote(validSubmitDto);

      // Verify create was called for each coverage
      expect(quoteRequestCoveragesRepository.create).toHaveBeenCalledTimes(2);
      expect(quoteRequestCoveragesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coverageType: 'general_liability',
          isSelected: true,
        }),
      );
      expect(quoteRequestCoveragesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coverageType: 'professional_liability',
          isSelected: true,
        }),
      );
    });

    it('should trigger carrier API calls asynchronously', async () => {
      const savedQuoteRequest = {
        ...mockQuoteRequest,
        id: 'new-quote-123',
        status: QuoteRequestStatus.SUBMITTED,
      };

      quoteRequestRepository.save.mockResolvedValue(savedQuoteRequest);
      quoteRequestCoveragesRepository.create.mockImplementation((data) => data);
      quoteRequestCoveragesRepository.save.mockResolvedValue([]);
      carriersService.requestQuotesFromAllCarriers.mockResolvedValue([
        { id: 'carrier-quote-1', annualPremium: 1200 },
      ]);

      await service.submitCompleteQuote(validSubmitDto);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(carriersService.requestQuotesFromAllCarriers).toHaveBeenCalled();
    });

    it('should fail validation if required fields are missing', async () => {
      const incompleteDto = {
        insuranceType: 'commercial',
        requestType: 'new_business',
        legalBusinessName: 'Test Corp',
        // Missing: industry, address, contact
        selectedCoverages: ['general_liability'],
      } as any;

      const incompleteQuoteRequest = {
        ...incompleteDto,
        id: 'new-quote-123',
        status: QuoteRequestStatus.DRAFT,
      };

      quoteRequestRepository.save.mockResolvedValue(incompleteQuoteRequest);
      quoteRequestCoveragesRepository.create.mockImplementation((data) => data);
      quoteRequestCoveragesRepository.save.mockResolvedValue([]);

      await expect(service.submitCompleteQuote(incompleteDto)).rejects.toThrow(
        'Missing required fields',
      );
    });
  });
});
