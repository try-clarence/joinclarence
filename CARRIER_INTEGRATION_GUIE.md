# Carrier API Simulator - Integration Guide (MVP)

**⚠️ This is a fake/mock API for testing purposes only**

## 📦 What You Have

| Document | Purpose |
|----------|---------|
| **api.http** | REST Client file for VS Code (recommended for testing) |
| **API_SCHEMA.md** | Complete API reference with all endpoints |
| **API_QUICK_REFERENCE.md** | Quick lookup cheat sheet |
| **README.md** | Project overview |
| **INTEGRATION_GUIDE.md** | This file |

---

## 🚀 Quick Start (2 Minutes)

### Step 1: Install REST Client Extension

1. Open VS Code
2. Go to Extensions (Cmd/Ctrl+Shift+X)
3. Search for "REST Client" by Huachao Mao
4. Click Install

### Step 2: Test an Endpoint

1. Open `api.http` file
2. Find "Get Commercial Quote - General Liability"
3. Click **"Send Request"** above the request
4. View response in right panel

### Step 3: Review API Schema

Open `API_SCHEMA.md` to see:
- All 8 endpoints with examples
- Request/response formats
- Error codes

---

## 📖 Integration Steps

### 1. Environment Configuration

```javascript
// config/carriers.ts
export const CARRIER_CONFIG = {
  baseUrl: process.env.CARRIER_API_BASE_URL || 'http://localhost:3001/api/v1',
  apiKey: process.env.CARRIER_API_KEY || 'test_clarence_key_123',
  timeout: 10000 // 10 seconds
};
```

### 2. Create Carrier Service

```typescript
// services/carrier.service.ts
import axios, { AxiosInstance } from 'axios';
import { CARRIER_CONFIG } from '../config/carriers';

export class CarrierService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CARRIER_CONFIG.baseUrl,
      timeout: CARRIER_CONFIG.timeout,
      headers: {
        'X-API-Key': CARRIER_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getQuote(carrierId: string, quoteRequest: QuoteRequest): Promise<QuoteResponse> {
    try {
      const response = await this.client.post(
        `/carriers/${carrierId}/quote`,
        quoteRequest
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bindPolicy(carrierId: string, bindRequest: BindRequest): Promise<BindResponse> {
    try {
      const response = await this.client.post(
        `/carriers/${carrierId}/bind`,
        bindRequest
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPolicy(carrierId: string, policyId: string): Promise<PolicyResponse> {
    try {
      const response = await this.client.get(
        `/carriers/${carrierId}/policies/${policyId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async renewPolicy(
    carrierId: string,
    policyId: string,
    renewalRequest: RenewalRequest
  ): Promise<RenewalResponse> {
    try {
      const response = await this.client.post(
        `/carriers/${carrierId}/policies/${policyId}/renew`,
        renewalRequest
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateCertificate(
    carrierId: string,
    policyId: string,
    certRequest: CertificateRequest
  ): Promise<CertificateResponse> {
    try {
      const response = await this.client.post(
        `/carriers/${carrierId}/policies/${policyId}/certificate`,
        certRequest
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkHealth(carrierId: string): Promise<HealthResponse> {
    try {
      const response = await this.client.get(
        `/carriers/${carrierId}/health`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      return new CarrierAPIError(
        apiError.code,
        apiError.message,
        error.response.status,
        apiError.field
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      return new CarrierAPIError('TIMEOUT', 'Request timeout', 408);
    }
    
    return new CarrierAPIError('UNKNOWN_ERROR', error.message, 500);
  }
}

export class CarrierAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public field?: string
  ) {
    super(message);
    this.name = 'CarrierAPIError';
  }
}
```

### 3. Define TypeScript Interfaces

```typescript
// types/carrier.types.ts

export interface QuoteRequest {
  quote_request_id: string;
  insurance_type: 'personal' | 'commercial';
  personal_info?: PersonalInfo;
  business_info?: BusinessInfo;
  coverage_requests: CoverageRequest[];
  additional_data?: AdditionalData;
}

export interface PersonalInfo {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  occupation: string;
  credit_score_tier: 'excellent' | 'good' | 'fair' | 'poor';
  address: Address;
  email?: string;
  phone?: string;
}

export interface BusinessInfo {
  legal_name: string;
  dba_name?: string;
  legal_structure: string;
  industry: string;
  industry_code: string;
  description?: string;
  year_started: number;
  address: Address;
  financial_info: FinancialInfo;
  contact_info: ContactInfo;
}

export interface CoverageRequest {
  coverage_type: string;
  requested_limits: Record<string, number>;
  requested_deductible: number;
  effective_date: string;
  property_info?: PropertyInfo;
  vehicle_info?: VehicleInfo;
  cyber_info?: CyberInfo;
}

export interface QuoteResponse {
  success: boolean;
  carrier_id: string;
  carrier_name: string;
  carrier_quote_id: string;
  requested_quote_id: string;
  timestamp: string;
  valid_until: string;
  generated_via_llm: boolean;
  cached: boolean;
  quotes: Quote[];
  package_discount?: PackageDiscount;
  underwriting_summary?: UnderwritingSummary;
}

export interface Quote {
  quote_id: string;
  coverage_type: string;
  status: 'quoted' | 'declined';
  coverage_limits: Record<string, number>;
  premium: Premium;
  deductible: number;
  effective_date: string;
  expiration_date: string;
  highlights: string[];
  exclusions: string[];
  optional_coverages: OptionalCoverage[];
  underwriting_notes: string[];
  decline_reason?: string;
  decline_code?: string;
}

export interface Premium {
  annual: number;
  monthly: number;
  quarterly: number;
  payment_in_full_discount?: number;
}

// ... more interfaces (see API_SCHEMA.md for complete list)
```

### 4. Implement Quote Flow in Clarence

```typescript
// services/quote.service.ts (Clarence backend)
import { CarrierService } from './carrier.service';

export class QuoteService {
  private carrierService: CarrierService;

  constructor() {
    this.carrierService = new CarrierService();
  }

  async getQuotesFromAllCarriers(
    quoteRequestData: any
  ): Promise<CarrierQuoteResult[]> {
    const carriers = [
      'reliable_insurance',
      'techshield_underwriters',
      'premier_underwriters',
      'fastbind_insurance'
    ];

    // Request quotes from all carriers in parallel
    const quotePromises = carriers.map(async (carrierId) => {
      try {
        const quoteResponse = await this.carrierService.getQuote(
          carrierId,
          this.transformToCarrierFormat(quoteRequestData)
        );
        
        return {
          carrierId,
          success: true,
          quotes: quoteResponse.quotes,
          cached: quoteResponse.cached,
          generatedViaLLM: quoteResponse.generated_via_llm
        };
      } catch (error) {
        return {
          carrierId,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(quotePromises);
    
    // Filter successful quotes
    const successfulQuotes = results.filter(r => r.success);
    
    return successfulQuotes;
  }

  private transformToCarrierFormat(clarenceData: any): QuoteRequest {
    // Transform Clarence's internal format to Carrier API format
    return {
      quote_request_id: clarenceData.id,
      insurance_type: clarenceData.insuranceType,
      business_info: {
        legal_name: clarenceData.businessName,
        industry: clarenceData.industry,
        industry_code: clarenceData.industryCode,
        // ... map all fields
      },
      coverage_requests: clarenceData.coverages.map(c => ({
        coverage_type: c.type,
        requested_limits: c.limits,
        requested_deductible: c.deductible,
        effective_date: c.effectiveDate
      }))
    };
  }

  async bindSelectedQuote(
    carrierId: string,
    quoteId: string,
    bindingDetails: any
  ): Promise<PolicyResult> {
    const bindRequest: BindRequest = {
      quote_id: quoteId,
      effective_date: bindingDetails.effectiveDate,
      payment_plan: bindingDetails.paymentPlan,
      payment_info: bindingDetails.paymentInfo,
      insured_info: bindingDetails.insuredInfo,
      signature: bindingDetails.signature
    };

    try {
      const bindResponse = await this.carrierService.bindPolicy(
        carrierId,
        bindRequest
      );

      // Store policy in Clarence database
      await this.storePolicyInDatabase(bindResponse.policy);

      // Download and store policy documents
      await this.downloadPolicyDocuments(bindResponse.policy.documents);

      return {
        success: true,
        policyId: bindResponse.policy.policy_id,
        policyNumber: bindResponse.policy.policy_number,
        documents: bindResponse.policy.documents
      };
    } catch (error) {
      throw new Error(`Failed to bind policy: ${error.message}`);
    }
  }
}
```

---

## 🎯 Key Integration Points

### 1. Quote Generation Workflow

```
Clarence receives quote request from user
    ↓
Transform to Carrier API format
    ↓
Call all 4 carriers in parallel (Promise.all)
    ↓
Wait for responses (some may fail/decline)
    ↓
Filter successful quotes
    ↓
Store quotes in Clarence DB
    ↓
Display quotes to user
```

### 2. Simple Mock Responses

**Important:** This is a mock API for testing. Responses are fake data.

You may want to store quotes in your database for:
- Tracking quote history
- Testing workflows
- Demo purposes

### 3. Basic Error Handling

```typescript
async function getQuote(carrierId: string, request: QuoteRequest) {
  try {
    return await carrierService.getQuote(carrierId, request);
  } catch (error) {
    if (error.response?.status === 400) {
      // Bad request - fix the request data
      throw new Error(`Invalid request: ${error.response.data.error.message}`);
    }
    
    if (error.response?.status >= 500) {
      // Server error - log and maybe retry once
      logger.error(`Carrier API error: ${error.message}`);
      return null; // Skip this carrier
    }
    
    throw error;
  }
}
```

### 4. Document Handling

Policy documents are returned as URLs:

```typescript
async function downloadPolicyDocument(documentUrl: string, policyId: string) {
  const response = await axios.get(documentUrl, {
    responseType: 'arraybuffer'
  });

  const filename = `policy_${policyId}_${Date.now()}.pdf`;
  
  // Option 1: Save to local filesystem
  await fs.writeFile(`./storage/policies/${filename}`, response.data);
  
  // Option 2: Upload to S3
  await s3.upload({
    Bucket: 'clarence-policies',
    Key: filename,
    Body: response.data,
    ContentType: 'application/pdf'
  });
  
  return filename;
}
```

---

## 🔍 Testing Checklist

Before going to production, test:

### Quote Generation
- [ ] Personal insurance quote (homeowners)
- [ ] Personal insurance quote (auto)
- [ ] Commercial insurance quote (GL)
- [ ] Commercial insurance quote (cyber)
- [ ] Multi-coverage quote (GL + E&O + Cyber)
- [ ] Quote caching (run same request twice)
- [ ] Declined quote scenario
- [ ] Invalid request (400 error)

### Policy Binding
- [ ] Bind policy from quote
- [ ] Bind with additional insureds
- [ ] Bind with endorsements
- [ ] Bind expired quote (410 error)

### Policy Management
- [ ] Retrieve policy details
- [ ] Renew policy
- [ ] Add endorsement
- [ ] Generate certificate
- [ ] Cancel policy

### Error Scenarios
- [ ] Rate limit exceeded (429)
- [ ] Carrier unavailable (503)
- [ ] Invalid API key (401)
- [ ] Timeout handling

### All Carriers
- [ ] Test with reliable_insurance
- [ ] Test with techshield_underwriters
- [ ] Test with premier_underwriters
- [ ] Test with fastbind_insurance

---

## 📊 Simple Logging (Optional)

```typescript
// Log API calls for debugging
logger.info('Requesting quote', { carrierId, insuranceType });

// Log responses
logger.info('Quote received', { 
  carrierId, 
  quoteId: response.quotes[0]?.quote_id,
  responseTime: endTime - startTime 
});

// Log errors
logger.error('API error', { 
  carrierId, 
  status: error.response?.status,
  message: error.message 
});
```

---

## 🚨 Common Issues

### Issue: Connection refused

**Cause:** Mock API server not running

**Solution:** Start the simulator backend (when implemented)

### Issue: 400 Bad Request

**Cause:** Missing required fields in request

**Solution:** Check `API_SCHEMA.md` for required fields

### Issue: 404 Not Found

**Cause:** Invalid carrier_id or policy_id

**Solution:** Use valid carrier IDs: `reliable_insurance`, `techshield_underwriters`, `premier_underwriters`, `fastbind_insurance`

---

## 📚 Additional Resources

- **Full API Documentation:** `API_SCHEMA.md`
- **System Architecture:** `PRD.md` (section: Technical Architecture)
- **Coverage Types Reference:** `API_SCHEMA.md` (Appendix)
- **Postman Collection:** `Carrier_API_Simulator.postman_collection.json`

---

## 🤝 Support

If you encounter issues during integration:

1. Check `API_SCHEMA.md` for complete API reference
2. Use Postman collection to test endpoints directly
3. Check carrier health: `GET /carriers/{carrier_id}/health`
4. Review error codes in API_SCHEMA.md (Error Handling section)
5. Contact: api-support@carrier-simulator.clarence.app

---

## ✅ Ready to Integrate?

You have everything you need:

1. **API Documentation** - See `API_SCHEMA.md`
2. **REST Client Tests** - Use `api.http` in VS Code
3. **Integration Code** - TypeScript examples above
4. **Simple Error Handling** - Basic patterns included

**Next Steps:**
1. Test with `api.http` in VS Code
2. Implement CarrierService in your codebase
3. Test quote → bind → policy workflow
4. Handle basic error scenarios
5. Build your MVP!

This is a simple mock API - perfect for MVP testing! 🚀

