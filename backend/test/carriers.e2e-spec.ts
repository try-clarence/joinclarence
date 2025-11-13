import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Carriers E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let carrierId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Get a carrier ID for testing
    const carriers = await dataSource.query('SELECT id FROM carriers LIMIT 1');
    carrierId = carriers[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/carriers', () => {
    it('should return list of active carriers', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('carrierCode');
          expect(res.body[0]).toHaveProperty('carrierName');
          expect(res.body[0]).toHaveProperty('supportedCoverages');
          expect(res.body[0].isActive).toBe(true);
        });
    });

    it('should return carriers with correct structure', () => {
      return request(app.getHttpServer())
        .get('/api/v1/carriers')
        .expect(200)
        .expect((res) => {
          const carrier = res.body[0];
          expect(carrier).toHaveProperty('id');
          expect(carrier).toHaveProperty('carrierCode');
          expect(carrier).toHaveProperty('carrierName');
          expect(carrier).toHaveProperty('specialization');
          expect(carrier).toHaveProperty('apiBaseUrl');
          expect(carrier).toHaveProperty('supportsPersonal');
          expect(carrier).toHaveProperty('supportsCommercial');
          expect(carrier).toHaveProperty('supportedCoverages');
          expect(Array.isArray(carrier.supportedCoverages)).toBe(true);
        });
    });
  });

  describe('GET /api/v1/carriers/:id/health - with actual carrier API', () => {
    it('should check health of a specific carrier (requires auth)', async () => {
      // This endpoint requires authentication
      // First, register a user and get token
      const phone = `+1555${Date.now().toString().slice(-7)}`;

      // Send verification code
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({ phone, purpose: 'registration' })
        .expect(200);

      const verificationId = verifyResponse.body.verificationId;

      // Verify code to get verification token
      const codeResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId,
          code: '111111', // Mock OTP
        })
        .expect(200);

      const verificationToken = codeResponse.body.verificationToken;

      // Register with verification token
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          verificationToken,
          password: 'TestPass123!',
        })
        .expect(201);

      const accessToken = registerRes.body.tokens.accessToken;

      // Now check carrier health
      return request(app.getHttpServer())
        .get(`/api/v1/carriers/${carrierId}/health`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });
});
