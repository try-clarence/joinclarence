import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { BindPolicyDto } from './dto/bind-policy.dto';
import { RenewPolicyDto } from './dto/renew-policy.dto';
import { PaymentPlan, PolicyStatus } from '@/common/enums';

describe('PoliciesController', () => {
  let controller: PoliciesController;
  let service: PoliciesService;

  const mockPoliciesService = {
    bindPolicy: jest.fn(),
    renewPolicy: jest.fn(),
    getUserPolicies: jest.fn(),
    getActivePolicies: jest.fn(),
    getPoliciesExpiringSoon: jest.fn(),
    getPolicyById: jest.fn(),
    getPolicyByNumber: jest.fn(),
    cancelPolicy: jest.fn(),
  };

  const mockUserId = 'user-id-123';
  const mockRequest = {
    user: {
      userId: mockUserId,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoliciesController],
      providers: [
        {
          provide: PoliciesService,
          useValue: mockPoliciesService,
        },
      ],
    }).compile();

    controller = module.get<PoliciesController>(PoliciesController);
    service = module.get<PoliciesService>(PoliciesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('bindPolicy', () => {
    const bindPolicyDto: BindPolicyDto = {
      carrierQuoteId: 'carrier-quote-123',
      paymentPlan: PaymentPlan.ANNUAL,
      autoRenewal: true,
    };

    const mockBindResponse = {
      policy: {
        id: 'policy-id-123',
        userId: mockUserId,
        policyNumber: 'POL-123456',
        carrierQuoteId: bindPolicyDto.carrierQuoteId,
        status: PolicyStatus.BOUND,
        paymentPlan: PaymentPlan.ANNUAL,
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      transactionId: 'payment-id-123',
    };

    const user = {
      userId: mockUserId,
      phone: '+15551234567',
    };

    it('should bind a policy from a carrier quote', async () => {
      mockPoliciesService.bindPolicy.mockResolvedValue(mockBindResponse);

      const result = await controller.bindPolicy(bindPolicyDto, user);

      expect(result).toEqual(mockBindResponse);
      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('policy');
      expect(service.bindPolicy).toHaveBeenCalledWith(
        bindPolicyDto,
        mockUserId,
      );
    });
  });

  describe('getUserPolicies', () => {
    const mockPolicies = [
      {
        id: 'policy-1',
        userId: mockUserId,
        policyNumber: 'POL-001',
        status: PolicyStatus.ACTIVE,
      },
      {
        id: 'policy-2',
        userId: mockUserId,
        policyNumber: 'POL-002',
        status: PolicyStatus.ACTIVE,
      },
    ];

    it('should get all policies for authenticated user', async () => {
      mockPoliciesService.getUserPolicies.mockResolvedValue(mockPolicies);

      const result = await controller.getUserPolicies(mockRequest);

      expect(result).toEqual(mockPolicies);
      expect(service.getUserPolicies).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getActivePolicies', () => {
    const mockActivePolicies = [
      {
        id: 'policy-1',
        userId: mockUserId,
        policyNumber: 'POL-001',
        status: PolicyStatus.ACTIVE,
      },
    ];

    it('should get active policies for authenticated user', async () => {
      mockPoliciesService.getActivePolicies.mockResolvedValue(
        mockActivePolicies,
      );

      const result = await controller.getActivePolicies(mockRequest);

      expect(result).toEqual(mockActivePolicies);
      expect(service.getActivePolicies).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getPoliciesExpiringSoon', () => {
    const mockExpiringPolicies = [
      {
        id: 'policy-1',
        userId: mockUserId,
        policyNumber: 'POL-001',
        status: PolicyStatus.ACTIVE,
        expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      },
    ];

    it('should get policies expiring soon for authenticated user', async () => {
      mockPoliciesService.getPoliciesExpiringSoon.mockResolvedValue(
        mockExpiringPolicies,
      );

      const result = await controller.getPoliciesExpiringSoon(mockRequest);

      expect(result).toEqual(mockExpiringPolicies);
      expect(service.getPoliciesExpiringSoon).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getPolicy', () => {
    const policyId = 'policy-id-123';
    const mockPolicy = {
      id: policyId,
      userId: mockUserId,
      policyNumber: 'POL-001',
      status: PolicyStatus.ACTIVE,
    };

    it('should get a specific policy by ID', async () => {
      mockPoliciesService.getPolicyById.mockResolvedValue(mockPolicy);

      const result = await controller.getPolicy(policyId);

      expect(result).toEqual(mockPolicy);
      expect(service.getPolicyById).toHaveBeenCalledWith(policyId);
    });
  });

  describe('getPolicyByNumber', () => {
    const policyNumber = 'POL-001';
    const mockPolicy = {
      id: 'policy-id-123',
      userId: mockUserId,
      policyNumber: policyNumber,
      status: PolicyStatus.ACTIVE,
    };

    it('should get a policy by policy number', async () => {
      mockPoliciesService.getPolicyByNumber.mockResolvedValue(mockPolicy);

      const result = await controller.getPolicyByNumber(policyNumber);

      expect(result).toEqual(mockPolicy);
      expect(service.getPolicyByNumber).toHaveBeenCalledWith(policyNumber);
    });
  });

  describe('cancelPolicy', () => {
    const policyId = 'policy-id-123';
    const reason = 'No longer needed';

    const mockCancelledPolicy = {
      id: policyId,
      userId: mockUserId,
      policyNumber: 'POL-001',
      status: PolicyStatus.CANCELLED,
      cancelledAt: new Date(),
    };

    it('should cancel a policy with a reason', async () => {
      mockPoliciesService.cancelPolicy.mockResolvedValue(mockCancelledPolicy);

      const result = await controller.cancelPolicy(policyId, reason);

      expect(result).toEqual(mockCancelledPolicy);
      expect(service.cancelPolicy).toHaveBeenCalledWith(policyId, reason);
    });

    it('should cancel a policy without a reason', async () => {
      mockPoliciesService.cancelPolicy.mockResolvedValue(mockCancelledPolicy);

      const result = await controller.cancelPolicy(policyId, undefined);

      expect(result).toEqual(mockCancelledPolicy);
      expect(service.cancelPolicy).toHaveBeenCalledWith(policyId, undefined);
    });
  });

  describe('renewPolicy', () => {
    const policyId = 'policy-id-123';
    const renewPolicyDto: RenewPolicyDto = {
      paymentPlan: PaymentPlan.ANNUAL,
    };

    const user = {
      userId: mockUserId,
      phone: '+15551234567',
    };

    const mockRenewResponse = {
      policy: {
        id: 'new-policy-id-456',
        userId: mockUserId,
        policyNumber: 'POL-RENEWED-456',
        status: PolicyStatus.BOUND,
        paymentPlan: PaymentPlan.ANNUAL,
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      transactionId: 'payment-id-456',
    };

    it('should renew a policy', async () => {
      mockPoliciesService.renewPolicy.mockResolvedValue(mockRenewResponse);

      const result = await controller.renewPolicy(
        policyId,
        renewPolicyDto,
        user,
      );

      expect(result).toEqual(mockRenewResponse);
      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('policy');
      expect(service.renewPolicy).toHaveBeenCalledWith(
        policyId,
        renewPolicyDto,
        mockUserId,
      );
    });
  });
});
