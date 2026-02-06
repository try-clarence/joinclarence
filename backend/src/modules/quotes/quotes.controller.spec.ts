import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import {
  SelectCoveragesDto,
  SubmitQuoteDto,
} from './dto/create-quote-request.dto';
import { CoverageType, InsuranceType, RequestType } from '@/common/enums';

describe('QuotesController', () => {
  let controller: QuotesController;
  let service: QuotesService;

  const mockQuotesService = {
    getAllQuoteRequests: jest.fn(),
    submitCompleteQuote: jest.fn(),
    selectCoverages: jest.fn(),
    submitQuoteRequest: jest.fn(),
    getQuoteRequestWithQuotes: jest.fn(),
    getInsuranceOptions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
      ],
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
    service = module.get<QuotesService>(QuotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllQuoteRequests', () => {
    const mockQuotes = [
      {
        id: 'quote-1',
        insuranceType: InsuranceType.COMMERCIAL,
        requestType: RequestType.NEW_BUSINESS,
        legalBusinessName: 'Test Company 1',
        status: 'draft',
        createdAt: new Date(),
      },
      {
        id: 'quote-2',
        insuranceType: InsuranceType.COMMERCIAL,
        requestType: RequestType.NEW_BUSINESS,
        legalBusinessName: 'Test Company 2',
        status: 'submitted',
        createdAt: new Date(),
      },
    ];

    it('should return all quote requests', async () => {
      mockQuotesService.getAllQuoteRequests.mockResolvedValue(mockQuotes);

      const result = await controller.getAllQuoteRequests();

      expect(result).toEqual(mockQuotes);
      expect(service.getAllQuoteRequests).toHaveBeenCalled();
    });
  });

  describe('submitCompleteQuote', () => {
    const submitDto: SubmitQuoteDto = {
      insuranceType: InsuranceType.COMMERCIAL,
      requestType: RequestType.NEW_BUSINESS,
      legalBusinessName: 'Test Company',
      industry: 'Technology',
      streetAddress: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      contactFirstName: 'John',
      contactLastName: 'Doe',
      contactEmail: 'john@test.com',
      contactPhone: '+15551234567',
      selectedCoverages: [CoverageType.GENERAL_LIABILITY],
    };

    const mockSubmittedQuote = {
      id: 'quote-id-123',
      ...submitDto,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should submit a complete quote', async () => {
      mockQuotesService.submitCompleteQuote.mockResolvedValue(
        mockSubmittedQuote,
      );

      const result = await controller.submitCompleteQuote(submitDto);

      expect(result).toEqual(mockSubmittedQuote);
      expect(service.submitCompleteQuote).toHaveBeenCalledWith(submitDto);
    });
  });

  describe('selectCoverages', () => {
    const quoteId = 'quote-id-123';
    const selectCoveragesDto: SelectCoveragesDto = {
      selectedCoverages: [
        CoverageType.GENERAL_LIABILITY,
        CoverageType.PROFESSIONAL_LIABILITY,
      ],
    };

    const mockCoverages = [
      {
        id: '1',
        quoteRequestId: quoteId,
        coverageType: 'general_liability',
        isSelected: true,
      },
      {
        id: '2',
        quoteRequestId: quoteId,
        coverageType: 'professional_liability',
        isSelected: true,
      },
    ];

    it('should select coverages for a quote request', async () => {
      mockQuotesService.selectCoverages.mockResolvedValue(mockCoverages);

      const result = await controller.selectCoverages(
        quoteId,
        selectCoveragesDto,
      );

      expect(result).toEqual(mockCoverages);
      expect(service.selectCoverages).toHaveBeenCalledWith(
        quoteId,
        selectCoveragesDto,
      );
    });
  });

  describe('submitQuoteRequest', () => {
    const quoteId = 'quote-id-123';

    const mockSubmittedQuote = {
      id: quoteId,
      insuranceType: InsuranceType.COMMERCIAL,
      requestType: RequestType.NEW_BUSINESS,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should submit quote request to carriers', async () => {
      mockQuotesService.submitQuoteRequest.mockResolvedValue(
        mockSubmittedQuote,
      );

      const result = await controller.submitQuoteRequest(quoteId);

      expect(result).toEqual(mockSubmittedQuote);
      expect(service.submitQuoteRequest).toHaveBeenCalledWith(quoteId);
    });
  });

  describe('getQuoteRequest', () => {
    const quoteId = 'quote-id-123';

    const mockQuoteWithQuotes = {
      quoteRequest: {
        id: quoteId,
        insuranceType: InsuranceType.COMMERCIAL,
        requestType: RequestType.NEW_BUSINESS,
        status: 'quotes_ready',
      },
      coverages: [{ coverageType: 'general_liability', isSelected: true }],
      quotes: [
        {
          id: 'carrier-quote-1',
          carrierId: 'carrier-1',
          annualPremium: 2500,
          status: 'quoted',
        },
      ],
      options: [
        {
          id: 'carrier-quote-1',
          quoteId: quoteId,
          carrier: 'Test Carrier',
          annualPremium: 2500,
          monthlyPremium: 220,
          status: 'available',
          recommended: true,
        },
      ],
      quoteId: quoteId,
    };

    it('should get quote request with carrier quotes and options', async () => {
      mockQuotesService.getQuoteRequestWithQuotes.mockResolvedValue(
        mockQuoteWithQuotes,
      );

      const result = await controller.getQuoteRequest(quoteId);

      expect(result).toEqual(mockQuoteWithQuotes);
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('quoteId');
      expect(result.options).toHaveLength(1);
      expect(result.quoteId).toBe(quoteId);
      expect(service.getQuoteRequestWithQuotes).toHaveBeenCalledWith(quoteId);
    });
  });

  describe('getInsuranceOptions', () => {
    const quoteId = 'quote-id-123';

    const mockOptions = {
      options: [
        {
          id: 'carrier-quote-1',
          quoteId: quoteId,
          carrier: 'Test Carrier',
          annualPremium: 2500,
          monthlyPremium: 220,
          status: 'available',
          recommended: true,
        },
      ],
      quoteId: quoteId,
    };

    it('should get insurance options for a quote request', async () => {
      mockQuotesService.getInsuranceOptions.mockResolvedValue(mockOptions);

      const result = await controller.getInsuranceOptions(quoteId);

      expect(result).toEqual(mockOptions);
      expect(service.getInsuranceOptions).toHaveBeenCalledWith(quoteId);
    });
  });
});
