import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { VerificationPurpose } from './dto/send-verification-code.dto';
import { User, AccountStatus } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let redisService: RedisService;
  let smsService: SmsService;

  const mockUsersService = {
    findByPhone: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setJson: jest.fn(),
    getJson: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    exists: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    phone: '+14155551234',
    passwordHash: 'hashed-password',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    accountStatus: AccountStatus.ACTIVE,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    redisService = module.get<RedisService>(RedisService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPhone', () => {
    it('should return exists: true for registered phone', async () => {
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      const result = await service.checkPhone('+14155551234');

      expect(result.exists).toBe(true);
      expect(result.message).toContain('already registered');
    });

    it('should return exists: false for unregistered phone', async () => {
      mockUsersService.findByPhone.mockResolvedValue(null);

      const result = await service.checkPhone('+14155551234');

      expect(result.exists).toBe(false);
      expect(result.message).toContain('available');
    });
  });

  describe('sendVerificationCode', () => {
    it('should send SMS verification code', async () => {
      mockRedisService.get.mockResolvedValue(null); // No rate limit
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockSmsService.sendVerificationCode.mockResolvedValue(undefined);

      const result = await service.sendVerificationCode({
        phone: '+14155551234',
        purpose: VerificationPurpose.REGISTRATION,
      });

      expect(result).toHaveProperty('verificationId');
      expect(result).toHaveProperty('expiresAt');
      expect(result.message).toContain('sent');
      expect(smsService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw error when rate limit exceeded', async () => {
      mockRedisService.get.mockResolvedValue('3'); // Already at limit

      await expect(
        service.sendVerificationCode({
          phone: '+14155551234',
          purpose: VerificationPurpose.REGISTRATION,
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should send password reset code for password-reset purpose', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockSmsService.sendPasswordResetCode.mockResolvedValue(undefined);

      await service.sendVerificationCode({
        phone: '+14155551234',
        purpose: VerificationPurpose.PASSWORD_RESET,
      });

      expect(smsService.sendPasswordResetCode).toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    const verificationSession = {
      phone: '+14155551234',
      code: '123456',
      attempts: 0,
      purpose: VerificationPurpose.REGISTRATION,
      createdAt: Date.now(),
    };

    it('should verify valid code', async () => {
      mockRedisService.getJson.mockResolvedValue(verificationSession);
      mockRedisService.del.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('verification-token');

      const result = await service.verifyCode({
        verificationId: 'test-id',
        code: '123456',
      });

      expect(result.verified).toBe(true);
      expect(result.verificationToken).toBe('verification-token');
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should throw error for invalid code', async () => {
      mockRedisService.getJson.mockResolvedValue(verificationSession);
      mockRedisService.setJson.mockResolvedValue(undefined);

      await expect(
        service.verifyCode({
          verificationId: 'test-id',
          code: 'wrong-code',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error after max attempts', async () => {
      const exhaustedSession = { ...verificationSession, attempts: 3 };
      mockRedisService.getJson.mockResolvedValue(exhaustedSession);
      mockRedisService.del.mockResolvedValue(undefined);

      await expect(
        service.verifyCode({
          verificationId: 'test-id',
          code: 'wrong-code',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw error for expired session', async () => {
      mockRedisService.getJson.mockResolvedValue(null);

      await expect(
        service.verifyCode({
          verificationId: 'test-id',
          code: '123456',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockJwtService.verify.mockReturnValue({
        phone: '+14155551234',
        type: 'verification',
      });
      mockUsersService.findByPhone.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register({
        verificationToken: 'valid-token',
        password: 'SecurePass123!',
        email: 'test@example.com',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.phone).toBe('+14155551234');
    });

    it('should throw error for invalid verification token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.register({
          verificationToken: 'invalid-token',
          password: 'SecurePass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for existing user', async () => {
      mockJwtService.verify.mockReturnValue({
        phone: '+14155551234',
        type: 'verification',
      });
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      await expect(
        service.register({
          verificationToken: 'valid-token',
          password: 'SecurePass123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockRedisService.get.mockResolvedValue(null); // No failed attempts
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(undefined);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login({
        phone: '+14155551234',
        password: 'correct-password',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid credentials', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      await expect(
        service.login({
          phone: '+14155551234',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error when account is locked', async () => {
      mockRedisService.get.mockResolvedValue('5'); // Already locked

      await expect(
        service.login({
          phone: '+14155551234',
          password: 'any-password',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should lock account after 5 failed attempts', async () => {
      mockRedisService.get.mockResolvedValue('4'); // 4th attempt
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      await expect(
        service.login({
          phone: '+14155551234',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockRedisService.exists.mockResolvedValue(false); // Not blacklisted
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshToken(
        'old-refresh-token',
        mockUser.id,
        'old-jti',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(redisService.setJson).toHaveBeenCalledWith(
        'blacklist:old-jti',
        expect.any(Object),
        604800,
      );
    });

    it('should throw error for blacklisted token', async () => {
      mockRedisService.exists.mockResolvedValue(true);

      await expect(
        service.refreshToken('token', 'user-id', 'jti'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for non-existent user', async () => {
      mockRedisService.exists.mockResolvedValue(false);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken('token', 'invalid-id', 'jti'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset code', async () => {
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.setJson.mockResolvedValue(undefined);
      mockSmsService.sendPasswordResetCode.mockResolvedValue(undefined);

      const result = await service.forgotPassword('+14155551234');

      expect(result).toHaveProperty('resetId');
      expect(result.message).toContain('sent');
      expect(smsService.sendPasswordResetCode).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      mockUsersService.findByPhone.mockResolvedValue(null);

      await expect(service.forgotPassword('+14155551234')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resetPassword', () => {
    const resetSession = {
      phone: '+14155551234',
      code: '123456',
      attempts: 0,
      purpose: VerificationPurpose.PASSWORD_RESET,
      createdAt: Date.now(),
    };

    it('should reset password successfully', async () => {
      mockRedisService.getJson.mockResolvedValue(resetSession);
      mockRedisService.del.mockResolvedValue(undefined);
      mockUsersService.findByPhone.mockResolvedValue(mockUser);
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      const result = await service.resetPassword(
        'reset-id',
        '123456',
        'NewSecurePass123!',
      );

      expect(result.message).toContain('successful');
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'NewSecurePass123!',
      );
    });

    it('should throw error for invalid code', async () => {
      mockRedisService.getJson.mockResolvedValue(resetSession);
      mockRedisService.setJson.mockResolvedValue(undefined);

      await expect(
        service.resetPassword('reset-id', 'wrong-code', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for expired session', async () => {
      mockRedisService.getJson.mockResolvedValue(null);

      await expect(
        service.resetPassword('reset-id', '123456', 'NewPass123!'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should blacklist refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        jti: 'token-jti',
      });
      mockRedisService.setJson.mockResolvedValue(undefined);

      await service.logout('valid-refresh-token');

      expect(redisService.setJson).toHaveBeenCalledWith(
        'blacklist:token-jti',
        expect.any(Object),
        604800,
      );
    });

    it('should handle invalid tokens gracefully', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Should not throw
      await expect(service.logout('invalid-token')).resolves.toBeUndefined();
    });
  });
});
