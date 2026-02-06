import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerificationPurpose } from '@/common/enums';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    checkPhone: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkPhone', () => {
    const phone = '+14155551234';

    it('should return exists=false for unregistered phone', async () => {
      const expectedResponse = { exists: false };
      mockAuthService.checkPhone.mockResolvedValue(expectedResponse);

      const result = await controller.checkPhone({ phone });

      expect(result).toEqual(expectedResponse);
      expect(service.checkPhone).toHaveBeenCalledWith(phone);
    });

    it('should return exists=true for registered phone', async () => {
      const expectedResponse = { exists: true };
      mockAuthService.checkPhone.mockResolvedValue(expectedResponse);

      const result = await controller.checkPhone({ phone });

      expect(result).toEqual(expectedResponse);
      expect(service.checkPhone).toHaveBeenCalledWith(phone);
    });
  });

  describe('sendVerificationCode', () => {
    const dto = {
      phone: '+14155551234',
      purpose: VerificationPurpose.REGISTRATION,
    };

    it('should send verification code successfully', async () => {
      const expectedResponse = {
        verificationId: 'ver-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        message: 'Verification code sent',
      };
      mockAuthService.sendVerificationCode.mockResolvedValue(expectedResponse);

      const result = await controller.sendVerificationCode(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.sendVerificationCode).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyCode', () => {
    const dto = {
      verificationId: 'ver-123',
      code: '123456',
    };

    it('should verify code successfully', async () => {
      const expectedResponse = {
        verified: true,
        verificationToken: 'ver-token-123',
      };
      mockAuthService.verifyCode.mockResolvedValue(expectedResponse);

      const result = await controller.verifyCode(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.verifyCode).toHaveBeenCalledWith(dto);
    });

    it('should return verified=false for invalid code', async () => {
      const expectedResponse = {
        verified: false,
        message: 'Invalid code',
      };
      mockAuthService.verifyCode.mockResolvedValue(expectedResponse);

      const result = await controller.verifyCode(dto);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('register', () => {
    const dto = {
      verificationToken: 'ver-token-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
    };

    it('should register a new user successfully', async () => {
      const expectedResponse = {
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+14155551234',
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };
      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    const dto = {
      phone: '+14155551234',
      password: 'SecurePassword123!',
    };

    it('should login successfully with valid credentials', async () => {
      const expectedResponse = {
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+14155551234',
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshToken', () => {
    const dto = {
      refreshToken: 'refresh-token',
    };
    const mockUser = {
      userId: 'user-123',
      phone: '+15551234567',
      jti: 'jwt-id-123',
    };

    it('should refresh token successfully', async () => {
      const expectedResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };
      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(dto, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(service.refreshToken).toHaveBeenCalledWith(
        dto.refreshToken,
        mockUser.userId,
        mockUser.jti,
      );
    });
  });

  describe('logout', () => {
    const dto = {
      refreshToken: 'refresh-token',
    };

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await expect(controller.logout(dto)).resolves.toBeUndefined();
      expect(service.logout).toHaveBeenCalledWith(dto.refreshToken);
    });
  });

  describe('forgotPassword', () => {
    const dto = {
      phone: '+14155551234',
    };

    it('should send password reset code', async () => {
      const expectedResponse = {
        resetId: 'reset-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        message: 'Reset code sent',
      };
      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.forgotPassword).toHaveBeenCalledWith(dto.phone);
    });
  });

  describe('resetPassword', () => {
    const dto = {
      resetId: 'reset-123',
      code: '123456',
      newPassword: 'NewSecurePassword123!',
    };

    it('should reset password successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'Password reset successful',
      };
      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.resetPassword).toHaveBeenCalledWith(
        dto.resetId,
        dto.code,
        dto.newPassword,
      );
    });
  });
});
