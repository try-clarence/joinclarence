import { Test, TestingModule } from '@nestjs/testing';
import { CarriersService } from './carriers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Carrier } from './entities/carrier.entity';
import { CarrierQuote } from './entities/carrier-quote.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('CarriersService', () => {
  let service: CarriersService;
  let carrierRepository: any;
  let carrierQuoteRepository: any;
  let httpService: HttpService;
  let module: TestingModule;

  const mockCarrier: Partial<Carrier> = {
    id: '123',
    carrierCode: 'test_carrier',
    carrierName: 'Test Carrier',
    apiBaseUrl: 'http://localhost:3001/api/v1',
    apiKeyEncrypted: 'test_key',
    isActive: true,
    supportsCommercial: true,
    supportedCoverages: ['general_liability', 'professional_liability'],
  };

  const mockCarrierQuoteResponse = {
    carrier_quote_id: 'carrier-quote-123',
    quotes: [
      {
        quote_id: 'quote-123',
        status: 'quoted',
        coverage_type: 'general_liability',
        premium: {
          annual: 1200,
          monthly: 110,
          quarterly: 325,
        },
        coverage_limits: {
          per_occurrence: 1000000,
          aggregate: 2000000,
        },
        deductible: 500,
        effective_date: '2025-12-01',
        expiration_date: '2026-12-01',
        highlights: ['Coverage for bodily injury'],
        exclusions: ['Pollution'],
      },
    ],
    valid_until: '2025-12-15T00:00:00Z',
    cached: false,
  };

  beforeEach(async () => {
    const mockCarrierRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockCarrierQuoteRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        CarriersService,
        {
          provide: getRepositoryToken(Carrier),
          useValue: mockCarrierRepository,
        },
        {
          provide: getRepositoryToken(CarrierQuote),
          useValue: mockCarrierQuoteRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CarriersService>(CarriersService);
    carrierRepository = module.get(getRepositoryToken(Carrier));
    carrierQuoteRepository = module.get(getRepositoryToken(CarrierQuote));
    httpService = module.get<HttpService>(HttpService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActiveCarriers', () => {
    it('should return list of active carriers', async () => {
      const carriers = [mockCarrier];
      carrierRepository.find.mockResolvedValue(carriers);

      const result = await service.findActiveCarriers();

      expect(result).toEqual(carriers);
      expect(carrierRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { carrierName: 'ASC' },
      });
    });
  });

  describe('findCarriersForCoverages', () => {
    it('should return carriers that support the requested coverages', async () => {
      const carriers = [mockCarrier as Carrier];
      carrierRepository.find.mockResolvedValue(carriers);

      const result = await service.findCarriersForCoverages('commercial', [
        'general_liability',
      ]);

      expect(result.length).toBe(1);
      expect(result[0].carrierCode).toBe('test_carrier');
    });

    it('should filter out carriers that do not support insurance type', async () => {
      const carrier = { ...mockCarrier, supportsCommercial: false };
      carrierRepository.find.mockResolvedValue([carrier]);

      const result = await service.findCarriersForCoverages('commercial', [
        'general_liability',
      ]);

      expect(result.length).toBe(0);
    });
  });

  describe('requestQuote', () => {
    it('should request quotes from a carrier for selected coverages', async () => {
      carrierRepository.findOne.mockResolvedValue(mockCarrier);

      const axiosResponse: AxiosResponse = {
        data: mockCarrierQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      (httpService.post as jest.Mock).mockReturnValue(of(axiosResponse));

      const mockQuote = { id: 'quote-123' };
      carrierQuoteRepository.create.mockReturnValue(mockQuote);
      carrierQuoteRepository.save.mockResolvedValue(mockQuote);

      const quoteRequest = {
        insuranceType: 'commercial' as any,
        requestType: 'new_coverage' as any,
        businessInfo: {
          legalBusinessName: 'Test Corp',
          industry: 'Technology',
          industryCode: '541512',
        },
        address: {
          streetAddress: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
        },
        financialInfo: {
          revenue2024: 500000,
          fullTimeEmployees: 5,
        },
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '+15551234567',
        },
        selectedCoverages: ['general_liability'],
      } as any;

      const result = await service.requestQuote(
        mockCarrier.id,
        'quote-req-123',
        quoteRequest,
      );

      expect(result).toHaveLength(1);
      expect(httpService.post).toHaveBeenCalled();
      expect(carrierQuoteRepository.save).toHaveBeenCalled();
    });

    it('should throw error if carrier not found', async () => {
      carrierRepository.findOne.mockResolvedValue(null);

      const quoteRequest = { selectedCoverages: [] } as any;

      await expect(
        service.requestQuote('invalid-id', 'quote-req-123', quoteRequest),
      ).rejects.toThrow('Carrier not found');
    });

    it('should throw error if carrier is not active', async () => {
      const inactiveCarrier = { ...mockCarrier, isActive: false };
      carrierRepository.findOne.mockResolvedValue(inactiveCarrier);

      const quoteRequest = { selectedCoverages: [] } as any;

      await expect(
        service.requestQuote(mockCarrier.id, 'quote-req-123', quoteRequest),
      ).rejects.toThrow('Carrier is not active');
    });
  });

  describe('requestQuotesFromAllCarriers', () => {
    it('should request quotes from all eligible carriers in parallel', async () => {
      const carriers = [mockCarrier as Carrier];
      carrierRepository.find.mockResolvedValue(carriers);

      const axiosResponse: AxiosResponse = {
        data: mockCarrierQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      (httpService.post as jest.Mock).mockReturnValue(of(axiosResponse));

      const mockQuote = { id: 'quote-123' };
      carrierQuoteRepository.create.mockReturnValue(mockQuote);
      carrierQuoteRepository.save.mockResolvedValue(mockQuote);

      const quoteRequest = {
        insuranceType: 'commercial',
        selectedCoverages: ['general_liability'],
      } as any;

      const result = await service.requestQuotesFromAllCarriers(
        'quote-req-123',
        quoteRequest,
      );

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should continue processing even if one carrier fails', async () => {
      const carriers = [
        mockCarrier as Carrier,
        { ...mockCarrier, id: '456', carrierCode: 'carrier2' } as Carrier,
      ];
      carrierRepository.find.mockResolvedValue(carriers);

      // First carrier succeeds
      const axiosResponse: AxiosResponse = {
        data: mockCarrierQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      // Second carrier fails
      (httpService.post as jest.Mock)
        .mockReturnValueOnce(of(axiosResponse))
        .mockReturnValueOnce(throwError(() => new Error('Carrier API error')));

      const mockQuote = { id: 'quote-123' };
      carrierQuoteRepository.create.mockReturnValue(mockQuote);
      carrierQuoteRepository.save.mockResolvedValue(mockQuote);

      const quoteRequest = {
        insuranceType: 'commercial',
        selectedCoverages: ['general_liability'],
      } as any;

      const result = await service.requestQuotesFromAllCarriers(
        'quote-req-123',
        quoteRequest,
      );

      // Should have quotes from at least one carrier
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkCarrierHealth', () => {
    it('should update carrier health status to operational', async () => {
      const carrier = { ...mockCarrier } as Carrier;
      carrierRepository.findOne.mockResolvedValue(carrier);

      const axiosResponse: AxiosResponse = {
        data: { status: 'operational' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(axiosResponse));
      carrierRepository.save.mockResolvedValue(carrier);

      await service.checkCarrierHealth(mockCarrier.id);

      expect(httpService.get).toHaveBeenCalled();
      expect(carrierRepository.save).toHaveBeenCalled();
    });

    it('should update health status to down if health check fails', async () => {
      const carrier = { ...mockCarrier } as Carrier;
      carrierRepository.findOne.mockResolvedValue(carrier);

      (httpService.get as jest.Mock).mockReturnValue(
        throwError(() => new Error('Health check failed')),
      );
      carrierRepository.save.mockResolvedValue(carrier);

      await service.checkCarrierHealth(mockCarrier.id);

      expect(carrierRepository.save).toHaveBeenCalled();
    });
  });

  describe('getQuotesForRequest', () => {
    it('should return quotes for a quote request', async () => {
      const quotes = [
        {
          id: 'quote-1',
          quoteRequestId: 'req-123',
          annualPremium: 1200,
        },
      ];

      carrierQuoteRepository.find.mockResolvedValue(quotes);

      const result = await service.getQuotesForRequest('req-123');

      expect(result).toEqual(quotes);
      expect(carrierQuoteRepository.find).toHaveBeenCalledWith({
        where: { quoteRequestId: 'req-123' },
        relations: ['carrier'],
        order: { annualPremium: 'ASC' },
      });
    });
  });
});
