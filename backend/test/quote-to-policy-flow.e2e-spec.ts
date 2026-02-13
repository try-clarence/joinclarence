import { GetQuoteDetailResponseDto } from '@/modules/quotes/dto/quote-response.dto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Quote to Policy Flow E2E Tests (with Real Carrier API Calls)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let quoteRequestId: string;
  let carrierQuoteId: string;
  let boundPolicyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
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
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (userId) {
        await dataSource.query('DELETE FROM payments WHERE user_id = $1', [
          userId,
        ]);
      }
      if (quoteRequestId) {
        await dataSource.query(
          'DELETE FROM policies WHERE quote_request_id = $1',
          [quoteRequestId],
        );
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
      if (userId) {
        await dataSource.query('DELETE FROM policies WHERE user_id = $1', [
          userId,
        ]);
        await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  describe('Step 1: Register User', () => {
    it('should register user with phone and password', async () => {
      const phone = `+1555${Date.now().toString().slice(-7)}`;

      // Step 1: Send verification code
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({ phone, purpose: 'registration' })
        .expect(200);

      const verificationId = verifyResponse.body.verificationId;

      // Step 2: Verify code to get verification token
      const codeResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-code')
        .send({
          verificationId,
          code: '111111', // Mock OTP
        })
        .expect(200);

      const verificationToken = codeResponse.body.verificationToken;

      // Step 3: Register with verification token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          verificationToken,
          password: 'TestPass123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('user');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.user.phone).toBe(phone);

      accessToken = response.body.tokens.accessToken;
      userId = response.body.user.id;
    });
  });

  describe('Step 2: Submit Complete Quote (Unified Endpoint)', () => {
    it('should submit a complete quote with all data', async () => {
      const completeQuoteData = {
        userId,
        insuranceType: 'commercial',
        requestType: 'new_business',

        // Business Information
        legalBusinessName: 'Acme Tech LLC',
        dbaName: 'Acme Technologies',
        legalStructure: 'LLC',
        businessWebsite: 'https://acmetech.com',
        industry: 'Technology Consulting',
        industryCode: '541512',
        businessDescription: 'Software development and IT consulting services',
        fein: '12-3456789',
        yearStarted: 2020,
        yearsCurrentOwnership: 4,

        // Address
        addressType: 'physical',
        streetAddress: '123 Tech Street',
        addressUnit: 'Suite 100',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',

        // Financial Information
        revenue2024: 500000,
        expenses2024: 300000,
        revenue2025Estimate: 750000,
        expenses2025Estimate: 400000,
        fullTimeEmployees: 5,
        partTimeEmployees: 2,
        totalPayroll: 400000,
        contractorPercentage: 20,

        // Contact Information
        contactFirstName: 'John',
        contactLastName: 'Doe',
        contactEmail: 'john@acmetech.com',
        contactPhone: '+15551234567',

        // Coverages
        selectedCoverages: [
          'general_liability',
          'professional_liability',
          'cyber_liability',
        ],

        // Additional
        additionalComments:
          'Looking for comprehensive coverage for tech startup',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/quotes/submit')
        .send(completeQuoteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // Status can be 'submitted' or 'processing' depending on async timing
      expect(['submitted', 'processing']).toContain(response.body.status);
      expect(response.body.legalBusinessName).toBe('Acme Tech LLC');

      quoteRequestId = response.body.id;

      // Wait for quote processing (carrier API calls)
      console.log('\n⏳ Waiting 10 seconds for carriers to process quotes...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, 45000);
  });

  describe('Step 3: Get Quotes from Carriers', () => {
    it('should retrieve quotes from all carriers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const responseBody: GetQuoteDetailResponseDto = response.body;

      expect(responseBody).toHaveProperty('quoteRequest');
      expect(responseBody).toHaveProperty('options');
      expect(responseBody.quoteRequest.status).toBe('quotes_ready');

      // Should have quotes from multiple carriers
      expect(Array.isArray(responseBody.options)).toBe(true);
      expect(responseBody.options.length).toBeGreaterThan(0);

      // Verify quote structure
      const quote = responseBody.options[0];
      expect(quote).toHaveProperty('id');
      expect(quote).toHaveProperty('quoteId');
      expect(quote).toHaveProperty('carrier');
      expect(quote).toHaveProperty('coverageType');
      expect(quote).toHaveProperty('annualPremium');
      expect(quote).toHaveProperty('monthlyPremium');
      expect(quote).toHaveProperty('status');
      expect(quote).toHaveProperty('carrier');

      // Store a quote ID for binding
      carrierQuoteId = responseBody.options[0].id;

      console.log(
        `\n✅ Received ${responseBody.options.length} quotes from carriers:`,
      );
      responseBody.options.forEach((q) => {
        console.log(
          `  - ${q.carrier}: ${q.coverageType} - $${q.annualPremium}/year`,
        );
      });
    });

    it('should have quotes from at least 2 different carriers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const responseBody: GetQuoteDetailResponseDto = response.body;

      const uniqueCarriers = new Set(
        responseBody.options.map((q) => q.carrier),
      );

      expect(uniqueCarriers.size).toBeGreaterThanOrEqual(2);
    });

    it('should have quotes for requested coverage types', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const responseBody = response.body;

      const coverageTypes = responseBody.options.map((q) => q.coverageType);

      expect(coverageTypes).toContain('general_liability');
      expect(coverageTypes).toContain('professional_liability');
      expect(coverageTypes).toContain('cyber_liability');
    });
  });

  describe('Step 4: Bind Policy from Quote', () => {
    it('should bind a selected quote to create a policy with transactionId', async () => {
      // Note: userId is extracted from JWT, not passed in body
      const bindData = {
        carrierQuoteId,
        paymentPlan: 'monthly',
        autoRenewal: true,
        paymentMethodId: 'pm_test_123',
        additionalNotes: 'Test policy binding',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/policies/bind')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bindData)
        .expect(201);

      const responseBody = response.body;

      expect(responseBody).toHaveProperty('policy');
      expect(responseBody).toHaveProperty('transactionId');
      expect(responseBody.policy).toHaveProperty('id');
      expect(responseBody.policy).toHaveProperty('policyNumber');
      expect(responseBody.policy).toHaveProperty('carrierPolicyId');
      expect(responseBody.policy.status).toBe('bound');
      expect(responseBody.policy.userId).toBe(userId);
      expect(responseBody.policy.paymentPlan).toBe('monthly');

      boundPolicyId = responseBody.policy.id;

      console.log(`\n✅ Policy bound successfully:`);
      console.log(`  - Policy Number: ${response.body.policy.policyNumber}`);
      console.log(`  - Coverage: ${response.body.policy.coverageType}`);
      console.log(`  - Annual Premium: $${response.body.policy.annualPremium}`);
      console.log(
        `  - Monthly Premium: $${response.body.policy.monthlyAmount}`,
      );
      console.log(`  - Transaction ID: ${response.body.transactionId}`);
    }, 20000);
  });

  describe('Step 5: Verify Policy Details', () => {
    it('should retrieve user policies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const policy = response.body[0];
      expect(policy).toHaveProperty('policyNumber');
      expect(policy).toHaveProperty('status');
      expect(policy.status).toBe('bound');
    });
  });

  describe('Step 6: Renew Policy', () => {
    it('should renew the bound policy', async () => {
      const renewData = {
        paymentPlan: 'annual',
        additionalNotes: 'Test renewal',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/policies/${boundPolicyId}/renew`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(renewData)
        .expect(201);

      expect(response.body).toHaveProperty('policy');
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.policy).toHaveProperty('id');
      expect(response.body.policy).toHaveProperty('policyNumber');
      expect(response.body.policy.status).toBe('bound');
      expect(response.body.policy.userId).toBe(userId);
      // Renewed policy should have a different ID than original
      expect(response.body.policy.id).not.toBe(boundPolicyId);

      console.log(`\n✅ Policy renewed successfully:`);
      console.log(
        `  - New Policy Number: ${response.body.policy.policyNumber}`,
      );
      console.log(
        `  - Effective: ${response.body.policy.effectiveDate} - ${response.body.policy.expirationDate}`,
      );
      console.log(`  - Transaction ID: ${response.body.transactionId}`);
    }, 30000);
  });

  describe('Full Flow Summary', () => {
    it('should log complete flow summary', async () => {
      const quoteResponse = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const policyResponse = await request(app.getHttpServer())
        .get('/api/v1/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log('\n' + '='.repeat(60));
      console.log('📊 FULL QUOTE-TO-POLICY FLOW SUMMARY');
      console.log('='.repeat(60));
      console.log(`Quote Request ID: ${quoteRequestId}`);
      console.log(`User ID: ${userId}`);
      console.log(
        `Business: ${quoteResponse.body.quoteRequest.legalBusinessName}`,
      );
      console.log(`\nPolicies Bound: ${policyResponse.body.length}`);
      if (policyResponse.body.length > 0) {
        console.log(`Policy Number: ${policyResponse.body[0].policyNumber}`);
        console.log(`Annual Premium: $${policyResponse.body[0].annualPremium}`);
      }
      console.log('='.repeat(60) + '\n');

      // Final assertions
      expect(quoteResponse.body.options.length).toBeGreaterThan(0);
      expect(policyResponse.body.length).toBeGreaterThan(0);
    });
  });
});
