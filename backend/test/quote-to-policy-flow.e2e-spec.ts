import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Quote to Policy Flow E2E Tests (with Real Carrier API Calls)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let quoteRequestId: string;
  let carrierQuoteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await dataSource.query('DELETE FROM policies WHERE user_id = $1', [
        userId,
      ]);
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
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    await app.close();
  });

  describe('Step 1: Create Quote Request (Frontend sends complete data)', () => {
    it('should create a quote request with all 5 steps data', async () => {
      const sessionId = `test-session-${Date.now()}`;

      const quoteRequestData = {
        sessionId,
        insuranceType: 'commercial',
        requestType: 'new_coverage',

        // Step 2: Business Basics
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

        // Step 3: Financial Information
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

        // Step 5: Additional Comments
        additionalComments:
          'Looking for comprehensive coverage for tech startup',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/quotes')
        .send(quoteRequestData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.sessionId).toBe(sessionId);
      expect(response.body.status).toBe('draft');
      expect(response.body.legalBusinessName).toBe('Acme Tech LLC');

      quoteRequestId = response.body.id;
    });
  });

  describe('Step 2: Select Coverages (Step 4 from frontend)', () => {
    it('should select coverages for the quote request', async () => {
      const coverageData = {
        selectedCoverages: [
          'general_liability',
          'professional_liability',
          'cyber_liability',
        ],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/quotes/${quoteRequestId}/coverages`)
        .send(coverageData)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('coverageType');
      expect(response.body[0].isSelected).toBe(true);
    });
  });

  describe('Step 3: Register User (After frontend form completion)', () => {
    it('should send verification code to phone', async () => {
      const phone = `+1555${Date.now().toString().slice(-7)}`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/send-verification-code')
        .send({ phone })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent');
    });

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

  describe('Step 4: Link Quote to User and Submit', () => {
    it('should update quote request with userId', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId })
        .expect(200);

      expect(response.body.userId).toBe(userId);
    });

    it('should submit quote request and get quotes from ALL CARRIERS', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/quotes/${quoteRequestId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      // Status can be either 'submitted' or 'processing' depending on timing
      expect(['submitted', 'processing']).toContain(response.body.status);

      // Wait for quote processing (carrier API calls) - longer wait for multiple carriers
      console.log('\n⏳ Waiting 10 seconds for carriers to process quotes...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, 45000); // 45 second timeout for carrier API calls
  });

  describe('Step 5: Get Quotes from Carriers', () => {
    it('should retrieve quotes from all carriers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('quoteRequest');
      expect(response.body).toHaveProperty('quotes');
      expect(response.body.quoteRequest.status).toBe('quotes_ready');

      // Should have quotes from multiple carriers
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBeGreaterThan(0);

      // Verify quote structure
      const quote = response.body.quotes[0];
      expect(quote).toHaveProperty('id');
      expect(quote).toHaveProperty('carrierId');
      expect(quote).toHaveProperty('carrierQuoteId');
      expect(quote).toHaveProperty('coverageType');
      expect(quote).toHaveProperty('annualPremium');
      expect(quote).toHaveProperty('monthlyPremium');
      expect(quote).toHaveProperty('status');
      expect(quote).toHaveProperty('carrier');

      // Store a quote ID for binding
      carrierQuoteId = response.body.quotes[0].id;

      console.log(
        `\n✅ Received ${response.body.quotes.length} quotes from carriers:`,
      );
      response.body.quotes.forEach((q: any) => {
        console.log(
          `  - ${q.carrier.carrierName}: ${q.coverageType} - $${q.annualPremium}/year`,
        );
      });
    });

    it('should have quotes from at least 2 different carriers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const uniqueCarriers = new Set(
        response.body.quotes.map((q: any) => q.carrierId),
      );

      expect(uniqueCarriers.size).toBeGreaterThanOrEqual(2);
    });

    it('should have quotes for requested coverage types', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteRequestId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const coverageTypes = response.body.quotes.map(
        (q: any) => q.coverageType,
      );

      expect(coverageTypes).toContain('general_liability');
      expect(coverageTypes).toContain('professional_liability');
      expect(coverageTypes).toContain('cyber_liability');
    });
  });

  describe('Step 6: Bind Policy from Quote', () => {
    it('should bind a selected quote to create a policy', async () => {
      const bindData = {
        carrierQuoteId,
        userId,
        paymentPlan: 'monthly',
        autoRenewal: true,
        paymentMethodId: 'pm_test_123', // Test payment method
        additionalNotes: 'Test policy binding',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/policies/bind')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bindData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('policyNumber');
      expect(response.body).toHaveProperty('carrierPolicyId');
      expect(response.body.status).toBe('bound');
      expect(response.body.userId).toBe(userId);
      expect(response.body.paymentPlan).toBe('monthly');

      console.log(`\n✅ Policy bound successfully:`);
      console.log(`  - Policy Number: ${response.body.policyNumber}`);
      console.log(`  - Coverage: ${response.body.coverageType}`);
      console.log(`  - Annual Premium: $${response.body.annualPremium}`);
      console.log(`  - Monthly Premium: $${response.body.monthlyAmount}`);
    }, 20000); // 20 second timeout for binding
  });

  describe('Step 7: Verify Policy Details', () => {
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
      console.log(`\nQuotes Received: ${quoteResponse.body.quotes.length}`);
      console.log(
        `Carriers Responded: ${new Set(quoteResponse.body.quotes.map((q: any) => q.carrier.carrierName)).size}`,
      );
      console.log(`\nPolicies Bound: ${policyResponse.body.length}`);
      if (policyResponse.body.length > 0) {
        console.log(`Policy Number: ${policyResponse.body[0].policyNumber}`);
        console.log(`Annual Premium: $${policyResponse.body[0].annualPremium}`);
      }
      console.log('='.repeat(60) + '\n');

      // Final assertion
      expect(quoteResponse.body.quotes.length).toBeGreaterThan(0);
      expect(policyResponse.body.length).toBeGreaterThan(0);
    });
  });
});
