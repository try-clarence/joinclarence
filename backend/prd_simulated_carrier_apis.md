# Simulated Carrier API - Backend PRD

## Data Models & REST API Specification (MVP)

---

**Version:** 1.0  
**Date:** February 2026  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Models](#3-data-models)
4. [REST API Specification](#4-rest-api-specification)
5. [Pricing Engine Logic](#5-pricing-engine-logic)
6. [Error Handling](#6-error-handling)
7. [Configuration & Extensibility](#7-configuration--extensibility)

---

## 1. Overview

### 1.1 Purpose

The Simulated Carrier API is an **internal microservice** that mimics real insurance carrier APIs. It enables the Clarence platform to operate end-to-end without real carrier integrations during the MVP phase.

### 1.2 Why This Service Exists

| Challenge | Solution |
|-----------|----------|
| Real carrier APIs require contracts, credentials, and compliance | Simulated API works immediately |
| Carrier integrations take 3-6 months each | MVP launches in weeks |
| Testing with real carriers costs money | Unlimited free testing |
| Need consistent demo experience | Predictable, controllable quotes |
| Must establish API contract for future | Same interface works for real carriers later |

### 1.3 Design Principles

1. **Mirror Real Carrier Behavior**: Response formats, timing, and edge cases should match real carrier APIs
2. **Configurable Pricing**: Easy to adjust rates without code changes
3. **Realistic Variance**: Quotes should vary by carrier to simulate market competition
4. **Decline Scenarios**: Some requests should be declined to mirror real underwriting
5. **Stateless Design**: No database required for MVP; all logic is computational
6. **Swappable**: Interface designed so real carrier adapters can replace simulation

### 1.4 Scope

**In Scope (MVP):**
- Quote generation for GL, WC, EPL, CYBER, E&O, D&O
- 3 simulated carriers with distinct pricing profiles
- Policy binding simulation
- Document URL generation (placeholder)
- Rate configuration via environment/config

**Out of Scope (MVP):**
- Real document generation
- Claims processing
- Policy modifications/endorsements
- Cancellation processing
- Renewal quotes

---

## 2. Architecture

### 2.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                   Clarence Core API                         │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Quote     │    │   Policy    │    │   Job       │    │
│  │   Service   │───▶│   Service   │    │   Queue     │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                  │                  │            │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Simulated Carrier API (This Service)           │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Quote     │    │   Bind      │    │   Pricing   │    │
│  │   Engine    │    │   Engine    │    │   Config    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Carrier Simulators                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│  │  │ Atlas   │  │ Shield  │  │  Apex   │             │  │
│  │  │Insurance│  │ Direct  │  │ Mutual  │             │  │
│  │  └─────────┘  └─────────┘  └─────────┘             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | NestJS (TypeScript) | Matches Clarence Core for consistency |
| Configuration | Environment variables + JSON config | Easy rate adjustments |
| Caching | In-memory (Node.js Map) | Quote ID lookup, no persistence needed |
| Documentation | OpenAPI/Swagger | Auto-generated API docs |

### 2.3 Deployment

- **MVP**: Same server as Clarence Core (internal HTTP calls)
- **Future**: Separate microservice with internal load balancer
- **Communication**: REST over HTTP (internal network only)

---

## 3. Data Models

The Simulated Carrier API is **stateless** for MVP. These models represent request/response structures, not database tables.

### 3.1 Core Models Overview

```
┌──────────────────┐     ┌──────────────────┐
│  QuoteRequest    │────▶│   QuoteResponse  │
└──────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   CarrierQuote   │
                         └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   BindResponse   │
                         └──────────────────┘
```

---

### 3.2 Carrier (Configuration Model)

Represents a simulated insurance carrier. Stored in configuration, not database.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | Yes | Unique carrier identifier (e.g., "SIM_CARRIER_A") |
| `name` | string | Yes | Display name shown to users (e.g., "Atlas Insurance") |
| `am_best_rating` | string | Yes | Financial strength rating for trust signals |
| `supported_coverages` | string[] | Yes | Coverage types this carrier offers |
| `supported_states` | string[] | Yes | States where carrier is licensed ("ALL" for nationwide) |
| `pricing_profile` | string | Yes | "PREMIUM", "VALUE", or "SPECIALTY" - affects base rates |
| `decline_threshold` | number | Yes | Risk score above which carrier declines (0-100) |
| `quote_validity_days` | integer | Yes | How long quotes remain valid |
| `highlights_template` | string[] | Yes | Marketing points for this carrier |
| `logo_url` | string | No | Carrier logo for UI display |

**Why These Fields:**

- **id**: System reference. Must be stable - used in Clarence Core database.
- **name**: User-facing. Can change without breaking integrations.
- **am_best_rating**: Users trust rated carriers. A+ > A > B ratings affect conversion.
- **supported_coverages**: Not all carriers offer all products. Apex specializes in tech; Shield doesn't do D&O.
- **supported_states**: Real carriers are licensed per state. Simulates this constraint.
- **pricing_profile**: Simplifies configuration. "PREMIUM" = higher price, broader coverage. "VALUE" = lower price, basic coverage.
- **decline_threshold**: Creates realistic scenario where some carriers decline risky businesses.

**Example Configuration:**

```json
{
  "id": "SIM_CARRIER_A",
  "name": "Atlas Insurance",
  "am_best_rating": "A+",
  "supported_coverages": ["GL", "WC", "EPL", "CYBER", "DO"],
  "supported_states": ["ALL"],
  "pricing_profile": "PREMIUM",
  "decline_threshold": 85,
  "quote_validity_days": 30,
  "highlights_template": [
    "A+ AM Best rated carrier",
    "24/7 claims support hotline",
    "Legal defense costs outside policy limits",
    "Blanket additional insured coverage"
  ]
}
```

---

### 3.3 CoverageType (Configuration Model)

Defines available insurance coverage types and their rating parameters.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `code` | string | Yes | Short code used in APIs (e.g., "GL", "WC") |
| `name` | string | Yes | Full name for display (e.g., "General Liability") |
| `description` | string | Yes | User-friendly explanation of what's covered |
| `rating_basis` | string | Yes | What premium is calculated from: "REVENUE", "PAYROLL", "EMPLOYEE_COUNT", "FLAT" |
| `default_limits` | object | Yes | Standard coverage limits structure |
| `available_limits` | object[] | Yes | Limit options users can choose from |
| `available_deductibles` | number[] | Yes | Deductible options |
| `base_rate_per_unit` | object | Yes | Base rates by risk tier (LOW, MEDIUM, HIGH) |
| `exclusions_template` | string[] | Yes | Standard exclusions for this coverage |
| `minimum_premium` | number | Yes | Floor premium regardless of calculation |

**Why These Fields:**

- **code**: Compact identifier for API calls and database storage.
- **rating_basis**: Different coverages price differently:
  - GL uses revenue (more sales = more customer exposure)
  - WC uses payroll (directly tied to employee injury risk)
  - D&O uses revenue + employee count
  - Cyber often uses flat rate + employee count
- **default_limits**: Pre-selected limits for quick quoting.
- **available_limits**: Users can customize; each option affects premium.
- **minimum_premium**: Carriers have minimums. Even a tiny business pays at least $500/year for GL.

**Example Configuration:**

```json
{
  "code": "GL",
  "name": "General Liability",
  "description": "Protects against claims of bodily injury, property damage, and personal injury caused by your business operations or products.",
  "rating_basis": "REVENUE",
  "default_limits": {
    "per_occurrence": 1000000,
    "general_aggregate": 2000000,
    "products_completed": 2000000,
    "personal_advertising": 1000000,
    "damage_rented_premises": 100000,
    "medical_expense": 5000
  },
  "available_limits": [
    {"per_occurrence": 500000, "general_aggregate": 1000000},
    {"per_occurrence": 1000000, "general_aggregate": 2000000},
    {"per_occurrence": 2000000, "general_aggregate": 4000000}
  ],
  "available_deductibles": [0, 500, 1000, 2500, 5000],
  "base_rate_per_unit": {
    "LOW": 0.75,
    "MEDIUM": 2.50,
    "HIGH": 6.00
  },
  "exclusions_template": [
    "Professional services errors (covered by E&O)",
    "Employment-related claims (covered by EPL)",
    "Intentional or criminal acts",
    "Pollution and environmental damage",
    "Cyber incidents and data breaches"
  ],
  "minimum_premium": 500
}
```

---

### 3.4 IndustryRiskProfile (Configuration Model)

Maps NAICS industry codes to risk classifications for pricing.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `naics_code` | string | Yes | Industry classification code |
| `naics_description` | string | Yes | Human-readable industry name |
| `gl_risk_tier` | string | Yes | Risk level for General Liability: "LOW", "MEDIUM", "HIGH" |
| `wc_risk_tier` | string | Yes | Risk level for Workers Comp |
| `wc_class_code` | string | Yes | NCCI class code for WC rating |
| `cyber_risk_tier` | string | Yes | Risk level for Cyber coverage |
| `professional_risk_tier` | string | Yes | Risk level for E&O/Professional Liability |
| `is_prohibited` | boolean | Yes | Whether this industry is declined by all carriers |
| `prohibited_reason` | string | No | Why industry is prohibited (if applicable) |
| `special_considerations` | string[] | No | Underwriting notes for this industry |

**Why These Fields:**

- **naics_code**: Standard classification. Real carriers use this exact system.
- **gl_risk_tier**: Software company (LOW) vs restaurant (MEDIUM) vs construction (HIGH) have vastly different slip-and-fall exposure.
- **wc_risk_tier**: Office workers rarely get hurt; roofers frequently do.
- **wc_class_code**: Real WC pricing uses NCCI codes. We simulate this.
- **cyber_risk_tier**: Healthcare and finance are HIGH risk for data breaches.
- **is_prohibited**: Cannabis, firearms, adult entertainment are often excluded.

**Example Configuration:**

```json
{
  "naics_code": "541511",
  "naics_description": "Custom Computer Programming Services",
  "gl_risk_tier": "LOW",
  "wc_risk_tier": "LOW",
  "wc_class_code": "8810",
  "cyber_risk_tier": "MEDIUM",
  "professional_risk_tier": "MEDIUM",
  "is_prohibited": false,
  "special_considerations": [
    "E&O coverage strongly recommended",
    "Cyber liability important if handling client data",
    "Low physical injury exposure"
  ]
}
```

---

### 3.5 StateModifier (Configuration Model)

State-specific rate adjustments reflecting regulatory and market differences.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `state_code` | string | Yes | 2-letter state abbreviation |
| `state_name` | string | Yes | Full state name |
| `gl_modifier` | number | Yes | Multiplier for GL premiums (1.0 = baseline) |
| `wc_modifier` | number | Yes | Multiplier for WC premiums |
| `cyber_modifier` | number | Yes | Multiplier for Cyber premiums |
| `epl_modifier` | number | Yes | Multiplier for Employment Practices |
| `minimum_wage` | number | No | For WC calculations in some states |
| `wc_monopolistic` | boolean | Yes | Whether state has monopolistic WC fund |
| `special_requirements` | string[] | No | State-specific coverage requirements |

**Why These Fields:**

- **state_code**: Lookup key for rate tables.
- **gl_modifier**: California (1.2x) has more lawsuits than Texas (0.95x).
- **wc_modifier**: New York (1.4x) has expensive workers comp; Texas (0.9x) is cheaper.
- **wc_monopolistic**: Ohio, Washington, Wyoming, North Dakota have state-run WC funds. Private carriers can't compete.
- **special_requirements**: California requires sexual harassment training disclosure; New York has specific labor laws.

**Example Configuration:**

```json
{
  "state_code": "CA",
  "state_name": "California",
  "gl_modifier": 1.20,
  "wc_modifier": 1.35,
  "cyber_modifier": 1.15,
  "epl_modifier": 1.40,
  "minimum_wage": 15.50,
  "wc_monopolistic": false,
  "special_requirements": [
    "Sexual harassment prevention training required",
    "Cal/OSHA compliance required",
    "Higher EPL exposure due to employment laws"
  ]
}
```

---

### 3.6 QuoteRequest (API Request Model)

Input model for requesting quotes from simulated carriers.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `request_id` | string | Yes | Clarence QuoteRequest UUID for correlation |
| `carrier_ids` | string[] | No | Specific carriers to quote (default: all eligible) |
| `coverage_type` | string | Yes | Coverage code to quote (e.g., "GL") |
| `effective_date` | string (date) | Yes | When coverage should start |
| `business` | BusinessInfo | Yes | Business data for underwriting/rating |
| `requested_limits` | object | No | Specific limits requested (uses defaults if omitted) |
| `requested_deductible` | number | No | Specific deductible requested |

**Why These Fields:**

- **request_id**: Links quote back to Clarence system. Critical for audit trail.
- **carrier_ids**: Allows requesting specific carriers for re-quotes or comparisons.
- **coverage_type**: One quote request per coverage type keeps logic simple.
- **effective_date**: Affects premium calculation (some dates cost more).
- **business**: All data needed for underwriting decision and pricing.
- **requested_limits**: Optional customization; defaults provide quick quotes.

---

### 3.7 BusinessInfo (Nested Request Model)

Business information required for quote rating. Subset of full business profile.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `legal_name` | string | Yes | For policy documents |
| `industry_code` | string | Yes | NAICS code - primary risk classifier |
| `state` | string | Yes | 2-letter state code - determines rates and regulations |
| `zip_code` | string | Yes | More granular location risk (future: territory rating) |
| `legal_structure` | string | Yes | LLC/CORP/SOLE_PROP - affects some coverages |
| `year_started` | integer | Yes | Business age - new businesses are riskier |
| `revenue` | number | Yes | Annual revenue - GL rating basis |
| `payroll` | number | Yes | Annual payroll - WC rating basis |
| `employees_ft` | integer | Yes | Full-time count - multiple coverages use this |
| `employees_pt` | integer | Yes | Part-time count - converted to FTE for rating |
| `has_claims_history` | boolean | No | Prior claims flag - increases premiums |
| `claims_count_3yr` | integer | No | Number of claims in last 3 years |
| `years_with_coverage` | integer | No | Prior insurance history - affects pricing |
| `is_new_venture` | boolean | No | Brand new business flag - higher risk |

**Why These Fields:**

- **industry_code**: #1 factor in pricing. Determines base rate tier.
- **state**: #2 factor. State modifiers can swing premium ±40%.
- **year_started**: Businesses < 3 years old pay 15-25% more.
- **revenue**: For GL, premium = (revenue / 1000) × rate. $1M revenue vs $100K = 10x premium difference.
- **payroll**: For WC, premium = (payroll / 100) × rate. Directly proportional.
- **employees_ft/pt**: Affects WC, EPL, CYBER, D&O calculations.
- **has_claims_history**: Prior claims can increase premium 25-100%.
- **years_with_coverage**: Continuous coverage shows responsibility; gaps are red flags.

---

### 3.8 CarrierQuote (API Response Model)

Individual quote from a single carrier.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `carrier_id` | string | Yes | Which carrier provided this quote |
| `carrier_name` | string | Yes | Display name for UI |
| `carrier_quote_id` | string | Yes | Unique quote reference for binding |
| `status` | string | Yes | "QUOTED" or "DECLINED" |
| `decline_reason` | string | No | Why carrier declined (if status=DECLINED) |
| `decline_suggestion` | string | No | Alternative suggestion for declined quotes |
| `premium` | PremiumBreakdown | Yes* | Premium details (*required if QUOTED) |
| `deductible` | number | Yes* | Policy deductible amount |
| `limits` | object | Yes* | Coverage limits structure |
| `highlights` | string[] | Yes* | Key selling points |
| `exclusions` | string[] | Yes* | What's not covered |
| `effective_date` | string (date) | Yes* | Policy start date |
| `expiration_date` | string (date) | Yes* | Policy end date |
| `valid_until` | string (datetime) | Yes* | When this quote expires |
| `rating_info` | RatingBreakdown | No | How premium was calculated (debugging) |
| `underwriting_notes` | string[] | No | Notes about this risk |

**Why These Fields:**

- **carrier_quote_id**: Must be unique. Used to bind this specific quote.
- **status**: Carriers can decline. This is normal and expected.
- **decline_reason**: Helps user understand why and what to do.
- **premium**: Structured breakdown enables payment plan calculations.
- **limits**: Must match what user can see and understand.
- **highlights**: Marketing differentiators between carriers.
- **exclusions**: Transparency about coverage gaps.
- **valid_until**: Quotes expire. User must act within timeframe.
- **rating_info**: Helps debug pricing issues; can hide from users.

---

### 3.9 PremiumBreakdown (Nested Response Model)

Detailed premium structure.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `annual` | number | Yes | Full annual premium |
| `monthly` | number | Yes | Monthly payment amount (includes financing) |
| `quarterly` | number | Yes | Quarterly payment amount |
| `down_payment` | number | No | Required down payment for payment plans |
| `monthly_installments` | integer | No | Number of monthly payments |
| `financing_fee_pct` | number | No | Percentage added for payment plans |

**Why These Fields:**

- **annual**: Primary comparison metric. Always shown prominently.
- **monthly**: Small businesses prefer monthly. Calculated as: `(annual / 10) × 1.05` (10 payments after 2-month down payment, 5% fee).
- **quarterly**: Middle ground option.
- **financing_fee_pct**: Transparency about the cost of payment plans.

---

### 3.10 RatingBreakdown (Nested Response Model)

Shows how premium was calculated. For debugging and transparency.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `base_rate` | number | Yes | Starting rate from rate tables |
| `rating_basis_value` | number | Yes | The value used (revenue, payroll, etc.) |
| `rating_basis_unit` | string | Yes | What the basis is ("per $1,000 revenue") |
| `industry_modifier` | number | Yes | Adjustment for industry risk |
| `state_modifier` | number | Yes | Adjustment for state |
| `experience_modifier` | number | Yes | Adjustment for business age/history |
| `carrier_modifier` | number | Yes | Carrier-specific adjustment |
| `limit_modifier` | number | Yes | Adjustment for chosen limits |
| `deductible_credit` | number | Yes | Discount for higher deductible |
| `calculated_premium` | number | Yes | Pre-minimum premium |
| `minimum_premium` | number | Yes | Premium floor |
| `final_premium` | number | Yes | Actual charged premium |

**Why These Fields:**

- Enables "show your work" for premium calculations
- Helps debug when quotes seem wrong
- Can be exposed to users for transparency (optional)
- Matches how real actuarial rating works

---

### 3.11 BindRequest (API Request Model)

Request to convert a quote to a policy.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `carrier_quote_id` | string | Yes | Reference to the quote being bound |
| `carrier_id` | string | Yes | Carrier that issued the quote |
| `effective_date` | string (date) | Yes | Policy start date (must match or be after quote) |
| `payment_plan` | string | Yes | "ANNUAL", "MONTHLY", "QUARTERLY" |
| `insured` | InsuredInfo | Yes | Named insured details for policy |

**Why These Fields:**

- **carrier_quote_id**: Links to specific quote. Validates quote is still valid.
- **effective_date**: May differ from quote if user delays purchase.
- **payment_plan**: Affects billing setup and potentially premium.
- **insured**: Official policyholder information for documents.

---

### 3.12 InsuredInfo (Nested Request Model)

Named insured information for policy issuance.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `legal_name` | string | Yes | Exact legal business name |
| `dba_name` | string | No | DBA if different from legal name |
| `address_street` | string | Yes | Street address for policy |
| `address_city` | string | Yes | City |
| `address_state` | string | Yes | State code |
| `address_zip` | string | Yes | ZIP code |
| `fein` | string | No | Federal EIN for verification |
| `contact_name` | string | Yes | Primary contact person |
| `contact_email` | string | Yes | Email for policy delivery |
| `contact_phone` | string | Yes | Phone for claims contact |

**Why These Fields:**

- All fields appear on policy declarations page
- Legal name must match business registration
- Address determines policy territory
- Contact info used for policy delivery and claims

---

### 3.13 BindResponse (API Response Model)

Result of binding a quote to a policy.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `carrier_id` | string | Yes | Carrier that issued policy |
| `carrier_policy_id` | string | Yes | Carrier's internal policy number |
| `status` | string | Yes | "BOUND", "FAILED", "PENDING_REVIEW" |
| `failure_reason` | string | No | Why binding failed (if applicable) |
| `policy_number` | string | Yes* | Human-readable policy number |
| `effective_date` | string (date) | Yes* | Coverage start date |
| `expiration_date` | string (date) | Yes* | Coverage end date |
| `premium_final` | number | Yes* | Confirmed premium amount |
| `documents` | PolicyDocuments | Yes* | URLs to policy documents |
| `bound_at` | string (datetime) | Yes* | When policy was issued |
| `payment_schedule` | PaymentSchedule | No | Billing details if payment plan |

**Why These Fields:**

- **carrier_policy_id**: Internal reference for carrier systems.
- **policy_number**: User-facing number for customer service.
- **status**: Binding can fail if quote expired or other issues.
- **documents**: Immediate access to policy paperwork.
- **bound_at**: Exact timestamp for compliance/audit.

---

### 3.14 PolicyDocuments (Nested Response Model)

URLs to generated policy documents.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `policy_pdf_url` | string | Yes | Full policy document |
| `declarations_pdf_url` | string | Yes | Dec page summary |
| `coi_pdf_url` | string | Yes | Certificate of Insurance |
| `id_cards_pdf_url` | string | No | ID cards (for auto policies) |

**Why These Fields:**

- **policy_pdf_url**: Complete policy terms and conditions.
- **declarations_pdf_url**: Summary page showing coverages, limits, premium.
- **coi_pdf_url**: Proof of insurance for third parties.

**Note:** For MVP, these return placeholder/template URLs. Real document generation is Phase 2.

---

## 4. REST API Specification

Base URL: `/api/v1` (internal service)

All endpoints are **internal only** - not exposed to public internet.

---

### 4.1 POST /quote

Generate quotes from simulated carriers for a coverage type.

**Purpose:** Main quote generation endpoint. Returns quotes from all eligible carriers.

---

**Request Body:**

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "carrier_ids": ["SIM_CARRIER_A", "SIM_CARRIER_B"],
  "coverage_type": "GL",
  "effective_date": "2026-03-01",
  "business": {
    "legal_name": "Acme Software Inc",
    "industry_code": "541511",
    "state": "CA",
    "zip_code": "94105",
    "legal_structure": "CORP",
    "year_started": 2020,
    "revenue": 1500000,
    "payroll": 800000,
    "employees_ft": 12,
    "employees_pt": 3,
    "has_claims_history": false,
    "claims_count_3yr": 0,
    "years_with_coverage": 4,
    "is_new_venture": false
  },
  "requested_limits": {
    "per_occurrence": 1000000,
    "general_aggregate": 2000000
  },
  "requested_deductible": 500
}
```

**Request Field Explanations:**

| Field | Why Required | Impact on Quote |
|-------|--------------|-----------------|
| `request_id` | Correlation with Clarence system | None - tracking only |
| `carrier_ids` | Optional filtering | Limits which carriers respond |
| `coverage_type` | Determines rating logic | Different calculations per type |
| `effective_date` | Policy start | Affects validity period |
| `business.industry_code` | Risk classification | Selects base rate tier |
| `business.state` | Regulatory/rate lookup | Applies state modifier |
| `business.revenue` | GL rating basis | Direct premium multiplier |
| `business.payroll` | WC rating basis | Direct premium multiplier |
| `business.employees_ft/pt` | Multiple coverages | EPL, CYBER, D&O calculations |
| `business.year_started` | Experience rating | <3 years = 15% surcharge |
| `business.has_claims_history` | Loss history | +25-100% if true |
| `requested_limits` | Coverage amount | Higher limits = higher premium |
| `requested_deductible` | Risk retention | Higher deductible = lower premium |

---

**Response Body (200 OK):**

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "coverage_type": "GL",
  "generated_at": "2026-02-03T10:15:00Z",
  "quotes": [
    {
      "carrier_id": "SIM_CARRIER_A",
      "carrier_name": "Atlas Insurance",
      "carrier_quote_id": "ATL-GL-2026-789012",
      "status": "QUOTED",
      "premium": {
        "annual": 1875.00,
        "monthly": 196.88,
        "quarterly": 492.19,
        "down_payment": 375.00,
        "monthly_installments": 10,
        "financing_fee_pct": 5.0
      },
      "deductible": 500.00,
      "limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000,
        "products_completed": 2000000,
        "personal_advertising": 1000000,
        "damage_rented_premises": 100000,
        "medical_expense": 5000
      },
      "highlights": [
        "A+ AM Best rated carrier",
        "24/7 claims support hotline",
        "Legal defense costs outside policy limits",
        "Blanket additional insured coverage"
      ],
      "exclusions": [
        "Professional services errors (covered by E&O)",
        "Employment-related claims (covered by EPL)",
        "Intentional or criminal acts",
        "Pollution and environmental damage",
        "Cyber incidents and data breaches"
      ],
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "valid_until": "2026-04-02T23:59:59Z",
      "rating_info": {
        "base_rate": 0.75,
        "rating_basis_value": 1500000,
        "rating_basis_unit": "per $1,000 revenue",
        "industry_modifier": 1.00,
        "state_modifier": 1.20,
        "experience_modifier": 0.95,
        "carrier_modifier": 1.10,
        "limit_modifier": 1.00,
        "deductible_credit": 0.95,
        "calculated_premium": 1875.00,
        "minimum_premium": 500.00,
        "final_premium": 1875.00
      },
      "underwriting_notes": [
        "Software development class - standard acceptance",
        "Clean claims history - preferred risk",
        "4 years continuous coverage - positive indicator"
      ]
    },
    {
      "carrier_id": "SIM_CARRIER_B",
      "carrier_name": "Shield Direct",
      "carrier_quote_id": "SHD-GL-2026-456789",
      "status": "QUOTED",
      "premium": {
        "annual": 1650.00,
        "monthly": 173.25,
        "quarterly": 433.13
      },
      "deductible": 1000.00,
      "limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000
      },
      "highlights": [
        "Competitive pricing leader",
        "Easy online claims filing",
        "Flexible monthly payments",
        "A rated by AM Best"
      ],
      "exclusions": [
        "Professional services",
        "Employment practices",
        "Pollution",
        "Cyber incidents"
      ],
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "valid_until": "2026-04-02T23:59:59Z"
    }
  ],
  "declined": [
    {
      "carrier_id": "SIM_CARRIER_C",
      "carrier_name": "Apex Mutual",
      "status": "DECLINED",
      "decline_reason": "Revenue exceeds our small business GL program limit of $1M",
      "decline_suggestion": "Consider our middle market program for businesses over $1M revenue"
    }
  ]
}
```

**Response Field Explanations:**

| Field | Purpose | How It's Used |
|-------|---------|---------------|
| `carrier_quote_id` | Unique reference | Required for binding |
| `status` | QUOTED vs DECLINED | UI shows different treatment |
| `premium.annual` | Primary price | Main comparison metric |
| `premium.monthly` | Cash flow option | Popular with small businesses |
| `deductible` | Out-of-pocket | Trade-off with premium |
| `limits` | Coverage amounts | Must understand what's covered |
| `highlights` | Carrier differentiation | Marketing/sales support |
| `exclusions` | Coverage gaps | Transparency, cross-sell E&O/Cyber |
| `valid_until` | Quote expiration | Create urgency |
| `rating_info` | Calculation breakdown | Debugging, transparency |
| `declined[]` | Rejections | Real carrier behavior |

---

### 4.2 POST /quote/bulk

Generate quotes for multiple coverage types in one request.

**Purpose:** Efficiency when user requests GL + WC + EPL together.

---

**Request Body:**

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "coverage_types": ["GL", "WC", "EPL"],
  "effective_date": "2026-03-01",
  "business": {
    "legal_name": "Acme Software Inc",
    "industry_code": "541511",
    "state": "CA",
    "zip_code": "94105",
    "legal_structure": "CORP",
    "year_started": 2020,
    "revenue": 1500000,
    "payroll": 800000,
    "employees_ft": 12,
    "employees_pt": 3
  }
}
```

---

**Response Body (200 OK):**

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2026-02-03T10:15:00Z",
  "results": [
    {
      "coverage_type": "GL",
      "quotes": [...],
      "declined": [...]
    },
    {
      "coverage_type": "WC",
      "quotes": [...],
      "declined": [...]
    },
    {
      "coverage_type": "EPL",
      "quotes": [...],
      "declined": [...]
    }
  ],
  "summary": {
    "total_quotes": 8,
    "total_declined": 1,
    "lowest_package_premium": 4250.00,
    "coverage_types_quoted": 3
  }
}
```

---

### 4.3 POST /bind

Convert a quote to an active policy.

**Purpose:** Finalizes the purchase. Creates policy records in carrier system.

---

**Request Body:**

```json
{
  "carrier_quote_id": "ATL-GL-2026-789012",
  "carrier_id": "SIM_CARRIER_A",
  "effective_date": "2026-03-01",
  "payment_plan": "ANNUAL",
  "insured": {
    "legal_name": "Acme Software Inc",
    "dba_name": "Acme",
    "address_street": "123 Main Street, Suite 400",
    "address_city": "San Francisco",
    "address_state": "CA",
    "address_zip": "94105",
    "fein": "12-3456789",
    "contact_name": "John Smith",
    "contact_email": "john@acmesoftware.com",
    "contact_phone": "+14155551234"
  }
}
```

**Request Field Explanations:**

| Field | Why Required | Validation |
|-------|--------------|------------|
| `carrier_quote_id` | Identifies exact quote | Must exist and be valid |
| `carrier_id` | Confirms carrier | Must match quote |
| `effective_date` | Policy start | Cannot be before quote effective date |
| `payment_plan` | Billing setup | Affects down payment calculation |
| `insured.legal_name` | Named insured | Appears on all documents |
| `insured.address_*` | Policy territory | Must be in quoted state |
| `insured.contact_*` | Delivery/claims | Required for communications |

---

**Response Body (200 OK):**

```json
{
  "carrier_id": "SIM_CARRIER_A",
  "carrier_policy_id": "ATL-POL-2026-789012",
  "status": "BOUND",
  "policy_number": "ATL-GL-2026-789012",
  "effective_date": "2026-03-01",
  "expiration_date": "2027-03-01",
  "premium_final": 1875.00,
  "documents": {
    "policy_pdf_url": "https://simulated-carrier-docs.s3.amazonaws.com/policies/ATL-POL-2026-789012.pdf",
    "declarations_pdf_url": "https://simulated-carrier-docs.s3.amazonaws.com/dec-pages/ATL-POL-2026-789012-dec.pdf",
    "coi_pdf_url": "https://simulated-carrier-docs.s3.amazonaws.com/coi/ATL-POL-2026-789012-coi.pdf"
  },
  "payment_schedule": {
    "total_premium": 1875.00,
    "payment_plan": "ANNUAL",
    "amount_due_now": 1875.00,
    "next_payment_date": null,
    "installments_remaining": 0
  },
  "bound_at": "2026-02-03T16:00:00Z"
}
```

**Response Field Explanations:**

| Field | Purpose | Next Steps |
|-------|---------|------------|
| `carrier_policy_id` | Carrier's internal ID | Reference for carrier systems |
| `policy_number` | User-facing number | Customer service, claims |
| `status` | BOUND confirms success | UI shows confirmation |
| `documents.*_url` | Policy paperwork | Download, email to user |
| `payment_schedule` | Billing info | Process payment |
| `bound_at` | Timestamp | Compliance audit trail |

---

### 4.4 GET /carriers

List all available carriers and their capabilities.

**Purpose:** Discovery endpoint for Clarence Core to know what's available.

---

**Response Body (200 OK):**

```json
{
  "carriers": [
    {
      "id": "SIM_CARRIER_A",
      "name": "Atlas Insurance",
      "am_best_rating": "A+",
      "supported_coverages": ["GL", "WC", "EPL", "CYBER", "DO"],
      "supported_states": ["ALL"],
      "pricing_profile": "PREMIUM",
      "description": "Premium carrier with comprehensive coverage options and superior claims service",
      "logo_url": "https://assets.clarence.ai/carriers/atlas-logo.png",
      "highlights": [
        "A+ AM Best rated",
        "24/7 claims support",
        "Broad coverage forms"
      ]
    },
    {
      "id": "SIM_CARRIER_B",
      "name": "Shield Direct",
      "am_best_rating": "A",
      "supported_coverages": ["GL", "WC", "CPL"],
      "supported_states": ["ALL"],
      "pricing_profile": "VALUE",
      "description": "Value-focused carrier with competitive pricing for standard risks",
      "logo_url": "https://assets.clarence.ai/carriers/shield-logo.png",
      "highlights": [
        "Lowest price guarantee",
        "Easy online service",
        "Quick claims payment"
      ]
    },
    {
      "id": "SIM_CARRIER_C",
      "name": "Apex Mutual",
      "am_best_rating": "A",
      "supported_coverages": ["GL", "EO", "CYBER", "DO", "EPL"],
      "supported_states": ["CA", "NY", "TX", "FL", "WA", "MA", "IL", "CO", "GA", "NC"],
      "pricing_profile": "SPECIALTY",
      "description": "Specialty carrier focused on technology and professional services",
      "logo_url": "https://assets.clarence.ai/carriers/apex-logo.png",
      "highlights": [
        "Tech industry specialists",
        "E&O/Cyber experts",
        "Startup-friendly"
      ]
    }
  ]
}
```

---

### 4.5 GET /carriers/:carrierId/coverage-types

Get detailed coverage type information for a specific carrier.

**Purpose:** Understand what limits, deductibles, and requirements each carrier has.

---

**Response Body (200 OK):**

```json
{
  "carrier_id": "SIM_CARRIER_A",
  "carrier_name": "Atlas Insurance",
  "coverage_types": [
    {
      "code": "GL",
      "name": "General Liability",
      "description": "Comprehensive protection against third-party bodily injury and property damage claims",
      "rating_basis": "REVENUE",
      "available_limits": [
        {
          "per_occurrence": 500000,
          "general_aggregate": 1000000,
          "premium_modifier": 0.85
        },
        {
          "per_occurrence": 1000000,
          "general_aggregate": 2000000,
          "premium_modifier": 1.00
        },
        {
          "per_occurrence": 2000000,
          "general_aggregate": 4000000,
          "premium_modifier": 1.35
        }
      ],
      "available_deductibles": [
        {"amount": 0, "premium_modifier": 1.05},
        {"amount": 500, "premium_modifier": 1.00},
        {"amount": 1000, "premium_modifier": 0.95},
        {"amount": 2500, "premium_modifier": 0.90},
        {"amount": 5000, "premium_modifier": 0.85}
      ],
      "eligibility_requirements": {
        "min_years_in_business": 0,
        "max_years_in_business": null,
        "min_revenue": 0,
        "max_revenue": 50000000,
        "min_employees": 0,
        "max_employees": 500,
        "prohibited_industries": ["541940", "713210", "453991"],
        "prohibited_industry_names": ["Veterinary Services", "Casinos", "Tobacco Stores"]
      },
      "standard_exclusions": [
        "Professional services errors and omissions",
        "Employment-related claims",
        "Intentional acts",
        "Pollution",
        "Asbestos",
        "Nuclear hazards",
        "War and terrorism"
      ]
    },
    {
      "code": "WC",
      "name": "Workers Compensation",
      "description": "Statutory coverage for employee work-related injuries and illnesses",
      "rating_basis": "PAYROLL",
      "available_limits": [
        {
          "employers_liability_accident": 500000,
          "employers_liability_disease_policy": 500000,
          "employers_liability_disease_employee": 500000,
          "premium_modifier": 1.00
        },
        {
          "employers_liability_accident": 1000000,
          "employers_liability_disease_policy": 1000000,
          "employers_liability_disease_employee": 1000000,
          "premium_modifier": 1.15
        }
      ],
      "available_deductibles": [
        {"amount": 0, "premium_modifier": 1.00}
      ],
      "eligibility_requirements": {
        "min_employees": 1,
        "excluded_states": ["OH", "WA", "WY", "ND"],
        "excluded_state_reason": "Monopolistic state fund - private coverage not available"
      }
    }
  ]
}
```

---

### 4.6 GET /coverage-types

List all coverage types supported by the system.

**Purpose:** Reference data for Clarence Core UI.

---

**Response Body (200 OK):**

```json
{
  "coverage_types": [
    {
      "code": "GL",
      "name": "General Liability",
      "short_description": "Third-party bodily injury and property damage",
      "long_description": "Protects your business against claims of bodily injury, property damage, and personal injury caused by your business operations, products, or services.",
      "rating_basis": "REVENUE",
      "commonly_paired_with": ["WC", "CPL", "UMB"],
      "required_for_industries": [],
      "typical_premium_range": {
        "min": 500,
        "max": 10000,
        "note": "Based on $100K-$5M revenue"
      }
    },
    {
      "code": "WC",
      "name": "Workers Compensation",
      "short_description": "Employee injury and illness coverage",
      "long_description": "Provides benefits to employees who suffer work-related injuries or illnesses. Required by law in most states for businesses with employees.",
      "rating_basis": "PAYROLL",
      "commonly_paired_with": ["GL", "EPL"],
      "required_for_industries": ["ALL"],
      "required_states": ["CA", "NY", "TX", "FL", "IL"],
      "typical_premium_range": {
        "min": 750,
        "max": 25000,
        "note": "Based on $100K-$1M payroll, office class"
      }
    },
    {
      "code": "EPL",
      "name": "Employment Practices Liability",
      "short_description": "Wrongful termination, discrimination, harassment",
      "long_description": "Covers claims by employees alleging discrimination, wrongful termination, sexual harassment, and other employment-related issues.",
      "rating_basis": "EMPLOYEE_COUNT",
      "commonly_paired_with": ["GL", "DO", "WC"],
      "recommended_for": ["Businesses with 5+ employees", "California businesses", "Companies with HR concerns"]
    },
    {
      "code": "CYBER",
      "name": "Cyber Liability",
      "short_description": "Data breaches and cyber attacks",
      "long_description": "Covers costs associated with data breaches, ransomware attacks, business interruption from cyber events, and regulatory fines.",
      "rating_basis": "REVENUE",
      "commonly_paired_with": ["GL", "EO"],
      "recommended_for": ["Businesses storing customer data", "E-commerce", "Healthcare", "Financial services"]
    },
    {
      "code": "EO",
      "name": "Errors & Omissions / Professional Liability",
      "short_description": "Professional mistakes and negligence",
      "long_description": "Covers claims arising from professional mistakes, errors, or failure to perform professional services.",
      "rating_basis": "REVENUE",
      "commonly_paired_with": ["GL", "CYBER"],
      "required_for_industries": ["Consultants", "Technology", "Healthcare", "Financial services", "Real estate"]
    },
    {
      "code": "DO",
      "name": "Directors & Officers Liability",
      "short_description": "Management decisions and fiduciary duty",
      "long_description": "Protects company directors and officers from personal liability for decisions made while managing the company.",
      "rating_basis": "REVENUE",
      "commonly_paired_with": ["EPL", "CYBER"],
      "recommended_for": ["Companies with outside investors", "Boards of directors", "Nonprofit organizations"]
    }
  ]
}
```

---

### 4.7 GET /industries/:naicsCode

Get risk classification for a specific industry.

**Purpose:** Validate industry codes and return risk profile.

---

**Response Body (200 OK):**

```json
{
  "naics_code": "541511",
  "naics_description": "Custom Computer Programming Services",
  "risk_profile": {
    "gl_risk_tier": "LOW",
    "wc_risk_tier": "LOW",
    "wc_class_code": "8810",
    "wc_class_description": "Clerical Office Employees",
    "cyber_risk_tier": "MEDIUM",
    "professional_risk_tier": "MEDIUM",
    "epl_risk_tier": "MEDIUM"
  },
  "is_eligible": true,
  "prohibited_carriers": [],
  "recommendations": [
    {
      "coverage_type": "EO",
      "priority": "HIGH",
      "reason": "Professional services require E&O to protect against client claims of errors or negligence"
    },
    {
      "coverage_type": "CYBER",
      "priority": "HIGH",
      "reason": "Software companies handle sensitive code and client data"
    },
    {
      "coverage_type": "EPL",
      "priority": "MEDIUM",
      "reason": "Growing teams should protect against employment claims"
    }
  ],
  "underwriting_notes": [
    "Standard acceptance for most carriers",
    "Low physical exposure - primarily office-based",
    "E&O strongly recommended for contract work",
    "Consider cyber coverage if handling client data"
  ]
}
```

---

### 4.8 GET /states/:stateCode

Get state-specific rating information.

**Purpose:** Understand state modifiers and requirements.

---

**Response Body (200 OK):**

```json
{
  "state_code": "CA",
  "state_name": "California",
  "modifiers": {
    "gl_modifier": 1.20,
    "wc_modifier": 1.35,
    "cyber_modifier": 1.15,
    "epl_modifier": 1.40,
    "do_modifier": 1.25,
    "eo_modifier": 1.10
  },
  "wc_info": {
    "is_monopolistic": false,
    "state_fund_available": true,
    "state_fund_name": "State Compensation Insurance Fund (SCIF)",
    "minimum_coverage_required": true,
    "minimum_employees_for_requirement": 1
  },
  "regulatory_notes": [
    "California has extensive employee protection laws",
    "Sexual harassment prevention training required for 5+ employees",
    "Higher EPL exposure due to employee-friendly courts",
    "Cal/OSHA has additional workplace safety requirements"
  ],
  "available_carriers": ["SIM_CARRIER_A", "SIM_CARRIER_B", "SIM_CARRIER_C"]
}
```

---

### 4.9 POST /validate

Validate a quote request without generating quotes.

**Purpose:** Pre-flight check before full quote generation. Faster feedback.

---

**Request Body:**

```json
{
  "coverage_type": "GL",
  "business": {
    "industry_code": "541511",
    "state": "CA",
    "revenue": 1500000,
    "payroll": 800000,
    "employees_ft": 12,
    "employees_pt": 3,
    "year_started": 2020
  }
}
```

---

**Response Body (200 OK - Valid):**

```json
{
  "is_valid": true,
  "eligible_carriers": ["SIM_CARRIER_A", "SIM_CARRIER_B", "SIM_CARRIER_C"],
  "estimated_premium_range": {
    "min": 1500,
    "max": 2200,
    "currency": "USD"
  },
  "warnings": [],
  "recommendations": [
    "Consider adding E&O coverage for software services",
    "Cyber liability recommended for tech companies"
  ]
}
```

---

**Response Body (200 OK - Invalid):**

```json
{
  "is_valid": false,
  "eligible_carriers": [],
  "rejection_reasons": [
    {
      "code": "PROHIBITED_INDUSTRY",
      "message": "Cannabis-related businesses are not eligible for coverage",
      "field": "industry_code"
    }
  ],
  "suggestions": [
    "Specialty cannabis insurance programs may be available through other channels"
  ]
}
```

---

## 5. Pricing Engine Logic

### 5.1 General Liability Pricing Formula

```
Premium = max(
  (Revenue / 1000) × Base_Rate × Industry_Modifier × State_Modifier × Experience_Modifier × Carrier_Modifier × Limit_Modifier × Deductible_Credit,
  Minimum_Premium
)
```

**Variables:**

| Variable | Source | Example |
|----------|--------|---------|
| Revenue | Business input | $1,500,000 |
| Base_Rate | Risk tier lookup | $0.75 (LOW tier) |
| Industry_Modifier | NAICS lookup | 1.00 (software) |
| State_Modifier | State config | 1.20 (California) |
| Experience_Modifier | Years in business | 0.95 (6 years = 5% discount) |
| Carrier_Modifier | Carrier profile | 1.10 (PREMIUM carrier) |
| Limit_Modifier | Requested limits | 1.00 ($1M/$2M standard) |
| Deductible_Credit | Requested deductible | 0.95 ($500 = 5% credit) |
| Minimum_Premium | Coverage config | $500 |

**Calculation Example:**

```
Premium = (1,500,000 / 1000) × 0.75 × 1.00 × 1.20 × 0.95 × 1.10 × 1.00 × 0.95
Premium = 1500 × 0.75 × 1.00 × 1.20 × 0.95 × 1.10 × 1.00 × 0.95
Premium = 1500 × 1.069
Premium = $1,603.50 → rounds to $1,604

Since $1,604 > $500 minimum, final premium = $1,604
```

---

### 5.2 Workers Compensation Pricing Formula

```
Premium = max(
  (Payroll / 100) × WC_Class_Rate × State_Modifier × Experience_Modifier × Carrier_Modifier,
  Minimum_Premium
)
```

**WC Class Rates (per $100 payroll):**

| Class Code | Description | Rate |
|------------|-------------|------|
| 8810 | Clerical/Office | $0.25 |
| 8742 | Outside Sales | $0.45 |
| 8820 | Attorneys | $0.22 |
| 5191 | Office Machine Install | $1.85 |
| 5022 | Masonry | $6.50 |
| 5213 | Concrete Work | $8.25 |
| 5403 | Carpentry | $9.50 |
| 5551 | Roofing | $18.50 |

---

### 5.3 Experience Modifier Calculation

```
Years in Business    Modifier
< 1 year            1.25 (25% surcharge - new venture)
1-2 years           1.15 (15% surcharge)
3-5 years           1.00 (standard)
6-10 years          0.95 (5% discount)
> 10 years          0.90 (10% discount)
```

---

### 5.4 Claims History Impact

```
Claims in Last 3 Years    Modifier
0 claims                  1.00 (standard)
1 claim                   1.15 (15% surcharge)
2 claims                  1.35 (35% surcharge)
3+ claims                 1.50 (50% surcharge) or DECLINE
```

---

### 5.5 Carrier Price Variance

To simulate market competition, each carrier applies a random variance:

```
Carrier Profile    Base Variance    Final Range
PREMIUM            +10%             +5% to +15%
VALUE              -10%             -15% to -5%
SPECIALTY          +0%              -5% to +5%
```

This ensures quotes aren't identical, creating realistic shopping experience.

---

### 5.6 Decline Logic

Carriers decline quotes when:

1. **Prohibited Industry**: NAICS code in carrier's exclusion list
2. **Risk Score Too High**: Calculated risk exceeds carrier's threshold
3. **State Not Supported**: Carrier not licensed in business state
4. **Coverage Not Offered**: Carrier doesn't write that coverage type
5. **Size Outside Appetite**: Revenue/employees outside carrier's target

**Risk Score Calculation:**

```
Risk_Score = 
  (Industry_Risk × 40) +
  (Claims_History × 30) +
  (Years_In_Business × 15) +
  (State_Risk × 15)

If Risk_Score > Carrier_Decline_Threshold → DECLINE
```

---

## 6. Error Handling

### 6.1 Error Response Format

```json
{
  "error": {
    "code": "INVALID_INDUSTRY_CODE",
    "message": "The provided NAICS code '999999' is not recognized",
    "field": "business.industry_code",
    "suggestion": "Please verify the NAICS code. Common software codes are 541511 or 541512",
    "request_id": "req_abc123"
  }
}
```

### 6.2 Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `INVALID_REQUEST` | Request body validation failed |
| 400 | `INVALID_INDUSTRY_CODE` | NAICS code not recognized |
| 400 | `INVALID_STATE_CODE` | State code not recognized |
| 400 | `INVALID_COVERAGE_TYPE` | Coverage type not supported |
| 400 | `INVALID_CARRIER_ID` | Carrier ID not found |
| 404 | `QUOTE_NOT_FOUND` | Quote ID doesn't exist |
| 410 | `QUOTE_EXPIRED` | Quote validity period passed |
| 422 | `QUOTE_ALREADY_BOUND` | Cannot bind same quote twice |
| 422 | `EFFECTIVE_DATE_INVALID` | Effective date in past or too far future |
| 500 | `PRICING_ENGINE_ERROR` | Internal calculation error |

---

## 7. Configuration & Extensibility

### 7.1 Environment Variables

```bash
# Service Configuration
SIMULATED_CARRIER_PORT=3001
SIMULATED_CARRIER_ENV=development

# Pricing Adjustments
GLOBAL_RATE_MULTIPLIER=1.0          # Adjust all rates up/down
MINIMUM_PREMIUM_FLOOR=250           # Lowest possible premium
QUOTE_VALIDITY_DAYS=30              # How long quotes last

# Feature Flags
ENABLE_DECLINE_SIMULATION=true      # Allow carriers to decline
ENABLE_RANDOM_VARIANCE=true         # Add price variance
VARIANCE_PERCENTAGE=10              # Max variance %

# Demo Mode
DEMO_MODE=false                     # Fixed quotes for demos
DEMO_GL_PREMIUM=1500                # Demo GL price
DEMO_WC_PREMIUM=2500                # Demo WC price
```

### 7.2 Adding a New Carrier

1. Add carrier to `carriers.config.json`
2. Define pricing profile modifiers
3. Set supported coverages and states
4. Configure decline thresholds
5. Add highlight templates

No code changes required.

### 7.3 Adding a New Coverage Type

1. Add coverage to `coverage-types.config.json`
2. Define rating basis (REVENUE, PAYROLL, etc.)
3. Set base rates by risk tier
4. Configure limits and deductibles
5. Update carrier configs with support

### 7.4 Transitioning to Real Carriers

The API interface is designed for easy carrier swapping:

```typescript
interface CarrierAdapter {
  getQuote(request: QuoteRequest): Promise<CarrierQuote[]>;
  bind(request: BindRequest): Promise<BindResponse>;
}

// Simulated
class SimulatedCarrierAdapter implements CarrierAdapter { }

// Real (future)
class AmTrustCarrierAdapter implements CarrierAdapter { }
class HartfordCarrierAdapter implements CarrierAdapter { }
```

Same interface, different implementation. Clarence Core doesn't change.

---

## Appendix A: Complete Carrier Configurations

### Atlas Insurance (SIM_CARRIER_A)

```json
{
  "id": "SIM_CARRIER_A",
  "name": "Atlas Insurance",
  "am_best_rating": "A+",
  "pricing_profile": "PREMIUM",
  "base_rate_modifier": 1.10,
  "supported_coverages": ["GL", "WC", "EPL", "CYBER", "DO", "CPL"],
  "supported_states": ["ALL"],
  "decline_threshold": 85,
  "quote_validity_days": 30,
  "highlights": [
    "A+ AM Best rated carrier",
    "24/7 claims support hotline",
    "Legal defense costs outside policy limits",
    "Blanket additional insured coverage",
    "Dedicated risk management resources"
  ],
  "target_market": {
    "min_revenue": 100000,
    "max_revenue": 100000000,
    "min_employees": 1,
    "max_employees": 1000,
    "preferred_industries": ["technology", "professional_services", "healthcare"]
  }
}
```

### Shield Direct (SIM_CARRIER_B)

```json
{
  "id": "SIM_CARRIER_B",
  "name": "Shield Direct",
  "am_best_rating": "A",
  "pricing_profile": "VALUE",
  "base_rate_modifier": 0.90,
  "supported_coverages": ["GL", "WC", "CPL"],
  "supported_states": ["ALL"],
  "decline_threshold": 70,
  "quote_validity_days": 21,
  "highlights": [
    "Competitive pricing leader",
    "Easy online claims filing",
    "Flexible monthly payment options",
    "A rated by AM Best",
    "Fast policy issuance"
  ],
  "target_market": {
    "min_revenue": 0,
    "max_revenue": 10000000,
    "min_employees": 1,
    "max_employees": 100,
    "preferred_industries": ["retail", "food_service", "contractors"]
  }
}
```

### Apex Mutual (SIM_CARRIER_C)

```json
{
  "id": "SIM_CARRIER_C",
  "name": "Apex Mutual",
  "am_best_rating": "A",
  "pricing_profile": "SPECIALTY",
  "base_rate_modifier": 1.00,
  "supported_coverages": ["GL", "EO", "CYBER", "DO", "EPL"],
  "supported_states": ["CA", "NY", "TX", "FL", "WA", "MA", "IL", "CO", "GA", "NC"],
  "decline_threshold": 75,
  "quote_validity_days": 45,
  "highlights": [
    "Technology industry specialists",
    "Tailored E&O and Cyber coverage",
    "Startup-friendly underwriting",
    "Venture-backed company expertise",
    "Fast-growth business focus"
  ],
  "target_market": {
    "min_revenue": 0,
    "max_revenue": 50000000,
    "min_employees": 1,
    "max_employees": 500,
    "preferred_industries": ["technology", "software", "consulting", "fintech"]
  }
}
```

---

## Appendix B: Sample Industry Risk Profiles

```json
[
  {
    "naics_code": "541511",
    "description": "Custom Computer Programming",
    "gl_tier": "LOW",
    "wc_tier": "LOW",
    "wc_class": "8810",
    "cyber_tier": "MEDIUM",
    "eo_tier": "MEDIUM"
  },
  {
    "naics_code": "722511",
    "description": "Full-Service Restaurants",
    "gl_tier": "MEDIUM",
    "wc_tier": "MEDIUM",
    "wc_class": "9082",
    "cyber_tier": "LOW",
    "eo_tier": "LOW"
  },
  {
    "naics_code": "236220",
    "description": "Commercial Construction",
    "gl_tier": "HIGH",
    "wc_tier": "HIGH",
    "wc_class": "5403",
    "cyber_tier": "LOW",
    "eo_tier": "MEDIUM"
  },
  {
    "naics_code": "621111",
    "description": "Offices of Physicians",
    "gl_tier": "MEDIUM",
    "wc_tier": "LOW",
    "wc_class": "8832",
    "cyber_tier": "HIGH",
    "eo_tier": "HIGH"
  },
  {
    "naics_code": "523930",
    "description": "Investment Advice",
    "gl_tier": "LOW",
    "wc_tier": "LOW",
    "wc_class": "8810",
    "cyber_tier": "HIGH",
    "eo_tier": "HIGH"
  }
]
```

---

## Document Control

**Version:** 1.0  
**Date:** February 2026  
**Author:** Backend Team  
**Status:** Draft  

**Revision History:**
- v1.0 (Feb 2026): Initial Simulated Carrier API PRD

---

## Approval

This PRD requires approval from:
- [ ] Engineering Lead
- [ ] Product Lead
- [ ] QA Lead