# Quick Start - Testing with REST Client

## 🚀 5-Minute Setup

### Step 1: Install REST Client (30 seconds)
1. Open VS Code
2. Press `Cmd/Ctrl + Shift + X`
3. Search for "REST Client" by Huachao Mao
4. Click Install

### Step 2: Open Test File (10 seconds)
1. Open `/Users/minhdoan/work/ai/joinclarence_2/backend/api.http`
2. You'll see organized API requests with "Send Request" links above each one

### Step 3: Start Services (1 minute)
```bash
# Terminal 1: Start Clarence Backend
cd backend
npm run start:dev

# Terminal 2: Verify Carrier Simulator is running
curl http://localhost:3001/api/v1/carriers/reliable_insurance/health
```

### Step 4: Test! (3 minutes)
Click "Send Request" above any endpoint in `api.http`

---

## 📍 Quick Test Sequence

### Test Carrier Simulator (Verify it's working)

```http
### 1. Health Check - Reliable Insurance
GET http://localhost:3001/api/v1/carriers/reliable_insurance/health
X-API-Key: test_clarence_key_123
```

Click "Send Request" above ↑

**Expected Response:**
```json
{
  "status": "operational",
  "carrier_id": "reliable_insurance",
  "services": {
    "quoting": "operational",
    "binding": "operational"
  }
}
```

---

### Test Get Quote (Core functionality)

```http
### 2. Get Commercial Quote
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial",
  "business_info": {
    "legal_name": "Test Company LLC",
    "industry": "Technology",
    "industry_code": "541512",
    "year_started": 2020,
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    },
    "financial_info": {
      "annual_revenue": 500000,
      "annual_payroll": 300000,
      "full_time_employees": 5
    },
    "contact_info": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@test.com",
      "phone": "+15551234567"
    }
  },
  "coverage_requests": [
    {
      "coverage_type": "general_liability",
      "requested_limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000
      },
      "requested_deductible": 500,
      "effective_date": "2025-12-01"
    }
  ]
}
```

Click "Send Request" above ↑

**Expected Response:**
```json
{
  "success": true,
  "carrier_id": "reliable_insurance",
  "quotes": [
    {
      "quote_id": "REL-Q-2025-...",
      "coverage_type": "general_liability",
      "status": "quoted",
      "premium": {
        "annual": 1250.00,
        "monthly": 110.00
      }
    }
  ]
}
```

---

### Test Clarence Backend

```http
### 3. Get All Carriers
GET http://localhost:3000/api/v1/carriers
```

Click "Send Request" above ↑

**Expected Response:**
```json
[
  {
    "id": "...",
    "carrierCode": "reliable_insurance",
    "carrierName": "Reliable Insurance Co.",
    "isActive": true,
    "supportedCoverages": [...]
  }
]
```

---

## 🎯 Full Flow Test (Copy/Paste Ready)

Open `backend/api.http` and run these in order:

1. **Send Verification Code** (Request #7)
2. **Register User** (Request #8) - Extracts access token
3. **Create Quote Request** (Request #10) - Extracts quote ID
4. **Add Coverages** (Request #11)
5. **Link to User** (Request #12)
6. **Submit Quote** (Request #13) - Triggers carrier calls
7. **Wait 10 seconds** ⏰
8. **Get Quotes** (Request #14) - See carrier responses
9. **Bind Policy** (Request #15)
10. **Get Policies** (Request #16)

---

## 🔍 Debugging Tips

### See Full Request/Response
- Response appears in right panel
- Click headers to see status code
- Scroll down for full response body

### Variables
Variables are automatically extracted:
```http
# @name login
POST http://localhost:3000/api/v1/auth/login
...

### Use extracted token
@accessToken = {{login.response.body.accessToken}}
```

### Multiple Environments
```http
# At top of file
@baseUrl = http://localhost:3000/api/v1
@carrierUrl = http://localhost:3001/api/v1

# In requests
GET {{baseUrl}}/carriers
GET {{carrierUrl}}/carriers/reliable_insurance/health
```

---

## ⚡ Quick Commands

### Check if services are running
```bash
# Clarence backend
curl http://localhost:3000/api/v1/carriers

# Carrier simulator
curl http://localhost:3001/api/v1/carriers/reliable_insurance/health
```

### Stop backend for tests
```bash
lsof -ti:3000 | xargs kill -9
```

### Run E2E tests
```bash
cd backend
npm run test:e2e
```

### Run specific test
```bash
npm run test:e2e -- quote-to-policy-flow.e2e-spec.ts
```

---

## 🐛 Common Issues

### ❌ "Connection refused"
**Problem:** Service not running
**Solution:**
```bash
# Start backend
cd backend && npm run start:dev

# Or check if carrier simulator needs to start
curl http://localhost:3001/health
```

### ❌ "401 Unauthorized"
**Problem:** Token expired or invalid
**Solution:**
1. Run "Register User" request again (Request #8)
2. Variables will auto-update
3. Retry your request

### ❌ "404 Not Found"  
**Problem:** Wrong URL or endpoint doesn't exist
**Solution:**
- Check URL spelling
- Verify service is running
- Check `backend/src/app.module.ts` for route registration

### ❌ "400 Bad Request"
**Problem:** Invalid request format
**Solution:**
- Compare your request to examples in `api.http`
- Check `CARRIER_API_SCHEMA.md` for correct format
- Look at error message in response

---

## 📚 Full Documentation

- **API Reference:** `CARRIER_API_SCHEMA.md`
- **Integration Guide:** `CARRIER_INTEGRATION_GUIE.md`  
- **Testing Guide:** `backend/TESTING_GUIDE.md`
- **Test Summary:** `TESTING_SESSION_SUMMARY.md`

---

## 💡 Pro Tips

### 1. Test Carrier Simulator First
Before running E2E tests, verify carrier simulator works:
```http
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{ ... request body ... }
```

### 2. Save Common Requests
Create your own `.http` file for custom tests:
```bash
# Create custom test file
touch backend/my-tests.http
```

### 3. Use Comments
```http
### This is my test for XYZ feature
# This request does ABC
POST http://localhost:3000/api/v1/endpoint
```

### 4. Chain Requests
```http
# @name step1
POST http://localhost:3000/api/v1/login
...

###
@token = {{step1.response.body.token}}

POST http://localhost:3000/api/v1/protected
Authorization: Bearer {{token}}
```

---

## ✅ Success Checklist

- [ ] REST Client extension installed
- [ ] Backend running on port 3000
- [ ] Carrier simulator running on port 3001
- [ ] Can get carrier health check
- [ ] Can get quote from carrier simulator
- [ ] Can get carriers from Clarence backend
- [ ] Can register user and get token
- [ ] Can create quote request
- [ ] Can submit and get quotes

---

**Ready to test?** Open `backend/api.http` and start clicking "Send Request"! 🚀

