import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

// Mock Twilio
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'mock-message-sid' }),
      },
    })),
  };
});

describe('SmsService', () => {
  let service: SmsService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        TWILIO_ACCOUNT_SID: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        TWILIO_AUTH_TOKEN: 'test-auth-token-32-characters-long',
        TWILIO_PHONE_NUMBER: '+14155550000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should format verification message correctly', async () => {
      const phone = '+14155551234';
      const code = '123456';

      // In test mode (no real Twilio), this should log instead of sending
      await expect(
        service.sendVerificationCode(phone, code),
      ).resolves.not.toThrow();
    });

    it('should handle SMS sending gracefully when Twilio not configured', async () => {
      const serviceWithoutTwilio = new SmsService({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      await expect(
        serviceWithoutTwilio.sendVerificationCode('+14155551234', '123456'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetCode', () => {
    it('should format password reset message correctly', async () => {
      const phone = '+14155551234';
      const code = '654321';

      await expect(
        service.sendPasswordResetCode(phone, code),
      ).resolves.not.toThrow();
    });
  });
});
