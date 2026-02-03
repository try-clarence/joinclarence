import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from './entities/quote-request.entity';
import { QuoteRequestCoverage } from './entities/quote-request-coverage.entity';
import { CarriersService } from '../carriers/carriers.service';

describe('QuotesService', () => {
  let service: QuotesService;
  let quoteRequestRepository: any;
  let quoteRequestCoveragesRepository: any;
  let carriersService: any;
  let module: TestingModule;

  const mockQuoteRequest: Partial<QuoteRequest> = {
    id: 'quote-123',
    sessionId: 'session-123',
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
  };

  beforeEach(async () => {
    const mockQuoteRequestRepository = {
      create: jest.fn(),
      save: jest.fn(),
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

  describe('createQuoteRequest', () => {
    it('should create a new quote request with status DRAFT', async () => {
      const createDto = {
        sessionId: 'session-123',
        insuranceType: 'commercial',
        requestType: 'new_coverage',
        legalBusinessName: 'Test Corp',
        contactEmail: 'test@test.com',
      } as any;

      quoteRequestRepository.save.mockResolvedValue({
        ...mockQuoteRequest,
        status: QuoteRequestStatus.DRAFT,
      });

      const result = await service.createQuoteRequest(createDto);

      expect(result.status).toBe(QuoteRequestStatus.DRAFT);
      expect(quoteRequestRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateQuoteRequest', () => {
    it('should update an existing quote request', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);
      quoteRequestRepository.save.mockResolvedValue({
        ...mockQuoteRequest,
        legalBusinessName: 'Updated Corp',
      });

      const result = await service.updateQuoteRequest(mockQuoteRequest.id, {
        legalBusinessName: 'Updated Corp',
      });

      expect(result.legalBusinessName).toBe('Updated Corp');
      expect(quoteRequestRepository.save).toHaveBeenCalled();
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuoteRequest('invalid-id', {}),
      ).rejects.toThrow('Quote request not found');
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
        selectedCoverages: ['general_liability', 'professional_liability'],
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
      expect(result).toHaveProperty('quotes');
      expect(result.coverages.length).toBe(1);
      expect(result.quotes.length).toBe(1);
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getQuoteRequestWithQuotes('invalid-id'),
      ).rejects.toThrow('Quote request not found');
    });
  });

  describe('getQuoteRequestBySession', () => {
    it('should return quote request by session ID', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(mockQuoteRequest);

      const result = await service.getQuoteRequestBySession('session-123');

      expect(result).toEqual(mockQuoteRequest);
      expect(quoteRequestRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw error if quote request not found', async () => {
      quoteRequestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getQuoteRequestBySession('invalid-session'),
      ).rejects.toThrow('Quote request not found');
    });
  });
});
