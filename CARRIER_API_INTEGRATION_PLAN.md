# Carrier API Integration - Implementation Plan

**Status:** Ready to implement
**Priority:** High (MVP Phase 1)
**Estimated Time:** 2-3 days

---

## Current State

✅ **What's Done:**
- User authentication (phone + SMS verification)
- Basic database schema with `users` table
- Document parsing module (for dec page uploads)
- File storage module
- SMS module (Twilio integration)

❌ **What's Missing:**
- Quote request flow entities
- Carrier integration module
- Quote management
- Policy management
- Payment integration

---

## Implementation Steps

### Phase 1: Database Entities (Day 1 - Morning)

#### 1.1 Create Core Entities

**Create the following entity files:**

```bash
backend/src/modules/quotes/entities/
├── quote-request.entity.ts
├── quote-request-coverage.entity.ts
├── uploaded-document.entity.ts (move from document-parsing)
├── carrier.entity.ts
└── carrier-quote.entity.ts
```

**Priority order:**
1. `quote-request.entity.ts` - Main quote request (maps to all 5 steps)
2. `quote-request-coverage.entity.ts` - Selected coverages (Step 4)
3. `carrier.entity.ts` - Carrier configuration
4. `carrier-quote.entity.ts` - Quotes from carriers

**Key Fields for quote-request.entity.ts:**
- Status tracking: `draft → submitted → processing → quotes_ready → quote_selected → purchased`
- All business info from Step 2
- Financial info from Step 3
- Final details from Step 5
- Link to user (nullable for pre-registration)

#### 1.2 Create Migrations

```bash
npm run migration:generate -- -n CreateQuoteRequestEntities
npm run migration:run
```

---

### Phase 2: Carrier Integration Module (Day 1 - Afternoon)

#### 2.1 Create Module Structure

```bash
backend/src/modules/carriers/
├── carriers.module.ts
├── carriers.service.ts
├── carriers.controller.ts (optional for admin)
├── dto/
│   ├── quote-request.dto.ts
│   ├── quote-response.dto.ts
│   ├── bind-policy.dto.ts
│   └── carrier-api.types.ts
├── entities/
│   ├── carrier.entity.ts
│   └── carrier-quote.entity.ts
└── tests/
    └── carriers.service.spec.ts
```

#### 2.2 Implement CarrierService

**File:** `backend/src/modules/carriers/carriers.service.ts`

```typescript
@Injectable()
export class CarriersService {
  private httpService: HttpService;

  constructor(
    @InjectRepository(Carrier)
    private carrierRepository: Repository<Carrier>,
    @InjectRepository(CarrierQuote)
    private carrierQuoteRepository: Repository<CarrierQuote>,
    private configService: ConfigService,
  ) {
    this.httpService = new HttpService();
  }

  async getQuoteFromCarrier(
    carrierId: string,
    quoteRequest: QuoteRequestDto,
  ): Promise<QuoteResponseDto> {
    // 1. Get carrier config from DB
    const carrier = await this.carrierRepository.findOne({
      where: { carrierCode: carrierId, isActive: true },
    });

    if (!carrier) {
      throw new NotFoundException(`Carrier ${carrierId} not found`);
    }

    // 2. Transform Clarence format to Carrier API format
    const carrierRequest = this.transformToCarrierFormat(quoteRequest);

    // 3. Call carrier API
    const startTime = Date.now();
    try {
      const response = await this.httpService.post(
        `${carrier.apiBaseUrl}/carriers/${carrierId}/quote`,
        carrierRequest,
        {
          headers: {
            'X-API-Key': this.decryptApiKey(carrier.apiKeyEncrypted),
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds
        },
      );

      const responseTime = Date.now() - startTime;

      // 4. Log API call
      await this.logCarrierApiCall({
        carrierId: carrier.id,
        endpoint: '/quote',
        success: true,
        responseTime,
        response: response.data,
      });

      return response.data;
    } catch (error) {
      // Log error
      await this.logCarrierApiCall({
        carrierId: carrier.id,
        endpoint: '/quote',
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  async getQuotesFromAllCarriers(
    quoteRequestId: string,
  ): Promise<CarrierQuote[]> {
    const carriers = await this.carrierRepository.find({
      where: { isActive: true },
    });

    // Call all carriers in parallel
    const quotePromises = carriers.map(async (carrier) => {
      try {
        const response = await this.getQuoteFromCarrier(
          carrier.carrierCode,
          quoteRequest,
        );

        // Save quotes to database
        return await this.saveCarrierQuotes(
          quoteRequestId,
          carrier.id,
          response,
        );
      } catch (error) {
        console.error(
          `Failed to get quote from ${carrier.carrierName}:`,
          error,
        );
        return [];
      }
    });

    const results = await Promise.all(quotePromises);
    return results.flat();
  }

  async bindPolicy(
    carrierId: string,
    quoteId: string,
    bindRequest: BindPolicyDto,
  ): Promise<any> {
    const carrier = await this.carrierRepository.findOne({
      where: { carrierCode: carrierId },
    });

    const response = await this.httpService.post(
      `${carrier.apiBaseUrl}/carriers/${carrierId}/bind`,
      bindRequest,
      {
        headers: {
          'X-API-Key': this.decryptApiKey(carrier.apiKeyEncrypted),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  async checkCarrierHealth(carrierId: string): Promise<any> {
    const carrier = await this.carrierRepository.findOne({
      where: { carrierCode: carrierId },
    });

    const response = await this.httpService.get(
      `${carrier.apiBaseUrl}/carriers/${carrierId}/health`,
      {
        headers: {
          'X-API-Key': this.decryptApiKey(carrier.apiKeyEncrypted),
        },
      },
    );

    // Update carrier health status
    await this.carrierRepository.update(carrier.id, {
      lastHealthCheck: new Date(),
      healthStatus: response.data.status,
    });

    return response.data;
  }

  private transformToCarrierFormat(quoteRequest: any): any {
    // Transform Clarence's format to Carrier API format
    return {
      quote_request_id: quoteRequest.id,
      insurance_type: quoteRequest.insuranceType,
      business_info: {
        legal_name: quoteRequest.legalBusinessName,
        industry: quoteRequest.industry,
        industry_code: quoteRequest.industryCode,
        // ... map all fields
      },
      coverage_requests: quoteRequest.coverages.map((c) => ({
        coverage_type: c.coverageType,
        requested_limits: c.limits,
        requested_deductible: c.deductible,
        effective_date: c.effectiveDate,
      })),
    };
  }

  private async saveCarrierQuotes(
    quoteRequestId: string,
    carrierId: string,
    response: any,
  ): Promise<CarrierQuote[]> {
    const quotes = response.quotes.map((quote) => {
      return this.carrierQuoteRepository.create({
        quoteRequestId,
        carrierId,
        carrierQuoteId: quote.quote_id,
        carrierResponse: response,
        status: quote.status,
        coverageType: quote.coverage_type,
        annualPremium: quote.premium.annual,
        monthlyPremium: quote.premium.monthly,
        quarterlyPremium: quote.premium.quarterly,
        coverageLimits: quote.coverage_limits,
        deductible: quote.deductible,
        effectiveDate: quote.effective_date,
        expirationDate: quote.expiration_date,
        policyForm: quote.policy_form,
        highlights: quote.highlights,
        exclusions: quote.exclusions,
        optionalCoverages: quote.optional_coverages,
        underwritingNotes: quote.underwriting_notes,
        validUntil: response.valid_until,
        generatedViaLlm: response.generated_via_llm,
        cached: response.cached,
      });
    });

    return await this.carrierQuoteRepository.save(quotes);
  }

  private decryptApiKey(encryptedKey: string): string {
    // Implement decryption logic
    // For MVP, you can store plain text or use simple encryption
    return encryptedKey;
  }
}
```

#### 2.3 Environment Variables

Add to `.env`:

```bash
# Carrier API Configuration
CARRIER_API_BASE_URL=http://localhost:3001/api/v1
CARRIER_API_KEY=test_clarence_key_123
CARRIER_API_TIMEOUT=10000

# Supported Carriers (comma-separated)
CARRIERS=reliable_insurance,techshield_underwriters,premier_underwriters,fastbind_insurance
```

#### 2.4 Seed Carriers Data

Create a seed script to populate carriers table:

```bash
backend/src/database/seeds/carriers.seed.ts
```

```typescript
export const carriersData = [
  {
    carrierCode: 'reliable_insurance',
    carrierName: 'Reliable Insurance Co.',
    specialization: 'Balanced, family & small business',
    isActive: true,
    apiBaseUrl: process.env.CARRIER_API_BASE_URL,
    apiKeyEncrypted: process.env.CARRIER_API_KEY,
    supportsPersonal: true,
    supportsCommercial: true,
    supportedCoverages: [
      'homeowners',
      'auto',
      'general_liability',
      'professional_liability',
    ],
  },
  {
    carrierCode: 'techshield_underwriters',
    carrierName: 'TechShield Underwriters',
    specialization: 'Tech companies, cyber/E&O',
    isActive: true,
    apiBaseUrl: process.env.CARRIER_API_BASE_URL,
    apiKeyEncrypted: process.env.CARRIER_API_KEY,
    supportsPersonal: false,
    supportsCommercial: true,
    supportedCoverages: [
      'general_liability',
      'professional_liability',
      'cyber_liability',
    ],
  },
  // ... other carriers
];
```

---

### Phase 3: Quote Request Module (Day 2 - Morning)

#### 3.1 Create Quotes Module

```bash
backend/src/modules/quotes/
├── quotes.module.ts
├── quotes.service.ts
├── quotes.controller.ts
├── dto/
│   ├── create-quote-request.dto.ts (5 steps combined)
│   ├── update-quote-request.dto.ts
│   ├── select-quote.dto.ts
│   └── quote-response.dto.ts
├── entities/
│   ├── quote-request.entity.ts
│   └── quote-request-coverage.entity.ts
└── tests/
```

#### 3.2 Implement QuotesService

**Key Methods:**

```typescript
@Injectable()
export class QuotesService {
  // Step 1-5: Create draft quote request (before registration)
  async createQuoteRequest(dto: CreateQuoteRequestDto): Promise<QuoteRequest> {
    // Save to DB with status='draft'
    // Link to anonymous session
  }

  // After user registration: Link quote request to user
  async linkQuoteToUser(sessionId: string, userId: string): Promise<void> {
    await this.quoteRequestRepository.update(
      { sessionId },
      { userId, status: 'submitted', submittedAt: new Date() },
    );
  }

  // Submit quote request and get quotes from carriers
  async processQuoteRequest(quoteRequestId: string): Promise<void> {
    // 1. Update status to 'processing'
    await this.updateStatus(quoteRequestId, 'processing');

    // 2. Call carrier service to get quotes from all carriers
    const quotes = await this.carriersService.getQuotesFromAllCarriers(
      quoteRequestId,
    );

    // 3. Update status to 'quotes_ready'
    await this.updateStatus(quoteRequestId, 'quotes_ready', {
      quotesReadyAt: new Date(),
    });

    // 4. Send notification to user
    await this.notificationsService.sendQuoteReadyNotification(
      quoteRequestId,
    );
  }

  // Get quotes for a quote request
  async getQuotesForRequest(quoteRequestId: string): Promise<CarrierQuote[]> {
    return await this.carrierQuoteRepository.find({
      where: { quoteRequestId },
      relations: ['carrier'],
    });
  }

  // Select quote(s) and proceed to purchase
  async selectQuote(quoteRequestId: string, quoteIds: string[]): Promise<void> {
    await this.quoteRequestRepository.update(quoteRequestId, {
      status: 'quote_selected',
    });

    // Store selected quotes
    // ... implementation
  }
}
```

#### 3.3 Create Quote Request Endpoints

**File:** `quotes.controller.ts`

```typescript
@Controller('quotes')
@UseGuards(JwtAuthGuard) // Require authentication after registration
export class QuotesController {
  // POST /api/quotes - Create quote request (Steps 1-5)
  @Post()
  async createQuoteRequest(@Body() dto: CreateQuoteRequestDto) {
    return await this.quotesService.createQuoteRequest(dto);
  }

  // POST /api/quotes/:id/submit - Submit and process quote request
  @Post(':id/submit')
  async submitQuoteRequest(@Param('id') id: string) {
    await this.quotesService.processQuoteRequest(id);
    return { message: 'Quote request submitted successfully' };
  }

  // GET /api/quotes/:id/status - Get quote request status
  @Get(':id/status')
  async getQuoteStatus(@Param('id') id: string) {
    return await this.quotesService.getQuoteRequestStatus(id);
  }

  // GET /api/quotes/:id/quotes - Get carrier quotes
  @Get(':id/quotes')
  async getQuotes(@Param('id') id: string) {
    return await this.quotesService.getQuotesForRequest(id);
  }

  // POST /api/quotes/:id/select - Select quote(s)
  @Post(':id/select')
  async selectQuote(
    @Param('id') id: string,
    @Body() dto: SelectQuoteDto,
  ) {
    return await this.quotesService.selectQuote(id, dto.quoteIds);
  }
}
```

---

### Phase 4: Policy Binding (Day 2 - Afternoon)

#### 4.1 Create Policies Module

```bash
backend/src/modules/policies/
├── policies.module.ts
├── policies.service.ts
├── policies.controller.ts
├── dto/
│   ├── bind-policy.dto.ts
│   └── policy-response.dto.ts
├── entities/
│   └── policy.entity.ts
└── tests/
```

#### 4.2 Implement Policy Binding

```typescript
@Injectable()
export class PoliciesService {
  async bindPolicy(
    userId: string,
    carrierId: string,
    quoteId: string,
    bindDto: BindPolicyDto,
  ): Promise<Policy> {
    // 1. Get carrier quote
    const quote = await this.carrierQuoteRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote || quote.status !== 'quoted') {
      throw new BadRequestException('Invalid or expired quote');
    }

    // 2. Process payment (integration with Stripe)
    const paymentResult = await this.paymentsService.processPayment(
      userId,
      bindDto.paymentInfo,
      quote.monthlyPremium,
    );

    if (!paymentResult.success) {
      throw new BadRequestException('Payment failed');
    }

    // 3. Call carrier API to bind policy
    const bindRequest = {
      quote_id: quote.carrierQuoteId,
      effective_date: bindDto.effectiveDate,
      payment_plan: bindDto.paymentPlan,
      payment_info: {
        method: 'credit_card',
        token: paymentResult.token,
      },
      insured_info: bindDto.insuredInfo,
      signature: bindDto.signature,
    };

    const bindResponse = await this.carriersService.bindPolicy(
      carrierId,
      quote.carrierQuoteId,
      bindRequest,
    );

    // 4. Save policy to database
    const policy = this.policyRepository.create({
      userId,
      quoteRequestId: quote.quoteRequestId,
      carrierQuoteId: quote.id,
      carrierId: quote.carrierId,
      policyNumber: bindResponse.policy.policy_number,
      carrierPolicyId: bindResponse.policy.policy_id,
      carrierBindId: bindResponse.bind_id,
      insuranceType: quote.insuranceType,
      coverageType: quote.coverageType,
      status: 'bound',
      coverageLimits: bindResponse.policy.coverage_limits,
      deductible: bindResponse.policy.deductible,
      annualPremium: bindResponse.policy.premium.annual,
      paymentPlan: bindDto.paymentPlan,
      monthlyAmount: bindResponse.policy.premium.monthly_amount,
      effectiveDate: bindResponse.policy.effective_date,
      expirationDate: bindResponse.policy.expiration_date,
      boundAt: new Date(),
      insuredName: bindResponse.policy.insured_name,
      insuredAddress: bindResponse.policy.insured_address,
      firstPaymentDue: bindResponse.policy.premium.first_payment_due,
      nextPaymentDate: bindResponse.policy.premium.next_payment_date,
      paymentsRemaining: 11, // for monthly
      autoRenewal: true,
      policyDocumentUrl: bindResponse.policy.documents[0]?.url,
      declarationsUrl: bindResponse.policy.documents[1]?.url,
      certificateUrl: bindResponse.policy.documents[2]?.url,
      carrierContactInfo: bindResponse.policy.carrier_contact,
      carrierPolicyData: bindResponse.policy,
    });

    await this.policyRepository.save(policy);

    // 5. Store policy documents
    await this.savePolicyDocuments(policy.id, bindResponse.policy.documents);

    // 6. Send confirmation email
    await this.notificationsService.sendPolicyIssuedNotification(
      userId,
      policy.id,
    );

    return policy;
  }

  private async savePolicyDocuments(
    policyId: string,
    documents: any[],
  ): Promise<void> {
    const policyDocs = documents.map((doc) =>
      this.policyDocumentRepository.create({
        policyId,
        documentType: doc.type,
        documentName: doc.name,
        documentUrl: doc.url,
        fileSize: doc.size_bytes,
        generatedAt: doc.generated_at,
      }),
    );

    await this.policyDocumentRepository.save(policyDocs);
  }
}
```

---

### Phase 5: Testing & Integration (Day 3)

#### 5.1 Unit Tests

Write tests for:
- `CarriersService.getQuoteFromCarrier()`
- `QuotesService.processQuoteRequest()`
- `PoliciesService.bindPolicy()`

#### 5.2 E2E Test - Full Flow

```typescript
// test/quote-to-policy.e2e-spec.ts
describe('Quote to Policy Flow (e2e)', () => {
  it('should complete full flow: quote → register → select → bind', async () => {
    // 1. Create quote request (anonymous)
    const quoteRequest = await request(app.getHttpServer())
      .post('/api/quotes')
      .send(quoteRequestData)
      .expect(201);

    const quoteId = quoteRequest.body.id;

    // 2. Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        phone: '+15551234567',
        password: 'Test123!@#',
        code: '123456',
        quoteRequestId: quoteId,
      })
      .expect(201);

    const accessToken = registerResponse.body.accessToken;

    // 3. Submit quote request
    await request(app.getHttpServer())
      .post(`/api/quotes/${quoteId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 4. Wait for quotes (or mock)
    await sleep(2000);

    // 5. Get quotes
    const quotesResponse = await request(app.getHttpServer())
      .get(`/api/quotes/${quoteId}/quotes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(quotesResponse.body).toHaveLength(4); // 4 carriers

    // 6. Select a quote
    const selectedQuoteId = quotesResponse.body[0].id;

    await request(app.getHttpServer())
      .post(`/api/quotes/${quoteId}/select`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quoteIds: [selectedQuoteId] })
      .expect(200);

    // 7. Bind policy
    const policyResponse = await request(app.getHttpServer())
      .post('/api/policies/bind')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        quoteId: selectedQuoteId,
        carrierId: 'techshield_underwriters',
        effectiveDate: '2025-12-01',
        paymentPlan: 'monthly',
        paymentInfo: {
          token: 'tok_test_123',
        },
        insuredInfo: {
          primaryContact: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+15551234567',
          },
        },
        signature: {
          fullName: 'John Doe',
          signedAt: new Date(),
          ipAddress: '127.0.0.1',
        },
      })
      .expect(201);

    expect(policyResponse.body.policyNumber).toBeDefined();
    expect(policyResponse.body.status).toBe('bound');
  });
});
```

#### 5.3 Manual Testing Checklist

- [ ] Create quote request (Steps 1-5)
- [ ] Register user with phone verification
- [ ] Link quote to user
- [ ] Submit quote request
- [ ] Verify carrier API calls (check logs)
- [ ] View quotes from all 4 carriers
- [ ] Select quote
- [ ] Bind policy with payment
- [ ] Verify policy documents stored
- [ ] Check email notifications sent

---

## API Endpoints Summary

### Quote Flow
```
POST   /api/quotes                    - Create quote request (Steps 1-5)
POST   /api/quotes/:id/submit         - Submit and process quotes
GET    /api/quotes/:id/status         - Get quote processing status
GET    /api/quotes/:id/quotes         - Get carrier quotes
POST   /api/quotes/:id/select         - Select quote(s)
```

### Policy Management
```
POST   /api/policies/bind             - Bind policy from quote
GET    /api/policies                  - Get user's policies
GET    /api/policies/:id              - Get policy details
GET    /api/policies/:id/documents    - Get policy documents
POST   /api/policies/:id/certificate  - Generate COI
```

### Carrier Admin (Optional)
```
GET    /api/carriers                  - List all carriers
GET    /api/carriers/:id/health       - Check carrier health
POST   /api/carriers/:id/test         - Test carrier API connection
```

---

## Environment Setup

Add to `backend/.env`:

```bash
# Carrier API
CARRIER_API_BASE_URL=http://localhost:3001/api/v1
CARRIER_API_KEY=test_clarence_key_123
CARRIER_API_TIMEOUT=10000

# Carriers (comma-separated)
CARRIERS=reliable_insurance,techshield_underwriters,premier_underwriters,fastbind_insurance

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# File Storage (for policy documents)
AWS_S3_BUCKET=clarence-policy-documents
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Next Steps After Implementation

1. **Start Carrier Simulator Backend** (if you have one)
   ```bash
   cd carrier-simulator
   npm run start
   ```

2. **Run Migrations**
   ```bash
   cd backend
   npm run migration:run
   ```

3. **Seed Carriers Data**
   ```bash
   npm run seed:carriers
   ```

4. **Test Quote Flow**
   - Use Postman or `api.http` file
   - Test with all 4 carriers
   - Verify database entries

5. **Integrate with Frontend**
   - Connect quote form (Steps 1-5) to backend API
   - Display quotes on dashboard
   - Implement quote selection UI
   - Add payment flow

---

## Monitoring & Debugging

### Key Logs to Monitor

1. **Carrier API Calls**
   - Check `carrier_api_logs` table
   - Monitor response times
   - Track success/failure rates

2. **Quote Processing**
   - Monitor `quote_requests.status` progression
   - Check `carrier_quotes` for successful quotes

3. **Policy Binding**
   - Verify `policies.status` = 'bound'
   - Check policy documents stored correctly

### Common Issues

| Issue | Solution |
|-------|----------|
| Carrier API timeout | Increase `CARRIER_API_TIMEOUT` |
| Quote not found | Check `valid_until` timestamp |
| Payment failure | Verify Stripe configuration |
| Document not stored | Check S3 permissions |

---

## Success Criteria

✅ **Phase 1 Complete When:**
- All entities created and migrated
- Can create quote request in DB
- Can submit and track status

✅ **Phase 2 Complete When:**
- Can call carrier API successfully
- Receive quotes from all 4 carriers
- Quotes stored in `carrier_quotes` table

✅ **Phase 3 Complete When:**
- Complete quote request flow works
- User can view all quotes
- Quote selection works

✅ **Phase 4 Complete When:**
- Policy binding succeeds
- Policy stored in DB with all details
- Policy documents accessible
- Email notification sent

✅ **MVP Complete When:**
- E2E test passes (quote → register → select → bind)
- All 4 carriers return quotes
- Can bind policy and get policy number
- Documents stored and accessible

---

## Timeline

| Day | Task | Hours |
|-----|------|-------|
| Day 1 AM | Create entities & migrations | 3h |
| Day 1 PM | Implement CarriersService | 4h |
| Day 2 AM | Implement QuotesService | 4h |
| Day 2 PM | Implement PoliciesService | 4h |
| Day 3 | Testing & Integration | 6h |

**Total:** ~21 hours (2.5 days)

---

## Questions?

- Check `CARRIER_API_SCHEMA.md` for API details
- Check `CARRIER_INTEGRATION_GUIDE.md` for examples
- Review `database_schema.dbml` for entity relationships
