import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { v4 as uuidv4 } from 'uuid';
import {
  SendVerificationCodeDto,
  VerificationPurpose,
} from './dto/send-verification-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface VerificationSession {
  phone: string;
  code: string;
  attempts: number;
  purpose: VerificationPurpose;
  createdAt: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
    private smsService: SmsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async checkPhone(phone: string) {
    const user = await this.usersService.findByPhone(phone);
    return {
      exists: !!user,
      message: user
        ? 'This number is already registered. Please log in.'
        : 'Phone number is available',
    };
  }

  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const { phone, purpose } = dto;

    // Check rate limiting
    await this.checkRateLimit(phone, 'sms');

    // Generate 6-digit code
    const code = this.generateCode();
    const verificationId = uuidv4();

    // Store in Redis (10 minutes TTL)
    const session: VerificationSession = {
      phone,
      code,
      attempts: 0,
      purpose,
      createdAt: Date.now(),
    };

    await this.redisService.setJson(
      `verification:${verificationId}`,
      session,
      600, // 10 minutes
    );

    // Send SMS
    if (purpose === VerificationPurpose.REGISTRATION) {
      await this.smsService.sendVerificationCode(phone, code);
    } else {
      await this.smsService.sendPasswordResetCode(phone, code);
    }

    const expiresAt = new Date(Date.now() + 600000).toISOString();

    return {
      verificationId,
      expiresAt,
      message: 'Verification code sent to your phone',
    };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const { verificationId, code } = dto;

    const session = await this.redisService.getJson<VerificationSession>(
      `verification:${verificationId}`,
    );

    if (!session) {
      throw new NotFoundException('Verification session not found or expired');
    }

    // Check attempts
    if (session.attempts >= 3) {
      await this.redisService.del(`verification:${verificationId}`);
      throw new HttpException(
        'Too many failed attempts. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify code
    if (session.code !== code) {
      session.attempts++;
      await this.redisService.setJson(
        `verification:${verificationId}`,
        session,
        600,
      );

      throw new BadRequestException(
        `Invalid verification code. ${3 - session.attempts} attempts remaining.`,
      );
    }

    // Delete verification session
    await this.redisService.del(`verification:${verificationId}`);

    // Generate verification token (valid for 15 minutes)
    const verificationToken = this.jwtService.sign(
      {
        phone: session.phone,
        purpose: session.purpose,
        type: 'verification',
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const expiresAt = new Date(Date.now() + 900000).toISOString();

    return {
      verified: true,
      verificationToken,
      expiresAt,
    };
  }

  async register(dto: RegisterDto) {
    const { verificationToken, password, email, firstName, lastName } = dto;

    // Verify token
    let payload: any;
    try {
      payload = this.jwtService.verify(verificationToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (payload.type !== 'verification') {
      throw new BadRequestException('Invalid verification token');
    }

    const { phone } = payload;

    // Check if user already exists
    const existingUser = await this.usersService.findByPhone(phone);
    if (existingUser) {
      throw new ConflictException(
        'An account with this phone number already exists',
      );
    }

    // Create user
    const user = await this.usersService.create(
      phone,
      password,
      email,
      firstName,
      lastName,
    );

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const { phone, password } = dto;

    // Check if account is locked
    await this.checkAccountLock(phone);

    // Find user
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      await this.recordFailedLogin(phone);
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Verify password
    const isValidPassword = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isValidPassword) {
      await this.recordFailedLogin(phone);
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Clear failed login attempts
    await this.redisService.del(`failed-login:${phone}`);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string, userId: string, jti: string) {
    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.exists(`blacklist:${jti}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Get user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Blacklist old refresh token
    await this.redisService.setJson(
      `blacklist:${jti}`,
      { userId, blacklistedAt: Date.now() },
      604800, // 7 days
    );

    // Generate new tokens
    return this.generateTokens(user.id, user.phone);
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Blacklist refresh token
      await this.redisService.setJson(
        `blacklist:${payload.jti}`,
        { userId: payload.sub, blacklistedAt: Date.now() },
        604800, // 7 days
      );
    } catch (error) {
      // Token already invalid, no action needed
    }
  }

  async forgotPassword(phone: string) {
    // Check if user exists
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('No account found with this phone number');
    }

    // Check rate limiting
    await this.checkRateLimit(phone, 'password-reset');

    // Generate reset code
    const code = this.generateCode();
    const resetId = uuidv4();

    // Store in Redis (15 minutes TTL)
    const session: VerificationSession = {
      phone,
      code,
      attempts: 0,
      purpose: VerificationPurpose.PASSWORD_RESET,
      createdAt: Date.now(),
    };

    await this.redisService.setJson(`reset:${resetId}`, session, 900); // 15 minutes

    // Send SMS
    await this.smsService.sendPasswordResetCode(phone, code);

    return {
      resetId,
      message: 'Password reset code sent to your phone',
    };
  }

  async resetPassword(resetId: string, code: string, newPassword: string) {
    const session = await this.redisService.getJson<VerificationSession>(
      `reset:${resetId}`,
    );

    if (!session) {
      throw new NotFoundException('Reset session not found or expired');
    }

    // Check attempts
    if (session.attempts >= 3) {
      await this.redisService.del(`reset:${resetId}`);
      throw new HttpException(
        'Too many failed attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify code
    if (session.code !== code) {
      session.attempts++;
      await this.redisService.setJson(`reset:${resetId}`, session, 900);
      throw new BadRequestException('Invalid reset code');
    }

    // Delete reset session
    await this.redisService.del(`reset:${resetId}`);

    // Find user and update password
    const user = await this.usersService.findByPhone(session.phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  // Helper methods
  private async generateTokens(userId: string, phone: string) {
    const jti = uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, phone, type: 'access' },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, phone, type: 'refresh', jti },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async checkRateLimit(phone: string, type: string) {
    const key = `rate-limit:${type}:${phone}`;
    const limit = type === 'sms' ? 3 : 3; // 3 per hour
    const ttl = 3600; // 1 hour

    const current = await this.redisService.get(key);

    if (current && parseInt(current) >= limit) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (current) {
      await this.redisService.incr(key);
    } else {
      await this.redisService.set(key, '1', ttl);
    }
  }

  private async recordFailedLogin(phone: string) {
    const key = `failed-login:${phone}`;
    const attempts = await this.redisService.get(key);

    if (attempts) {
      const newAttempts = parseInt(attempts) + 1;
      await this.redisService.set(key, newAttempts.toString(), 900); // 15 minutes

      if (newAttempts >= 5) {
        throw new HttpException(
          'Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.',
          423, // HTTP 423 Locked
        );
      }
    } else {
      await this.redisService.set(key, '1', 900);
    }
  }

  private async checkAccountLock(phone: string) {
    const key = `failed-login:${phone}`;
    const attempts = await this.redisService.get(key);

    if (attempts && parseInt(attempts) >= 5) {
      throw new HttpException(
        'Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.',
        423, // HTTP 423 Locked
      );
    }
  }
}

