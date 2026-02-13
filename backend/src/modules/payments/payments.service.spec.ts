import { CoverageType, PolicyStatus } from '@/common/enums';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CarrierQuote } from '../carriers/entities/carrier-quote.entity';
import { PoliciesService } from '../policies/policies.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let carrierQuoteRepository: any;
  let module: TestingModule;

  const mockCarrierQuote: Partial<CarrierQuote> = {
    id: 'quote-123',
    quoteRequestId: 'req-123',
    carrierId: 'carrier-123',
    carrierQuoteId: 'cq-123',
    coverageType: CoverageType.GENERAL_LIABILITY,
    annualPremium: 5000,
    monthlyPremium: 450,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    carrier: {
      id: 'carrier-123',
      carrierCode: 'TEST',
      carrierName: 'Test Carrier',
    } as any,
  };

  const mockPolicy = {
    id: 'policy-123',
    policyNumber: 'POL-2024-001',
    userId: 'user-123',
    status: PolicyStatus.ACTIVE,
    effectiveDate: new Date(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const mockCarrierQuoteRepository = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          SIMULATE_PAYMENTS: 'true',
          FRONTEND_URL: 'http://localhost:3002',
        };
        return config[key];
      }),
    };

    const mockPoliciesService = {
      bindPolicy: jest.fn().mockResolvedValue({
        policy: mockPolicy,
        transactionId: 'txn-123',
      }),
    };

    module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(CarrierQuote),
          useValue: mockCarrierQuoteRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PoliciesService,
          useValue: mockPoliciesService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    carrierQuoteRepository = module.get(getRepositoryToken(CarrierQuote));
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should create a simulated checkout session when SIMULATE_PAYMENTS is true', async () => {
      carrierQuoteRepository.findOne.mockResolvedValue(mockCarrierQuote);

      const dto = {
        carrierQuoteId: 'quote-123',
      };

      const result = await service.createCheckoutSession(dto, 'user-123');

      expect(result).toBeDefined();
      expect(result.sessionId).toMatch(/^sim_/);
      expect(result.checkoutUrl).toBeDefined();
    });

    it('should throw NOT_FOUND if quote does not exist', async () => {
      carrierQuoteRepository.findOne.mockResolvedValue(null);

      const dto = {
        carrierQuoteId: 'invalid-quote',
      };

      await expect(
        service.createCheckoutSession(dto, 'user-123'),
      ).rejects.toThrow(
        new HttpException('Quote not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw BAD_REQUEST if quote has expired', async () => {
      const expiredQuote = {
        ...mockCarrierQuote,
        validUntil: new Date(Date.now() - 1000), // Expired
      };
      carrierQuoteRepository.findOne.mockResolvedValue(expiredQuote);

      const dto = {
        carrierQuoteId: 'quote-123',
      };

      await expect(
        service.createCheckoutSession(dto, 'user-123'),
      ).rejects.toThrow(
        new HttpException('Quote has expired', HttpStatus.BAD_REQUEST),
      );
    });

    it('should use custom success URL when provided', async () => {
      carrierQuoteRepository.findOne.mockResolvedValue(mockCarrierQuote);

      const dto = {
        carrierQuoteId: 'quote-123',
        successUrl: 'https://custom.com/success',
      };

      const result = await service.createCheckoutSession(dto, 'user-123');

      expect(result.checkoutUrl).toBe('https://custom.com/success');
    });
  });

  describe('handleWebhook', () => {
    it('should return received: true in simulation mode', async () => {
      const result = await service.handleWebhook(
        Buffer.from('test'),
        'test-signature',
      );

      expect(result).toEqual({ received: true });
    });
  });

  describe('getCheckoutSession', () => {
    it('should return simulated session for sim_ prefixed session IDs', async () => {
      const result = await service.getCheckoutSession('sim_12345');

      expect(result).toBeDefined();
      expect(result.id).toBe('sim_12345');
      expect(result.payment_status).toBe('paid');
      expect(result.status).toBe('complete');
    });
  });
});

describe('PaymentsService (non-simulation mode)', () => {
  let service: PaymentsService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockCarrierQuoteRepository = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          SIMULATE_PAYMENTS: 'false',
          STRIPE_SECRET_KEY: 'sk_test_fake',
          STRIPE_WEBHOOK_SECRET: 'whsec_fake',
          FRONTEND_URL: 'http://localhost:3002',
        };
        return config[key];
      }),
    };

    const mockPoliciesService = {
      bindPolicy: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(CarrierQuote),
          useValue: mockCarrierQuoteRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PoliciesService,
          useValue: mockPoliciesService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWebhook (non-simulation)', () => {
    it('should reject invalid webhook signature', async () => {
      await expect(
        service.handleWebhook(Buffer.from('invalid'), 'invalid-signature'),
      ).rejects.toThrow(
        new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
