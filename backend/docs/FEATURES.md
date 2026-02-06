# Backend Features Documentation

## API Endpoints

### Quote Management

#### POST /api/v1/quotes/submit
Submit a complete quote request in one call. Creates the quote, adds coverages, validates, and submits to carriers.

**Request Body:**
```json
{
  "insuranceType": "commercial",
  "requestType": "new_business",
  "legalBusinessName": "Acme Corp",
  "industry": "Technology",
  "streetAddress": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "contactFirstName": "John",
  "contactLastName": "Doe",
  "contactEmail": "john@acme.com",
  "contactPhone": "555-0123",
  "selectedCoverages": ["general_liability", "professional_liability"]
}
```

**Response:** Returns the created `QuoteRequest` with status `submitted`.

#### GET /api/v1/quotes
Get all quote requests, ordered by creation date (newest first).

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "quotes_ready",
    "legalBusinessName": "Acme Corp",
    ...
  }
]
```

#### GET /api/v1/quotes/:id
Get a specific quote request with its associated carrier quotes.

**Response:**
```json
{
  "quoteRequest": { ... },
  "coverages": [ ... ],
  "quotes": [ ... ]
}
```

#### GET /api/v1/quotes/:id/options
Get insurance options derived from carrier quotes for a specific quote request. Returns options formatted for the frontend with carrier info, premiums, coverage details, and recommendation flags.

**Response:**
```json
{
  "options": [
    {
      "id": "carrier-quote-id",
      "quoteId": "quote-request-id",
      "carrier": "Hartford Insurance",
      "carrierRating": { "agency": "A.M. Best", "rating": "A+", "outlook": "Stable" },
      "annualPremium": 2500,
      "monthlyPremium": 220,
      "quarterlyPremium": 650,
      "coverageType": "general_liability",
      "coverageLimits": { ... },
      "coverageHighlights": [ ... ],
      "deductible": 1000,
      "features": [ ... ],
      "status": "available",
      "availableUntil": "2026-03-06T00:00:00.000Z",
      "recommended": true,
      "popularChoice": false,
      "bestValue": true
    }
  ],
  "quoteId": "quote-request-id"
}
```

### Policy Management

#### POST /api/v1/policies/bind
Bind a carrier quote to create a policy.

**Request Body:**
```json
{
  "carrierQuoteId": "uuid",
  "userId": "uuid",
  "paymentPlan": "annual",
  "autoRenewal": true,
  "paymentMethodId": "pm_xxx"
}
```

**Response:** Returns the created `Policy` with policy number and dates.

#### GET /api/v1/policies
Get all policies for the authenticated user.

#### GET /api/v1/policies/active
Get active policies for the authenticated user.

#### GET /api/v1/policies/:id
Get a specific policy by ID.

---

## Quote Submission Flow

1. **Frontend collects data** - User fills multi-step quote form, data stored in Zustand store
2. **Submit to unified endpoint** - Frontend calls `POST /quotes/submit` with all data
3. **Backend creates quote** - Creates `QuoteRequest` entity with `DRAFT` status
4. **Backend creates coverages** - Creates `QuoteRequestCoverage` entries for selected coverages
5. **Backend validates** - Validates required fields
6. **Backend submits** - Updates status to `SUBMITTED`, processes asynchronously
7. **Carrier requests** - `CarriersService.requestQuotesFromAllCarriers()` sends requests to eligible carriers
8. **Quotes received** - `CarrierQuote` entities created for each carrier response
9. **Status updated** - Quote status becomes `QUOTES_READY` when complete

---

## Carrier Integration

### Carrier API Simulator
The backend integrates with carriers via the `carrier-api-simulator` service.

**Base URL:** Configured per carrier in `carriers` table (e.g., `http://localhost:3002/api/v1`)

### Quote Request Flow
1. `CarriersService.findCarriersForCoverages()` - Find carriers supporting the insurance type and coverages
2. `CarriersService.requestQuotesFromAllCarriers()` - Request quotes from all eligible carriers in parallel
3. For each carrier, `requestQuote()` calls `POST /carriers/{carrierCode}/quote`
4. Carrier API returns quote with pricing, coverage limits, and validity period
5. Response mapped to `CarrierQuote` entity and saved

### Bind Request Flow
1. `CarriersService.bindQuote()` - Bind a specific carrier quote
2. Calls `POST /carriers/{carrierCode}/bind` with quote ID and payment info
3. Returns policy number, documents, and effective dates

---

## Insurance Options

Insurance options are derived from `CarrierQuote` entities and transformed for frontend display.

### Option Properties
- **Carrier info**: Name, rating (agency, rating, outlook)
- **Pricing**: Annual, monthly, quarterly premiums
- **Coverage**: Type, limits, deductible, highlights
- **Features**: Carrier-specific features and benefits
- **Flags**: `recommended`, `popularChoice`, `bestValue`
- **Status**: `available`, `purchased`, `expired`, `declined`
- **Validity**: `availableUntil` date from carrier quote

### Recommendation Logic
- **recommended**: Best overall value (price/coverage ratio)
- **popularChoice**: Lowest annual premium
- **bestValue**: Best coverage for the price tier

---

## Purchase/Policy Binding Flow

1. **User selects option** - Frontend displays insurance options, user chooses one
2. **Payment flow** - User enters payment info, reviews, and signs
3. **Bind request** - Frontend calls `POST /policies/bind` with carrier quote ID
4. **Backend processes** - `PoliciesService.bindPolicy()`:
   - Validates carrier quote exists and is valid
   - Calls `CarriersService.bindQuote()` to bind with carrier
   - Creates `Policy` entity with carrier response data
5. **Policy created** - Returns policy with number, dates, and document URLs
6. **Frontend displays** - Shows success with policy details
