import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Payments E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Set simulation mode for tests
    process.env.SIMULATE_PAYMENTS = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a user for testing
    const phone = `+1555${Date.now().toString().slice(-7)}`;

    // Send verification code
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-code')
      .send({ phone, purpose: 'registration' })
      .expect(200);

    const verificationId = verifyResponse.body.verificationId;

    // Verify code
    const codeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-code')
      .send({
        verificationId,
        code: '111111',
      })
      .expect(200);

    const verificationToken = codeResponse.body.verificationToken;

    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        verificationToken,
        password: 'TestPass123!',
      })
      .expect(201);

    accessToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test user
    if (userId) {
      await dataSource.query('DELETE FROM payments WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM policies WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    await app.close();
  });

  describe('POST /api/v1/payments/checkout', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .send({
          carrierQuoteId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(401);
    });

    it('should fail with non-existent quote', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrierQuoteId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('should fail with invalid UUID format', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrierQuoteId: 'invalid-uuid',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/payments/session/:sessionId', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments/session/sim_123456')
        .expect(401);
    });

    it('should return simulated session for sim_ prefixed IDs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments/session/sim_test_12345')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe('sim_test_12345');
      expect(response.body.payment_status).toBe('paid');
      expect(response.body.status).toBe('complete');
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should acknowledge webhook in simulation mode', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send({ type: 'checkout.session.completed' })
        .expect(201);

      expect(response.body.received).toBe(true);
    });
  });
});

describe('Payments E2E Tests - With Quote', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let quoteRequestId: string;
  let carrierQuoteId: string;

  beforeAll(async () => {
    // Set simulation mode for tests
    process.env.SIMULATE_PAYMENTS = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a user
    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-code')
      .send({ phone, purpose: 'registration' })
      .expect(200);

    const codeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-code')
      .send({
        verificationId: verifyResponse.body.verificationId,
        code: '111111',
      })
      .expect(200);

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        verificationToken: codeResponse.body.verificationToken,
        password: 'TestPass123!',
      })
      .expect(201);

    accessToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;

    // Create a quote request
    const quoteResponse = await request(app.getHttpServer())
      .post('/api/v1/quotes/submit')
      .send({
        userId,
        insuranceType: 'commercial',
        requestType: 'new_business',
        legalBusinessName: 'Test Business LLC',
        industry: 'Technology',
        streetAddress: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        contactFirstName: 'John',
        contactLastName: 'Doe',
        contactEmail: 'john@test.com',
        contactPhone: '+15551234567',
        selectedCoverages: ['general_liability'],
      })
      .expect(201);

    quoteRequestId = quoteResponse.body.id;

    // Wait for quotes to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the insurance options to find a carrier quote
    const optionsResponse = await request(app.getHttpServer())
      .get(`/api/v1/quotes/${quoteRequestId}/options`)
      .expect(200);

    if (
      optionsResponse.body.options &&
      optionsResponse.body.options.length > 0
    ) {
      carrierQuoteId = optionsResponse.body.options[0].id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await dataSource.query('DELETE FROM payments WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM policies WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query(
        'DELETE FROM carrier_quotes WHERE quote_request_id IN (SELECT id FROM quote_requests WHERE user_id = $1)',
        [userId],
      );
      await dataSource.query(
        'DELETE FROM quote_request_coverages WHERE quote_request_id IN (SELECT id FROM quote_requests WHERE user_id = $1)',
        [userId],
      );
      await dataSource.query('DELETE FROM quote_requests WHERE user_id = $1', [
        userId,
      ]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    await app.close();
  });

  describe('POST /api/v1/payments/checkout (with valid quote)', () => {
    it('should create simulated checkout session for valid quote', async () => {
      if (!carrierQuoteId) {
        console.log('Skipping test - no carrier quotes available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrierQuoteId,
        })
        .expect(201);

      expect(response.body.sessionId).toBeDefined();
      expect(response.body.sessionId).toMatch(/^sim_/);
      expect(response.body.checkoutUrl).toBeDefined();
    });

    it('should create checkout with custom URLs', async () => {
      if (!carrierQuoteId) {
        console.log('Skipping test - no carrier quotes available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrierQuoteId,
          successUrl: 'https://custom.com/success',
          cancelUrl: 'https://custom.com/cancel',
        })
        .expect(201);

      expect(response.body.sessionId).toBeDefined();
      expect(response.body.checkoutUrl).toBe('https://custom.com/success');
    });
  });
});
