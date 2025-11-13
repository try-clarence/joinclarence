import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { RedisService } from '../src/modules/redis/redis.service';
import { SmsService } from '../src/modules/sms/sms.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let userRepository: any;
  let redisService: RedisService;
  let verificationId: string;
  let verificationToken: string;
  let accessToken: string;
  let refreshToken: string;

  const testPhone = '+14155559999';
  const testPassword = 'TestPass123!';

  // Mock SMS service to avoid sending real SMS
  const mockSmsService = {
    sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue(mockSmsService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    // Cleanup test user
    await userRepository.delete({ phone: testPhone });
    await app.close();
  });

  describe('/api/v1/auth/check-phone (POST)', () => {
    it('should return exists: false for new phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/check-phone')
        .send({ phone: testPhone })
        .expect(200)
        .expect((res) => {
          expect(res.body.exists).toBe(false);
          expect(res.body.message).toContain('available');
        });
    });

    it('should return 400 for invalid phone format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/check-phone')
        .send({ phone: 'invalid' })
        .expect(400);
    });

    it('should return 400 for non-US phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/check-phone')
        .send({ phone: '+447911123456' }) // UK number
        .expect(400);
    });
  });

  describe('/api/v1/auth/send-verification-code (POST)', () => {
    it('should send verification code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({
          phone: testPhone,
          purpose: 'registration',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('verificationId');
          expect(res.body).toHaveProperty('expiresAt');
          expect(res.body.message).toContain('sent');
          verificationId = res.body.verificationId;
        });
    });

    it('should return 400 for invalid phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({
          phone: 'invalid',
          purpose: 'registration',
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/verify-code (POST)', () => {
    it('should verify correct code', async () => {
      // Get the code from Redis
      const session = await redisService.getJson<any>(
        `verification:${verificationId}`,
      );
      const code = session.code;

      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId,
          code,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.verified).toBe(true);
          expect(res.body).toHaveProperty('verificationToken');
          expect(res.body).toHaveProperty('expiresAt');
          verificationToken = res.body.verificationToken;
        });
    });

    it('should return 400 for invalid code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId: 'invalid-id',
          code: '000000',
        })
        .expect(404);
    });
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          verificationToken,
          password: testPassword,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('tokens');
          expect(res.body.user.phone).toBe(testPhone);
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.tokens).toHaveProperty('accessToken');
          expect(res.body.tokens).toHaveProperty('refreshToken');
          accessToken = res.body.tokens.accessToken;
          refreshToken = res.body.tokens.refreshToken;
        });
    });

    it('should return 400 for weak password', async () => {
      // Send new verification code
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({
          phone: '+14155558888',
          purpose: 'registration',
        });

      const vid = response.body.verificationId;
      const session = await redisService.getJson<any>(`verification:${vid}`);

      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId: vid,
          code: session.code,
        });

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          verificationToken: verifyResponse.body.verificationToken,
          password: 'weak',
        })
        .expect(400);
    });

    it('should return 409 for existing phone', async () => {
      // Try to register with same phone
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({
          phone: testPhone,
          purpose: 'registration',
        });

      const vid = response.body.verificationId;
      const session = await redisService.getJson<any>(`verification:${vid}`);

      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId: vid,
          code: session.code,
        });

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          verificationToken: verifyResponse.body.verificationToken,
          password: testPassword,
        })
        .expect(409);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          phone: testPhone,
          password: testPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('tokens');
          expect(res.body.user.phone).toBe(testPhone);
          accessToken = res.body.tokens.accessToken;
          refreshToken = res.body.tokens.refreshToken;
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          phone: testPhone,
          password: 'WrongPass123!',
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          phone: '+14155550000',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh (POST)', () => {
    it('should refresh access token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresIn');
          // Update tokens for next tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(204);
    });

    it('should return 401 without access token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({
          refreshToken,
        })
        .expect(401);
    });

    it('should return 401 for blacklisted refresh token', () => {
      // Try to use the same refresh token again
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/forgot-password (POST)', () => {
    it('should send password reset code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          phone: testPhone,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('resetId');
          expect(res.body.message).toContain('sent');
        });
    });

    it('should return 404 for non-existent phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          phone: '+14155550000',
        })
        .expect(404);
    });
  });

  describe('/api/v1/auth/reset-password (POST)', () => {
    let resetId: string;
    let resetCode: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          phone: testPhone,
        });

      resetId = response.body.resetId;

      // Get the code from Redis
      const session = await redisService.getJson<any>(`reset:${resetId}`);
      resetCode = session.code;
    });

    it('should reset password successfully', () => {
      const newPassword = 'NewTestPass123!';

      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          resetId,
          code: resetCode,
          newPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successful');
        });
    });

    it('should login with new password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          phone: testPhone,
          password: 'NewTestPass123!',
        })
        .expect(200);
    });

    it('should not login with old password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          phone: testPhone,
          password: testPassword,
        })
        .expect(401);
    });

    it('should return 400 for invalid reset code', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          phone: testPhone,
        });

      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          resetId: response.body.resetId,
          code: '000000',
          newPassword: 'AnotherPass123!',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce SMS rate limit', async () => {
      const phone = '+14155557777';

      // Send 3 SMS (at limit)
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/send-verification-code')
          .send({
            phone,
            purpose: 'registration',
          })
          .expect(200);
      }

      // 4th attempt should fail
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({
          phone,
          purpose: 'registration',
        })
        .expect(429);
    });
  });
});
