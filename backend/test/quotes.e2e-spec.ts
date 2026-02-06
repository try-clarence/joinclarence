import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Quotes E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let quoteRequestId: string;
  let unifiedQuoteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
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
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a user for authenticated tests
    const phone = `+1555${Date.now().toString().slice(-7)}`;

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-code')
      .send({ phone, purpose: 'registration' })
      .expect(200);

    const verificationId = verifyResponse.body.verificationId;

    const codeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-code')
      .send({
        verificationId,
        code: '111111',
      })
      .expect(200);

    const verificationToken = codeResponse.body.verificationToken;

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
    // Cleanup test data - order matters due to foreign key constraints
    try {
      // Clean up main quote request
      if (quoteRequestId) {
        await dataSource.query(
          'DELETE FROM carrier_quotes WHERE quote_request_id = $1',
          [quoteRequestId],
        );
        await dataSource.query(
          'DELETE FROM quote_request_coverages WHERE quote_request_id = $1',
          [quoteRequestId],
        );
        await dataSource.query('DELETE FROM quote_requests WHERE id = $1', [
          quoteRequestId,
        ]);
      }
      // Clean up unified quote request
      if (unifiedQuoteId) {
        await dataSource.query(
          'DELETE FROM carrier_quotes WHERE quote_request_id = $1',
          [unifiedQuoteId],
        );
        await dataSource.query(
          'DELETE FROM quote_request_coverages WHERE quote_request_id = $1',
          [unifiedQuoteId],
        );
        await dataSource.query('DELETE FROM quote_requests WHERE id = $1', [
          unifiedQuoteId,
        ]);
      }
      // Clean up any quotes by session ID (in case IDs weren't captured)
      await dataSource.query(
        `DELETE FROM carrier_quotes WHERE quote_request_id IN
         (SELECT id FROM quote_requests WHERE session_id LIKE 'test-%')`,
      );
      await dataSource.query(
        `DELETE FROM quote_request_coverages WHERE quote_request_id IN
         (SELECT id FROM quote_requests WHERE session_id LIKE 'test-%')`,
      );
      await dataSource.query(
        `DELETE FROM quote_requests WHERE session_id LIKE 'test-%'`,
      );
      if (userId) {
        // Delete any remaining quotes for this user first
        await dataSource.query(
          'DELETE FROM carrier_quotes WHERE quote_request_id IN (SELECT id FROM quote_requests WHERE user_id = $1)',
          [userId],
        );
        await dataSource.query(
          'DELETE FROM quote_request_coverages WHERE quote_request_id IN (SELECT id FROM quote_requests WHERE user_id = $1)',
          [userId],
        );
        await dataSource.query(
          'DELETE FROM quote_requests WHERE user_id = $1',
          [userId],
        );
        await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  describe('GET /api/v1/quotes', () => {
    it('should return all quote requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/quotes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/quotes/submit (Unified Submission)', () => {
    it('should create and submit quote in one call', async () => {
      const completeQuoteData = {
        insuranceType: 'commercial',
        requestType: 'new_business',
        legalBusinessName: 'Unified Test LLC',
        dbaName: 'Unified Test',
        industry: 'Technology',
        businessDescription: 'Software development',
        streetAddress: '789 Unified Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        contactFirstName: 'Unified',
        contactLastName: 'Tester',
        contactEmail: 'unified@test.com',
        contactPhone: '+15559876543',
        selectedCoverages: ['general_liability', 'professional_liability'],
        fullTimeEmployees: 10,
        revenue2024: 1000000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/quotes/submit')
        .send(completeQuoteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // Status can be 'submitted' or 'processing' (async processing starts immediately)
      expect(['submitted', 'processing']).toContain(response.body.status);
      expect(response.body.legalBusinessName).toBe('Unified Test LLC');

      unifiedQuoteId = response.body.id;
      quoteRequestId = response.body.id;

      // CRITICAL: Verify quote exists and has coverages (not empty)
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${unifiedQuoteId}`)
        .expect(200);

      expect(getResponse.body.quoteRequest).toBeDefined();
      expect(getResponse.body.quoteRequest.id).toBe(unifiedQuoteId);
      expect(getResponse.body.coverages).toBeDefined();
      expect(getResponse.body.coverages.length).toBe(2);

      const coverageTypes = getResponse.body.coverages.map(
        (c: any) => c.coverageType,
      );
      expect(coverageTypes).toContain('general_liability');
      expect(coverageTypes).toContain('professional_liability');
    }, 30000);

    it('should fail without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes/submit')
        .send({
          insuranceType: 'commercial',
          requestType: 'new_business',
          // Missing required: legalBusinessName, industry, address, contact, coverages
        })
        .expect(400);
    });

    it('should fail without coverages', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes/submit')
        .send({
          insuranceType: 'commercial',
          requestType: 'new_business',
          legalBusinessName: 'No Coverage LLC',
          industry: 'Technology',
          streetAddress: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          contactFirstName: 'Test',
          contactLastName: 'User',
          contactEmail: 'test@test.com',
          contactPhone: '+15551234567',
          selectedCoverages: [], // Empty coverages
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/quotes/:id/coverages', () => {
    it('should select coverages for quote request', async () => {
      // Skip if the first test failed (quoteRequestId not set)
      if (!quoteRequestId) {
        console.warn('Skipping: quoteRequestId not set from previous test');
        return;
      }

      const coverageData = {
        selectedCoverages: [
          'general_liability',
          'professional_liability',
          'commercial_property',
        ],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/quotes/${quoteRequestId}/coverages`)
        .send(coverageData)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      const coverageTypes = response.body.map((c: any) => c.coverageType);
      expect(coverageTypes).toContain('general_liability');
      expect(coverageTypes).toContain('professional_liability');
      expect(coverageTypes).toContain('commercial_property');
    });

    it('should update coverages when called again', async () => {
      // Skip if the first test failed (quoteRequestId not set)
      if (!quoteRequestId) {
        console.warn('Skipping: quoteRequestId not set from previous test');
        return;
      }

      const newCoverageData = {
        selectedCoverages: ['general_liability', 'cyber_liability'],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/quotes/${quoteRequestId}/coverages`)
        .send(newCoverageData)
        .expect(201);

      // Should have only the new coverages
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/v1/quotes/:id', () => {
    it('should get quote by ID with quotes and options', async () => {
      // Skip if the first test failed (quoteRequestId not set)
      if (!quoteRequestId) {
        console.warn('Skipping: quoteRequestId not set from previous test');
        return;
      }

      // Wait for carrier processing to potentially complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('quoteRequest');
      expect(response.body).toHaveProperty('coverages');
      expect(response.body).toHaveProperty('options');
      expect(response.body).toHaveProperty('quoteId', quoteRequestId);
      expect(response.body.quoteRequest.id).toBe(quoteRequestId);
      expect(Array.isArray(response.body.options)).toBe(true);
    }, 10000);

    it('should return 404 for non-existent quote', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/v1/quotes/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/quotes/:id/options', () => {
    it('should get insurance options for quote request', async () => {
      // Skip if the first test failed (quoteRequestId not set)
      if (!quoteRequestId) {
        console.warn('Skipping: quoteRequestId not set from previous test');
        return;
      }

      // Wait for carrier processing to potentially complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}/options`)
        .expect(200);

      expect(response.body).toHaveProperty('options');
      expect(response.body).toHaveProperty('quoteId', quoteRequestId);
      expect(Array.isArray(response.body.options)).toBe(true);
    }, 10000);

    it('should return 404 for non-existent quote', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/v1/quotes/${fakeUuid}/options`)
        .expect(404);
    });
  });

  describe('POST /api/v1/quotes/:id/submit', () => {
    it('should return error when quote already submitted', async () => {
      // Skip if the first test failed (quoteRequestId not set)
      if (!quoteRequestId) {
        console.warn('Skipping: quoteRequestId not set from previous test');
        return;
      }

      // Trying to submit again should fail
      const response = await request(app.getHttpServer())
        .post(`/api/v1/quotes/${quoteRequestId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.message).toContain('already submitted');
    });

    it('should return 404 for non-existent quote', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .post(`/api/v1/quotes/${fakeUuid}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
