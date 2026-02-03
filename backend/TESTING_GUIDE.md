# Testing Guide - Clarence Insurance Platform

## Overview

This guide explains how to run and understand the test suite for the Clarence insurance platform backend.

---

## Test Structure

### 1. **Unit Tests** (`*.spec.ts`)
- Test individual services in isolation
- Mock all dependencies
- Fast execution
- Located alongside service files

### 2. **E2E Tests** (`test/*.e2e-spec.ts`)
- Test complete user flows
- Use real database connections
- Call actual carrier APIs
- Test full stack integration

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm test -- carriers.service.spec.ts
npm test -- quote-to-policy-flow.e2e-spec.ts
```

### Run with Coverage
```bash
npm run test:cov
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

---

## Test Files Overview

### Unit Tests

#### 1. `carriers.service.spec.ts`
**What it tests:**
- Finding active carriers
- Filtering carriers by coverage type
- Requesting quotes from individual carriers
- Requesting quotes from all carriers in parallel
- Handling carrier API failures gracefully
- Carrier health checks

**Key test cases:**
- ✅ Should return list of active carriers
- ✅ Should filter carriers by insurance type and coverages
- ✅ Should request quotes from carrier API
- ✅ Should continue processing if one carrier fails
- ✅ Should update carrier health status

#### 2. `quotes.service.spec.ts`
**What it tests:**
- Creating quote requests (from frontend data)
- Updating quote requests
- Selecting coverages
- Submitting quote requests
- Quote request validation
- Retrieving quotes with carrier data

**Key test cases:**
- ✅ Should create quote request with DRAFT status
- ✅ Should update existing quote request
- ✅ Should save selected coverages
- ✅ Should throw error if already submitted
- ✅ Should throw error if no coverages selected
- ✅ Should return quote with all quotes and coverages

### E2E Tests

#### 1. `carriers.e2e-spec.ts`
**What it tests:**
- GET /api/v1/carriers endpoint
- GET /api/v1/carriers/:id/health endpoint
- Carrier API structure and data

**Test flow:**
1. Get list of all carriers
2. Verify carrier structure
3. Register user (for authenticated endpoints)
4. Check carrier health

#### 2. `quote-to-policy-flow.e2e-spec.ts` ⭐ **MAIN TEST**
**What it tests:**
- Complete quote-to-policy workflow
- **Real carrier API integration**
- Multi-carrier quoting
- Policy binding

**Test flow:**
```
1. Frontend submits complete quote request (all 5 steps)
   ↓
2. Select coverages (Step 4)
   ↓
3. Register user with phone verification
   ↓
4. Link quote to user
   ↓
5. Submit quote request → Calls ALL CARRIER APIs in parallel
   ↓
6. Retrieve quotes from multiple carriers
   ↓
7. Bind selected quote to create policy
   ↓
8. Verify policy details
   ↓
9. Display complete flow summary
```

**What makes this test special:**
- 🔥 **Calls real carrier APIs** (not mocked)
- 🔥 Tests all 4 carriers simultaneously
- 🔥 Verifies quotes from multiple carriers
- 🔥 Tests actual policy binding
- 🔥 End-to-end integration test

**Test assertions:**
- ✅ Quote request created successfully
- ✅ Coverages selected and saved
- ✅ User registration with SMS verification
- ✅ Quote submitted and processed
- ✅ Quotes received from **at least 2 carriers**
- ✅ Quotes contain correct coverage types
- ✅ Policy bound successfully with policy number
- ✅ Policy documents generated

---

## Running the Main E2E Test

### Prerequisites
1. PostgreSQL running on localhost:5432
2. Backend server **NOT** running (test starts its own instance)
3. Carrier simulator running on localhost:3001

### Check Carrier Simulator Status
```bash
curl -H "X-API-Key: test_clarence_key_123" \
  http://localhost:3001/api/v1/carriers/reliable_insurance/health
```

Expected response:
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

### Run the Full Flow Test
```bash
# Stop the dev server first
lsof -ti:3000 | xargs kill -9

# Run the e2e test
npm run test:e2e -- quote-to-policy-flow.e2e-spec.ts

# Or run all e2e tests
npm run test:e2e
```

### Expected Output

The test will show detailed progress:

```
Quote to Policy Flow E2E Tests (with Real Carrier API Calls)
  Step 1: Create Quote Request (Frontend sends complete data)
    ✓ should create a quote request with all 5 steps data (150ms)

  Step 2: Select Coverages (Step 4 from frontend)
    ✓ should select coverages for the quote request (89ms)

  Step 3: Register User
    ✓ should send verification code to phone (120ms)
    ✓ should register user with phone and password (245ms)

  Step 4: Link Quote to User and Submit
    ✓ should update quote request with userId (92ms)
    ✓ should submit quote request and get quotes from ALL CARRIERS (5234ms)

  Step 5: Get Quotes from Carriers
    ✓ should retrieve quotes from all carriers (156ms)

    ✅ Received 12 quotes from carriers:
      - Reliable Insurance Co.: general_liability - $1,200/year
      - Reliable Insurance Co.: professional_liability - $1,800/year
      - Reliable Insurance Co.: cyber_liability - $2,400/year
      - TechShield Underwriters: professional_liability - $1,650/year
      - TechShield Underwriters: cyber_liability - $2,200/year
      - Premier Underwriters: general_liability - $1,150/year
      - Premier Underwriters: professional_liability - $1,750/year
      - Premier Underwriters: cyber_liability - $2,300/year
      - FastBind Insurance: general_liability - $1,300/year
      - FastBind Insurance: professional_liability - $1,900/year

    ✓ should have quotes from at least 2 different carriers (95ms)
    ✓ should have quotes for requested coverage types (88ms)

  Step 6: Bind Policy from Quote
    ✓ should bind a selected quote to create a policy (3456ms)

    ✅ Policy bound successfully:
      - Policy Number: POL-2025-001234
      - Coverage: general_liability
      - Annual Premium: $1,200
      - Monthly Premium: $110

  Step 7: Verify Policy Details
    ✓ should retrieve user policies (102ms)

  Full Flow Summary
    ✓ should log complete flow summary (145ms)

    ============================================================
    📊 FULL QUOTE-TO-POLICY FLOW SUMMARY
    ============================================================
    Quote Request ID: abc123-def456-ghi789
    User ID: user-xyz789
    Business: Acme Tech LLC

    Quotes Received: 12
    Carriers Responded: 4

    Policies Bound: 1
    Policy Number: POL-2025-001234
    Annual Premium: $1,200
    ============================================================

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        12.456 s
```

---

## Test Data

### Sample Quote Request (Frontend sends this)
```javascript
{
  sessionId: "test-session-123",
  insuranceType: "commercial",
  requestType: "new_coverage",

  // Step 2: Business Basics
  legalBusinessName: "Acme Tech LLC",
  dbaName: "Acme Technologies",
  legalStructure: "LLC",
  businessWebsite: "https://acmetech.com",
  industry: "Technology Consulting",
  industryCode: "541512",
  businessDescription: "Software development and IT consulting",
  fein: "12-3456789",
  yearStarted: 2020,
  yearsCurrentOwnership: 4,

  // Address
  addressType: "physical",
  streetAddress: "123 Tech Street",
  addressUnit: "Suite 100",
  city: "San Francisco",
  state: "CA",
  zipCode: "94105",

  // Step 3: Financial Information
  revenue2024: 500000,
  expenses2024: 300000,
  revenue2025Estimate: 750000,
  expenses2025Estimate: 400000,
  fullTimeEmployees: 5,
  partTimeEmployees: 2,
  totalPayroll: 400000,
  contractorPercentage: 20,

  // Contact
  contactFirstName: "John",
  contactLastName: "Doe",
  contactEmail: "john@acmetech.com",
  contactPhone: "+15551234567",

  // Step 5: Additional Comments
  additionalComments: "Looking for comprehensive coverage"
}
```

### Sample Coverage Selection
```javascript
{
  selectedCoverages: [
    "general_liability",
    "professional_liability",
    "cyber_liability"
  ]
}
```

---

## Debugging Tests

### View Test Logs
```bash
npm test -- --verbose
```

### Run Single Test Case
```bash
npm test -- -t "should create a quote request"
```

### Debug Mode
```bash
npm run test:debug
```

Then open Chrome and navigate to: `chrome://inspect`

---

## Common Issues

### Issue: Carrier API Timeout
**Symptom:** Test fails with "Request timeout"
**Solution:**
- Check carrier simulator is running: `curl http://localhost:3001/api/v1/carriers/reliable_insurance/health`
- Increase test timeout in test file

### Issue: Database Connection Error
**Symptom:** "Connection refused" or "Database not found"
**Solution:**
- Verify PostgreSQL is running: `psql -U postgres -d clarence_db`
- Check DATABASE_* variables in `.env`

### Issue: Port Already in Use
**Symptom:** "EADDRINUSE: address already in use :::3000"
**Solution:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: SMS Verification Failing
**Symptom:** "Invalid verification code"
**Solution:**
- Check SMS_MOCK_MODE=true in `.env`
- Use OTP code: `111111` in tests

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: clarence_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run migration:run

      - name: Run unit tests
        run: npm run test:unit

      - name: Run e2e tests
        run: npm run test:e2e
```

---

## Test Coverage

### View Coverage Report
```bash
npm run test:cov
```

Coverage report will be generated in `coverage/` directory.

### Coverage Goals
- **Unit Tests:** 80%+ coverage
- **E2E Tests:** All critical user flows
- **Integration Tests:** All API endpoints

---

## Best Practices

### 1. **Test Naming**
- Unit tests: `[method-name].should.[expected-behavior]`
- E2E tests: `should [user-action] [expected-result]`

### 2. **Test Organization**
- Group related tests with `describe()`
- One assertion per test when possible
- Clear, descriptive test names

### 3. **Test Data**
- Use factories or builders for test data
- Clean up test data in `afterAll()`
- Use unique identifiers (timestamps)

### 4. **Mocking**
- Mock external services in unit tests
- Use real services in e2e tests
- Never mock the system under test

### 5. **Assertions**
- Use specific assertions
- Test both happy path and error cases
- Verify API response structure

---

## Next Steps

1. ✅ Run unit tests to verify service logic
2. ✅ Run e2e test to verify carrier integration
3. ✅ Add more test cases for edge scenarios
4. ✅ Set up CI/CD pipeline
5. ✅ Monitor test coverage

---

## Questions?

- Review test files for examples
- Check test output for detailed logs
- See `CONTINUATION_STATUS.md` for system overview

---

_Last Updated: November 12, 2025_
