import { Test, TestingModule } from '@nestjs/testing';
import { CarriersController } from './carriers.controller';
import { CarriersService } from './carriers.service';
import { CarrierHealthStatus } from '@/common/enums';

describe('CarriersController', () => {
  let controller: CarriersController;
  let service: CarriersService;

  const mockCarriersService = {
    findActiveCarriers: jest.fn(),
    checkCarrierHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarriersController],
      providers: [
        {
          provide: CarriersService,
          useValue: mockCarriersService,
        },
      ],
    }).compile();

    controller = module.get<CarriersController>(CarriersController);
    service = module.get<CarriersService>(CarriersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActiveCarriers', () => {
    const mockCarriers = [
      {
        id: 'carrier-1',
        carrierCode: 'reliable_insurance',
        carrierName: 'Reliable Insurance Co.',
        specialization: 'General Liability',
        isActive: true,
        supportsPersonal: true,
        supportsCommercial: true,
        supportedCoverages: ['general_liability', 'professional_liability'],
        healthStatus: CarrierHealthStatus.OPERATIONAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'carrier-2',
        carrierCode: 'techshield_underwriters',
        carrierName: 'TechShield Underwriters',
        specialization: 'Cyber Insurance',
        isActive: true,
        supportsPersonal: false,
        supportsCommercial: true,
        supportedCoverages: ['cyber', 'professional_liability'],
        healthStatus: CarrierHealthStatus.OPERATIONAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all active carriers', async () => {
      mockCarriersService.findActiveCarriers.mockResolvedValue(mockCarriers);

      const result = await controller.getActiveCarriers();

      expect(result).toEqual(mockCarriers);
      expect(service.findActiveCarriers).toHaveBeenCalled();
    });

    it('should return empty array when no active carriers', async () => {
      mockCarriersService.findActiveCarriers.mockResolvedValue([]);

      const result = await controller.getActiveCarriers();

      expect(result).toEqual([]);
      expect(service.findActiveCarriers).toHaveBeenCalled();
    });
  });

  describe('checkHealth', () => {
    const carrierId = 'carrier-id-123';

    it('should check carrier health and return success message', async () => {
      mockCarriersService.checkCarrierHealth.mockResolvedValue(undefined);

      const result = await controller.checkHealth(carrierId);

      expect(result).toEqual({ message: 'Health check completed' });
      expect(service.checkCarrierHealth).toHaveBeenCalledWith(carrierId);
    });

    it('should throw error when carrier health check fails', async () => {
      mockCarriersService.checkCarrierHealth.mockRejectedValue(
        new Error('Carrier is unavailable'),
      );

      await expect(controller.checkHealth(carrierId)).rejects.toThrow(
        'Carrier is unavailable',
      );
      expect(service.checkCarrierHealth).toHaveBeenCalledWith(carrierId);
    });
  });
});
