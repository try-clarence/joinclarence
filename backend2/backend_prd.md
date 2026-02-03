# Backend PRD: Clarence AI Insurance Platform

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
4. [Clarence Core REST API](#4-clarence-core-rest-api)
5. [Simulated Carrier API](#5-simulated-carrier-api)
6. [Error Handling](#6-error-handling)
7. [Security Considerations](#7-security-considerations)

---

## 1. Overview

### 1.1 Purpose

This document defines the backend architecture, data models, and REST APIs for the Clarence AI Insurance Platform MVP. The design prioritizes simplicity while maintaining extensibility for future carrier integrations.

### 1.2 Scope

The MVP backend consists of two main components:

- **Clarence Core API**: Handles users, businesses, quote requests, quotes, and policies
- **Simulated Carrier API**: Internal service that mimics real carrier APIs for quote generation

### 1.3 Design Principles

1. **Simplicity First**: Minimize entities and relationships for MVP
2. **Carrier-Agnostic Interface**: Design APIs that can easily swap simulated carriers for real ones
3. **Stateless REST**: All APIs are stateless for horizontal scalability
4. **Async Processing**: Quote generation happens asynchronously via job queue

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Clarence Core API (NestJS)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │  Quote   │ │  Policy  │ │   Notification   │   │
│  │ Service  │ │ Service  │ │ Service  │ │     Service      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                │                      │
         ▼                ▼                      ▼
  ┌────────────┐  ┌──────────────┐       ┌─────────────┐
  │ PostgreSQL │  │  Simulated   │       │   Twilio    │
  │  Database  │  │ Carrier API  │       │    (SMS)    │
  └────────────┘  └──────────────┘       └─────────────┘
```

### 2.2 Tech Stack (MVP)

| Component | Technology |
|-----------|------------|
| Backend Framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | BullMQ (Redis) |
| Cache | Redis |
| SMS | Twilio |
| File Storage | AWS S3 |
| Authentication | JWT + Phone OTP |

### 2.3 Service Responsibilities

**Clarence Core API:**
- User authentication and management
- Business profile management
- Quote request lifecycle
- Quote storage and retrieval
- Policy management
- Notifications (email, SMS)

**Simulated Carrier API:**
- Generate realistic insurance quotes
- Simulate multiple carriers with different pricing
- Return standardized quote responses
- Simulate policy binding

---

## 3. Data Models

The MVP uses a simplified data model with 6 core entities. All tables include standard audit fields (`created_at`, `updated_at`) and use UUIDs as primary keys.

### 3.1 Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌───────────────┐
│   User   │──1:N──│   Business   │──1:N──│ QuoteRequest  │
└──────────┘       └──────────────┘       └───────────────┘
                                                  │
                                                 1:N
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │    Quote     │
                                          └──────────────┘
                                                  │
                                                 1:1
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │    Policy    │
                                          └──────────────┘
```

---

### 3.2 User

Represents a registered user (individual or business owner). Users authenticate via phone number and password.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key, auto-generated |
| `phone` | VARCHAR(15) | Yes | US phone number (unique), used for login and SMS verification |
| `phone_verified` | BOOLEAN | Yes | Whether phone has been verified via SMS code |
| `password_hash` | VARCHAR(255) | Yes | Bcrypt-hashed password for authentication |
| `email` | VARCHAR(255) | Yes | Email for notifications and communications |
| `first_name` | VARCHAR(100) | Yes | Contact name for personalization |
| `last_name` | VARCHAR(100) | Yes | Contact name for policy documents |
| `status` | ENUM | Yes | ACTIVE, INACTIVE, SUSPENDED - for account management |
| `created_at` | TIMESTAMP | Yes | When account was created |
| `updated_at` | TIMESTAMP | Yes | Last modification time |

**Why These Fields:**

- **phone as primary identifier**: Enables SMS verification and reduces friction vs email confirmation. Phone numbers are unique and verifiable in real-time.
- **phone_verified**: Security requirement before processing quotes. Prevents spam and ensures legitimate contact.
- **email separate from phone**: Used for detailed communications (policy docs, receipts) while phone handles authentication.
- **status field**: Allows soft-disable of accounts without data deletion for compliance.

---

### 3.3 Business

Contains all business information collected during the quote flow. One user can have multiple businesses.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID (FK) | Yes | Links to User who owns this business |
| `legal_name` | VARCHAR(255) | Yes | Official business name for policy documents |
| `dba_name` | VARCHAR(255) | No | "Doing Business As" name if different from legal |
| `legal_structure` | ENUM | Yes | LLC, CORP, SOLE_PROP, PARTNERSHIP - affects liability coverage |
| `industry_code` | VARCHAR(10) | Yes | NAICS code - critical for risk assessment and pricing |
| `industry_description` | TEXT | Yes | Human-readable industry for display |
| `business_description` | TEXT | Yes | Detailed description for underwriting decisions |
| `fein` | VARCHAR(20) | No | Federal EIN for tax/compliance verification |
| `website` | VARCHAR(255) | No | For risk assessment and business verification |
| `year_started` | INTEGER | Yes | Business age affects risk profile and pricing |
| `years_current_ownership` | INTEGER | No | Ownership stability indicator |
| `address_street` | VARCHAR(255) | Yes | Physical location for policy |
| `address_city` | VARCHAR(100) | Yes | City for state-specific regulations |
| `address_state` | CHAR(2) | Yes | State code - determines regulatory requirements |
| `address_zip` | VARCHAR(10) | Yes | ZIP for geographic risk assessment |
| `is_virtual` | BOOLEAN | Yes | Virtual businesses have different coverage needs |
| `has_subsidiaries` | BOOLEAN | Yes | Affects coverage scope and pricing |
| `has_foreign_operations` | BOOLEAN | Yes | International exposure requires special coverage |
| `revenue_current` | DECIMAL(15,2) | Yes | Current year revenue - primary pricing factor |
| `revenue_projected` | DECIMAL(15,2) | No | Projected revenue for coverage adequacy |
| `employees_ft` | INTEGER | Yes | Full-time count for workers comp pricing |
| `employees_pt` | INTEGER | Yes | Part-time count for exposure calculation |
| `payroll_total` | DECIMAL(15,2) | Yes | Total payroll - workers comp premium basis |
| `created_at` | TIMESTAMP | Yes | When business was added |
| `updated_at` | TIMESTAMP | Yes | Last modification time |

**Why These Fields:**

- **industry_code (NAICS)**: Standard classification used by all carriers for risk categorization. A software company (541511) has very different risk than a restaurant (722511).
- **legal_structure**: Sole proprietors have unlimited personal liability; LLCs/Corps have limited liability. This affects D&O, E&O coverage needs.
- **address_state**: Insurance is state-regulated. Rates, required coverages, and filing requirements vary significantly by state.
- **payroll_total**: Workers compensation premiums are directly calculated from payroll (rate per $100 of payroll).
- **revenue_current**: General liability premiums often use revenue as the exposure base. More revenue = more customer interactions = more risk.
- **is_virtual**: A fully remote business doesn't need commercial property or the same GL limits as a physical retail store.

---

### 3.4 QuoteRequest

Represents a user's request for insurance quotes. Tracks the 5-step form submission and processing status.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID (FK) | No | Null until user registers (post-submission) |
| `business_id` | UUID (FK) | Yes | The business this quote is for |
| `request_type` | ENUM | Yes | NEW_COVERAGE or RENEWAL - affects processing flow |
| `coverage_types` | VARCHAR[] | Yes | Array of coverage codes requested (GL, WC, etc.) |
| `status` | ENUM | Yes | DRAFT, SUBMITTED, PROCESSING, QUOTES_READY, EXPIRED |
| `additional_notes` | TEXT | No | Special requirements from Step 5 |
| `consent_given` | BOOLEAN | Yes | Legal compliance - must be true to process |
| `submitted_at` | TIMESTAMP | No | When form was completed - starts SLA clock |
| `quotes_ready_at` | TIMESTAMP | No | When quotes became available - for metrics |
| `expires_at` | TIMESTAMP | No | Quote validity period (typically 30 days) |
| `created_at` | TIMESTAMP | Yes | When request was started |
| `updated_at` | TIMESTAMP | Yes | Last modification time |

**Status Flow:**

```
DRAFT → SUBMITTED → PROCESSING → QUOTES_READY → EXPIRED
```

- **DRAFT**: User is filling out the form (auto-save enabled)
- **SUBMITTED**: Form complete, awaiting registration
- **PROCESSING**: User registered, quotes being generated
- **QUOTES_READY**: Quotes available for review
- **EXPIRED**: Quotes no longer valid (30+ days old)

**Why These Fields:**

- **user_id nullable**: Quote flow is unauthenticated until Step 5. This allows draft saving without registration.
- **coverage_types as array**: User can request multiple coverages (GL + WC + Cyber) in single request.
- **consent_given**: Legal requirement for data processing. Cannot submit without consent.
- **expires_at**: Insurance quotes are time-sensitive. Market conditions and business situation change.

---

### 3.5 Quote

Individual quote from a carrier for a specific coverage type. Multiple quotes per QuoteRequest.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key |
| `quote_request_id` | UUID (FK) | Yes | Parent quote request |
| `carrier_id` | VARCHAR(50) | Yes | Carrier identifier (simulated or real) |
| `carrier_name` | VARCHAR(100) | Yes | Display name for UI |
| `coverage_type` | VARCHAR(10) | Yes | Coverage code (GL, WC, etc.) |
| `premium_annual` | DECIMAL(10,2) | Yes | Annual premium - primary comparison metric |
| `premium_monthly` | DECIMAL(10,2) | Yes | Monthly option for cash flow flexibility |
| `deductible` | DECIMAL(10,2) | Yes | Out-of-pocket before coverage kicks in |
| `coverage_limits` | JSONB | Yes | Structured limits (per_occurrence, aggregate) |
| `highlights` | TEXT[] | No | Key selling points for display |
| `exclusions` | TEXT[] | No | What's not covered - transparency |
| `effective_date` | DATE | Yes | When coverage would start |
| `expiration_date` | DATE | Yes | Policy end date (typically 1 year) |
| `is_recommended` | BOOLEAN | Yes | AI-flagged as best value |
| `recommendation_reason` | TEXT | No | Why AI recommends this quote |
| `status` | ENUM | Yes | AVAILABLE, SELECTED, PURCHASED, EXPIRED |
| `carrier_quote_id` | VARCHAR(100) | No | External reference from carrier API |
| `created_at` | TIMESTAMP | Yes | When quote was generated |
| `updated_at` | TIMESTAMP | Yes | Last modification time |

**coverage_limits JSON Structure:**

```json
{
  "per_occurrence": 1000000,
  "general_aggregate": 2000000,
  "products_completed": 2000000,
  "personal_advertising": 1000000,
  "damage_rented_premises": 100000,
  "medical_expense": 5000
}
```

**Why These Fields:**

- **carrier_id vs carrier_name**: ID for system reference, name for display. When we add real carriers, ID maps to API credentials.
- **coverage_limits as JSONB**: Different coverage types have different limit structures. JSONB allows flexibility without schema changes.
- **is_recommended**: AI analyzes price/coverage ratio to help users. Improves conversion by reducing decision paralysis.
- **carrier_quote_id**: When using real carriers, we need their reference number for binding and claims.
- **premium_monthly**: Many small businesses prefer monthly payments. We calculate: `annual / 12 * 1.05` (5% financing fee).

---

### 3.6 Policy

Represents a purchased insurance policy. Created when user completes purchase.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key |
| `policy_number` | VARCHAR(50) | Yes | Human-readable number (CLR-2026-XXXXX) |
| `user_id` | UUID (FK) | Yes | Policy owner |
| `business_id` | UUID (FK) | Yes | Insured business |
| `quote_id` | UUID (FK) | Yes | Source quote for audit trail |
| `coverage_type` | VARCHAR(10) | Yes | Coverage code |
| `carrier_id` | VARCHAR(50) | Yes | Issuing carrier |
| `carrier_name` | VARCHAR(100) | Yes | Carrier display name |
| `premium_annual` | DECIMAL(10,2) | Yes | Locked-in annual premium |
| `premium_paid` | DECIMAL(10,2) | Yes | Amount actually paid |
| `payment_plan` | ENUM | Yes | ANNUAL, MONTHLY, QUARTERLY |
| `deductible` | DECIMAL(10,2) | Yes | Policy deductible |
| `coverage_limits` | JSONB | Yes | Final coverage limits |
| `effective_date` | DATE | Yes | Coverage start |
| `expiration_date` | DATE | Yes | Coverage end |
| `status` | ENUM | Yes | ACTIVE, CANCELLED, EXPIRED, PENDING_RENEWAL |
| `document_url` | VARCHAR(500) | No | S3 URL to policy PDF |
| `auto_renew` | BOOLEAN | Yes | Whether to auto-renew |
| `cancelled_at` | TIMESTAMP | No | If cancelled, when |
| `cancellation_reason` | TEXT | No | Why policy was cancelled |
| `created_at` | TIMESTAMP | Yes | When policy was issued |
| `updated_at` | TIMESTAMP | Yes | Last modification time |

**Why These Fields:**

- **policy_number**: Human-readable for customer service calls. Format: CLR-YYYY-NNNNN.
- **quote_id reference**: Audit trail from quote → policy. Important for compliance and dispute resolution.
- **premium_paid vs premium_annual**: May differ due to payment plan fees, mid-term changes, or discounts.
- **document_url**: Points to generated policy PDF in S3. Enables download from dashboard.
- **auto_renew**: User preference captured at purchase. Triggers renewal flow at 90 days before expiration.

---

### 3.7 VerificationCode

Temporary SMS verification codes for phone authentication. Short-lived, single-use.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | UUID | Yes | Primary key |
| `phone` | VARCHAR(15) | Yes | Phone number being verified |
| `code` | VARCHAR(6) | Yes | 6-digit verification code |
| `attempts` | INTEGER | Yes | Failed attempts counter (max 3) |
| `expires_at` | TIMESTAMP | Yes | Code expiry (10 minutes from creation) |
| `used_at` | TIMESTAMP | No | When code was successfully used |
| `created_at` | TIMESTAMP | Yes | When code was generated |

**Why These Fields:**

- **attempts counter**: Security measure. After 3 wrong attempts, code is invalidated.
- **expires_at**: 10-minute window balances security with user convenience.
- **used_at**: Prevents code reuse. Once used, code cannot be used again.

---

## 4. Clarence Core REST API

Base URL: `/api/v1`

All endpoints return JSON. Authentication via JWT Bearer token except where noted.

### 4.1 Authentication Endpoints

---

#### POST /auth/send-code

Send SMS verification code to phone number. **No authentication required.**

**Purpose:** Initiates phone verification for registration or login.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | US phone number in E.164 format (+15551234567) |

**Why this field:**
- `phone`: The identifier we're verifying. E.164 format ensures consistency and international compatibility.

**Response (200):**

```json
{
  "message": "Verification code sent",
  "expires_in": 600
}
```

**Response Fields:**
- `expires_in`: Seconds until code expires. Frontend shows countdown timer.

**Error Responses:**
- 400: Invalid phone format
- 429: Rate limited (max 3 codes per phone per hour)

---

#### POST /auth/verify-code

Verify SMS code and complete registration or login. **No authentication required.**

**Purpose:** Validates the SMS code and either creates a new user or logs in existing user.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | Phone number that received the code |
| `code` | string | Yes | 6-digit verification code from SMS |
| `password` | string | Conditional | Required for new users (min 8 chars, mixed case, number, special) |
| `email` | string | Conditional | Required for new users |
| `first_name` | string | Conditional | Required for new users |
| `last_name` | string | Conditional | Required for new users |

**Why these fields:**
- `phone` + `code`: The verification pair. Both required to validate.
- `password`: Only for new registrations. Returning users already have passwords.
- `email`, `first_name`, `last_name`: Collected at registration for communications and policy documents.

**Response (200 - New User):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "phone": "+15551234567",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "is_new_user": true
  }
}
```

**Response (200 - Existing User):**

```json
{
  "message": "Phone verified. Please enter your password.",
  "requires_password": true,
  "user_exists": true
}
```

**Response Fields:**
- `access_token`: JWT for API authentication (1 hour validity)
- `refresh_token`: For obtaining new access tokens (7 day validity)
- `is_new_user`: Frontend uses this to show welcome flow vs returning user flow

---

#### POST /auth/login

Login with phone and password. **No authentication required.**

**Purpose:** Standard login for returning users who've already verified their phone.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | Registered phone number |
| `password` | string | Yes | User's password |

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "phone": "+15551234567",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Smith"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 423: Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token. **No authentication required (uses refresh token).**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | string | Yes | Valid refresh token |

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

---

#### POST /auth/logout

Invalidate current tokens. **Authentication required.**

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### 4.2 Quote Request Endpoints

---

#### POST /quote-requests

Create a new quote request. **No authentication required** (allows draft saving before registration).

**Purpose:** Captures the complete 5-step form submission. Can be called incrementally as user progresses through steps.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_type` | string | Yes | "NEW_COVERAGE" or "RENEWAL" |
| `business` | object | Yes | Business information (see below) |
| `coverage_types` | string[] | Yes | Array of coverage codes: "GL", "WC", "EPL", etc. |
| `additional_notes` | string | No | Special requirements or questions |
| `consent_given` | boolean | Yes | Must be true to submit |

**business object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `legal_name` | string | Yes | Official business name |
| `dba_name` | string | No | Doing Business As name |
| `legal_structure` | string | Yes | "LLC", "CORP", "SOLE_PROP", "PARTNERSHIP" |
| `industry_code` | string | Yes | NAICS code (e.g., "541511") |
| `industry_description` | string | Yes | Human-readable industry name |
| `business_description` | string | Yes | What the business does |
| `fein` | string | No | Federal EIN |
| `website` | string | No | Business website URL |
| `year_started` | integer | Yes | Year business was founded |
| `years_current_ownership` | integer | No | Years under current ownership |
| `address_street` | string | Yes | Street address |
| `address_city` | string | Yes | City |
| `address_state` | string | Yes | 2-letter state code |
| `address_zip` | string | Yes | ZIP code |
| `is_virtual` | boolean | Yes | Is this a virtual/online-only business? |
| `has_subsidiaries` | boolean | Yes | Does business have subsidiaries? |
| `has_foreign_operations` | boolean | Yes | Any international operations? |
| `revenue_current` | number | Yes | Current year revenue |
| `revenue_projected` | number | No | Projected next year revenue |
| `employees_ft` | integer | Yes | Full-time employee count |
| `employees_pt` | integer | Yes | Part-time employee count |
| `payroll_total` | number | Yes | Total annual payroll |
| `contact_first_name` | string | Yes | Contact first name |
| `contact_last_name` | string | Yes | Contact last name |
| `contact_email` | string | Yes | Contact email |
| `contact_phone` | string | Yes | Contact phone |

**Why these business fields:**

- **legal_name**: Required for policy issuance. Must match official records.
- **industry_code**: NAICS code drives risk classification. Software (541511) vs Construction (236220) have vastly different rates.
- **address_state**: Determines regulatory requirements. California requires different coverages than Texas.
- **revenue_current**: Primary rating basis for General Liability. $500K revenue vs $5M = very different premiums.
- **payroll_total**: Primary rating basis for Workers Compensation. Premium = (payroll / 100) * rate.
- **employees_ft/pt**: Determines Workers Comp class codes and EPLI exposure.
- **has_foreign_operations**: Triggers foreign liability coverage requirement.

**Response (201):**

```json
{
  "id": "uuid",
  "status": "DRAFT",
  "business_id": "uuid",
  "coverage_types": ["GL", "WC", "EPL"],
  "created_at": "2026-02-03T10:00:00Z"
}
```

---

#### PATCH /quote-requests/:id

Update a draft quote request. **No authentication required for DRAFT status.**

**Purpose:** Allows incremental saving as user progresses through form steps.

**Request Body:** Same as POST, but all fields optional (partial update).

**Response (200):**

```json
{
  "id": "uuid",
  "status": "DRAFT",
  "updated_at": "2026-02-03T10:05:00Z"
}
```

---

#### POST /quote-requests/:id/submit

Submit quote request for processing. **Authentication required.**

**Purpose:** Finalizes the quote request and triggers quote generation.

**Request Body:** None (quote request ID in URL)

**Response (200):**

```json
{
  "id": "uuid",
  "status": "PROCESSING",
  "submitted_at": "2026-02-03T10:10:00Z",
  "estimated_ready_at": "2026-02-03T14:10:00Z",
  "message": "Your quote request is being processed. You'll receive quotes within 4 hours."
}
```

**What happens on submit:**
1. Status changes to PROCESSING
2. Quote request is linked to authenticated user
3. Job is queued to call Simulated Carrier API
4. Confirmation email sent to user

---

#### GET /quote-requests

List all quote requests for authenticated user. **Authentication required.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status |
| `limit` | integer | 20 | Results per page |
| `offset` | integer | 0 | Pagination offset |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "QUOTES_READY",
      "business_name": "Acme Corp",
      "coverage_types": ["GL", "WC"],
      "submitted_at": "2026-02-03T10:00:00Z",
      "quotes_count": 6
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

#### GET /quote-requests/:id

Get quote request details. **Authentication required.**

**Response (200):**

```json
{
  "id": "uuid",
  "status": "QUOTES_READY",
  "request_type": "NEW_COVERAGE",
  "business": {
    "id": "uuid",
    "legal_name": "Acme Corp",
    "industry_description": "Software Development",
    "address_city": "San Francisco",
    "address_state": "CA"
  },
  "coverage_types": ["GL", "WC", "EPL"],
  "additional_notes": "Need coverage by March 1",
  "submitted_at": "2026-02-03T10:00:00Z",
  "quotes_ready_at": "2026-02-03T12:30:00Z",
  "expires_at": "2026-03-03T12:30:00Z"
}
```

---

#### GET /quote-requests/:id/quotes

Get all quotes for a quote request. **Authentication required.**

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "carrier_id": "SIM_CARRIER_A",
      "carrier_name": "Atlas Insurance",
      "coverage_type": "GL",
      "premium_annual": 1250.00,
      "premium_monthly": 109.38,
      "deductible": 500.00,
      "coverage_limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000
      },
      "highlights": [
        "A+ rated carrier",
        "24/7 claims support",
        "Legal defense included"
      ],
      "exclusions": [
        "Professional services (E&O)",
        "Employment practices",
        "Cyber incidents"
      ],
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "is_recommended": true,
      "recommendation_reason": "Best coverage-to-price ratio for software companies",
      "status": "AVAILABLE"
    }
  ],
  "summary": {
    "total_quotes": 6,
    "coverage_types": 2,
    "lowest_annual_premium": 3150.00,
    "recommended_package_premium": 3450.00
  }
}
```

**Response field explanations:**

- `summary.lowest_annual_premium`: Sum of cheapest quote per coverage type
- `summary.recommended_package_premium`: Sum of AI-recommended quotes
- `is_recommended`: True for the quote AI suggests as best value
- `recommendation_reason`: Human-readable explanation for the recommendation

---

### 4.3 Quote Endpoints

---

#### GET /quotes/:id

Get detailed quote information. **Authentication required.**

**Response (200):**

```json
{
  "id": "uuid",
  "carrier_id": "SIM_CARRIER_A",
  "carrier_name": "Atlas Insurance",
  "coverage_type": "GL",
  "coverage_type_name": "General Liability",
  "premium_annual": 1250.00,
  "premium_monthly": 109.38,
  "premium_quarterly": 328.13,
  "deductible": 500.00,
  "coverage_limits": {
    "per_occurrence": 1000000,
    "general_aggregate": 2000000,
    "products_completed": 2000000,
    "personal_advertising": 1000000,
    "damage_rented_premises": 100000,
    "medical_expense": 5000
  },
  "coverage_description": "Protects against claims of bodily injury, property damage, and personal injury caused by your business operations.",
  "highlights": [
    "A+ AM Best rating",
    "24/7 claims hotline",
    "Legal defense costs outside limits",
    "Blanket additional insured coverage"
  ],
  "exclusions": [
    "Professional services errors (covered by E&O)",
    "Employment-related claims (covered by EPL)",
    "Intentional acts",
    "Pollution",
    "Cyber incidents"
  ],
  "effective_date": "2026-03-01",
  "expiration_date": "2027-03-01",
  "is_recommended": true,
  "recommendation_reason": "Best coverage-to-price ratio for software companies. This carrier has excellent claims handling for tech businesses.",
  "status": "AVAILABLE",
  "valid_until": "2026-03-03T12:30:00Z"
}
```

---

#### POST /quotes/:id/select

Mark a quote as selected for purchase. **Authentication required.**

**Purpose:** User indicates intent to purchase this quote. Can select multiple quotes (one per coverage type).

**Request Body:** None

**Response (200):**

```json
{
  "id": "uuid",
  "status": "SELECTED",
  "selected_at": "2026-02-03T15:00:00Z",
  "message": "Quote selected. Proceed to checkout when ready."
}
```

---

#### DELETE /quotes/:id/select

Deselect a previously selected quote. **Authentication required.**

**Response (200):**

```json
{
  "id": "uuid",
  "status": "AVAILABLE",
  "message": "Quote deselected."
}
```

---

#### POST /quotes/compare

Get side-by-side comparison of multiple quotes. **Authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quote_ids` | string[] | Yes | Array of quote UUIDs to compare (max 4) |

**Response (200):**

```json
{
  "quotes": [
    {
      "id": "uuid-1",
      "carrier_name": "Atlas Insurance",
      "premium_annual": 1250.00,
      "deductible": 500.00,
      "coverage_limits": {...}
    },
    {
      "id": "uuid-2",
      "carrier_name": "Shield Direct",
      "premium_annual": 1100.00,
      "deductible": 1000.00,
      "coverage_limits": {...}
    }
  ],
  "comparison": {
    "price_winner": "uuid-2",
    "coverage_winner": "uuid-1",
    "recommended": "uuid-1",
    "recommendation_reason": "Slightly higher premium but lower deductible and better claims reputation."
  }
}
```

---

### 4.4 Policy Endpoints

---

#### POST /policies/purchase

Purchase selected quotes and create policies. **Authentication required.**

**Purpose:** Final purchase action. Creates policies, processes payment, generates documents.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quote_ids` | string[] | Yes | Array of selected quote UUIDs |
| `payment_plan` | string | Yes | "ANNUAL", "MONTHLY", or "QUARTERLY" |
| `payment_method` | object | Yes | Payment details |
| `auto_renew` | boolean | Yes | Enable auto-renewal? |
| `effective_date` | string | No | Requested start date (default: next day) |

**payment_method object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | "card" or "ach" |
| `stripe_payment_method_id` | string | Yes | Stripe payment method ID |
| `billing_address` | object | Yes | Billing address |

**Response (201):**

```json
{
  "policies": [
    {
      "id": "uuid",
      "policy_number": "CLR-2026-00001",
      "coverage_type": "GL",
      "carrier_name": "Atlas Insurance",
      "premium_annual": 1250.00,
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "status": "ACTIVE",
      "document_url": "https://s3.../policy-gl-uuid.pdf"
    }
  ],
  "payment": {
    "amount": 3450.00,
    "payment_plan": "ANNUAL",
    "transaction_id": "pi_xxx",
    "receipt_url": "https://..."
  },
  "message": "Congratulations! Your coverage is now active."
}
```

---

#### GET /policies

List all policies for authenticated user. **Authentication required.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter: ACTIVE, EXPIRED, CANCELLED |
| `coverage_type` | string | all | Filter by coverage type |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "policy_number": "CLR-2026-00001",
      "coverage_type": "GL",
      "coverage_type_name": "General Liability",
      "carrier_name": "Atlas Insurance",
      "premium_annual": 1250.00,
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "status": "ACTIVE",
      "days_until_expiration": 361,
      "auto_renew": true
    }
  ],
  "summary": {
    "total_policies": 3,
    "active_policies": 3,
    "total_annual_premium": 3450.00,
    "next_renewal": "2027-03-01"
  }
}
```

---

#### GET /policies/:id

Get policy details. **Authentication required.**

**Response (200):**

```json
{
  "id": "uuid",
  "policy_number": "CLR-2026-00001",
  "coverage_type": "GL",
  "coverage_type_name": "General Liability",
  "carrier_id": "SIM_CARRIER_A",
  "carrier_name": "Atlas Insurance",
  "business": {
    "id": "uuid",
    "legal_name": "Acme Corp",
    "address": "123 Main St, San Francisco, CA 94105"
  },
  "premium_annual": 1250.00,
  "premium_paid": 1250.00,
  "payment_plan": "ANNUAL",
  "deductible": 500.00,
  "coverage_limits": {
    "per_occurrence": 1000000,
    "general_aggregate": 2000000
  },
  "effective_date": "2026-03-01",
  "expiration_date": "2027-03-01",
  "status": "ACTIVE",
  "auto_renew": true,
  "document_url": "https://s3.../policy-gl-uuid.pdf",
  "created_at": "2026-02-03T16:00:00Z"
}
```

---

#### GET /policies/:id/certificate

Generate Certificate of Insurance (COI). **Authentication required.**

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certificate_holder` | string | No | Name to appear as certificate holder |
| `holder_address` | string | No | Certificate holder's address |
| `additional_insured` | boolean | No | Include as additional insured? |
| `project_description` | string | No | Specific project/contract reference |

**Response (200):**

```json
{
  "certificate_url": "https://s3.../coi-uuid.pdf",
  "certificate_number": "COI-2026-00001",
  "generated_at": "2026-02-03T16:30:00Z",
  "valid_until": "2027-03-01"
}
```

**Why these parameters:**
- `certificate_holder`: Many contracts require COIs naming the other party
- `additional_insured`: Some contracts require the holder to be covered under your policy
- `project_description`: Links the COI to a specific project/contract

---

#### POST /policies/:id/cancel

Request policy cancellation. **Authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Cancellation reason |
| `effective_date` | string | No | When to cancel (default: immediately) |

**Response (200):**

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelled_at": "2026-02-03T17:00:00Z",
  "refund_amount": 625.00,
  "refund_status": "PROCESSING",
  "message": "Policy cancelled. Refund of $625.00 will be processed within 5-7 business days."
}
```

---

### 4.5 Business Endpoints

---

#### GET /businesses

List all businesses for authenticated user. **Authentication required.**

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "legal_name": "Acme Corp",
      "dba_name": "Acme",
      "industry_description": "Software Development",
      "address_city": "San Francisco",
      "address_state": "CA",
      "employees_total": 12,
      "policies_count": 3,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

#### GET /businesses/:id

Get business details. **Authentication required.**

**Response (200):** Full business object as defined in data model.

---

#### PATCH /businesses/:id

Update business information. **Authentication required.**

**Request Body:** Partial business object (only fields to update).

**Note:** Certain changes (revenue, employees, address) may trigger coverage review notification.

---

### 4.6 User Endpoints

---

#### GET /users/me

Get current user profile. **Authentication required.**

**Response (200):**

```json
{
  "id": "uuid",
  "phone": "+15551234567",
  "email": "john@acme.com",
  "first_name": "John",
  "last_name": "Smith",
  "status": "ACTIVE",
  "businesses_count": 1,
  "policies_count": 3,
  "created_at": "2026-02-01T10:00:00Z"
}
```

---

#### PATCH /users/me

Update user profile. **Authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | New email address |
| `first_name` | string | No | Updated first name |
| `last_name` | string | No | Updated last name |

---

#### POST /users/me/change-password

Change password. **Authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_password` | string | Yes | Current password for verification |
| `new_password` | string | Yes | New password (must meet requirements) |

---

## 5. Simulated Carrier API

The Simulated Carrier API is an **internal service** that mimics real insurance carrier APIs. It generates realistic quotes based on business data and returns standardized responses.

**Base URL:** Internal service (not exposed externally)

### 5.1 Purpose

1. Enable end-to-end testing without real carrier integrations
2. Generate realistic quotes for MVP demos and user testing
3. Establish the contract/interface for future real carrier integrations
4. Allow rapid iteration on quote presentation without carrier dependencies

### 5.2 Simulated Carriers

The MVP includes 3 simulated carriers with different pricing profiles:

| Carrier ID | Name | Profile |
|------------|------|---------|
| `SIM_CARRIER_A` | Atlas Insurance | Premium carrier - higher price, broader coverage, A+ rated |
| `SIM_CARRIER_B` | Shield Direct | Value carrier - competitive pricing, standard coverage |
| `SIM_CARRIER_C` | Apex Mutual | Specialty carrier - best for tech/professional services |

### 5.3 Pricing Logic

The simulated carriers use rule-based pricing with intentional variance:

**General Liability Base Rates (per $1,000 revenue):**
- Low risk industries (software, consulting): $0.50 - $1.50
- Medium risk (retail, food service): $2.00 - $4.00
- High risk (construction, manufacturing): $5.00 - $10.00

**Workers Compensation Base Rates (per $100 payroll):**
- Office/clerical: $0.20 - $0.40
- Sales/service: $0.80 - $1.50
- Manual labor: $3.00 - $8.00

**Modifiers Applied:**
- State modifier (CA = 1.2x, TX = 0.9x, NY = 1.3x)
- Years in business (< 3 years = 1.15x, > 10 years = 0.9x)
- Carrier variance (±5-15% random for realism)

---

### 5.4 API Endpoints

---

#### POST /carriers/quote

Request quotes from simulated carriers. **Internal use only.**

**Purpose:** Generate quotes for a coverage type from all available carriers.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_id` | string | Yes | Clarence QuoteRequest ID for tracking |
| `carrier_ids` | string[] | No | Specific carriers (default: all) |
| `coverage_type` | string | Yes | Coverage code to quote |
| `business` | object | Yes | Business data for rating |
| `effective_date` | string | Yes | Requested policy start date |
| `requested_limits` | object | No | Specific limits requested |

**business object (for rating):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `industry_code` | string | Yes | NAICS code for risk classification |
| `state` | string | Yes | State for regulatory/rate lookup |
| `revenue` | number | Yes | Annual revenue (GL rating basis) |
| `payroll` | number | Yes | Annual payroll (WC rating basis) |
| `employees` | number | Yes | Total employee count |
| `years_in_business` | number | Yes | Years operating |
| `legal_structure` | string | Yes | Business entity type |
| `has_claims_history` | boolean | No | Prior claims (affects pricing) |

**Why these fields for rating:**

- `industry_code`: Primary risk classifier. Drives base rate selection.
- `state`: Insurance rates vary significantly by state due to regulations, court systems, and loss history.
- `revenue`: For GL, more revenue = more customer exposure = more risk.
- `payroll`: For WC, premium is directly calculated from payroll.
- `years_in_business`: New businesses are riskier; experienced businesses get discounts.
- `has_claims_history`: Prior claims significantly increase premiums.

**Response (200):**

```json
{
  "request_id": "uuid",
  "coverage_type": "GL",
  "quotes": [
    {
      "carrier_id": "SIM_CARRIER_A",
      "carrier_name": "Atlas Insurance",
      "carrier_quote_id": "ATL-2026-789012",
      "status": "QUOTED",
      "premium": {
        "annual": 1450.00,
        "monthly": 126.88,
        "quarterly": 380.63
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
        "A+ AM Best rating",
        "24/7 claims hotline",
        "Legal defense costs outside limits",
        "Blanket additional insured coverage"
      ],
      "exclusions": [
        "Professional services errors",
        "Employment-related claims",
        "Intentional acts",
        "Pollution",
        "Cyber incidents"
      ],
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "valid_until": "2026-03-31T23:59:59Z",
      "rating_info": {
        "base_rate": 0.85,
        "industry_modifier": 1.0,
        "state_modifier": 1.2,
        "experience_modifier": 0.95,
        "final_rate": 0.97
      }
    },
    {
      "carrier_id": "SIM_CARRIER_B",
      "carrier_name": "Shield Direct",
      "carrier_quote_id": "SHD-2026-456789",
      "status": "QUOTED",
      "premium": {
        "annual": 1180.00,
        "monthly": 103.25,
        "quarterly": 309.75
      },
      "deductible": 1000.00,
      "limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000
      },
      "highlights": [
        "Competitive pricing",
        "Online claims filing",
        "Monthly payment option"
      ],
      "exclusions": [
        "Professional services",
        "Employment practices",
        "Pollution",
        "Cyber"
      ],
      "effective_date": "2026-03-01",
      "expiration_date": "2027-03-01",
      "valid_until": "2026-03-31T23:59:59Z"
    }
  ],
  "declined": [
    {
      "carrier_id": "SIM_CARRIER_C",
      "carrier_name": "Apex Mutual",
      "reason": "Industry class not eligible for standard GL program",
      "suggestion": "Consider our specialty tech program"
    }
  ],
  "generated_at": "2026-02-03T10:15:00Z"
}
```

**Response field explanations:**

- `carrier_quote_id`: Simulated external reference. In real integration, this would be the carrier's quote number.
- `valid_until`: Quotes expire. Real carriers typically give 30-60 days.
- `rating_info`: Breakdown of how premium was calculated (useful for debugging, can be hidden from users).
- `declined[]`: Some carriers may decline to quote certain risks. This mirrors real-world behavior.

---

#### POST /carriers/bind

Bind a quote (convert to policy). **Internal use only.**

**Purpose:** Simulates the policy issuance process when user purchases.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `carrier_quote_id` | string | Yes | The carrier's quote reference |
| `carrier_id` | string | Yes | Which carrier issued the quote |
| `effective_date` | string | Yes | Policy start date |
| `payment_plan` | string | Yes | "ANNUAL", "MONTHLY", "QUARTERLY" |
| `insured` | object | Yes | Named insured information |

**insured object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Business legal name |
| `address` | string | Yes | Full business address |
| `fein` | string | No | Federal EIN |

**Response (200):**

```json
{
  "carrier_id": "SIM_CARRIER_A",
  "carrier_policy_id": "ATL-POL-2026-123456",
  "status": "BOUND",
  "policy_number": "ATL-GL-2026-123456",
  "effective_date": "2026-03-01",
  "expiration_date": "2027-03-01",
  "premium_final": 1450.00,
  "documents": {
    "policy_pdf_url": "https://simulated-carrier/docs/policy-123456.pdf",
    "dec_page_url": "https://simulated-carrier/docs/dec-123456.pdf",
    "coi_url": "https://simulated-carrier/docs/coi-123456.pdf"
  },
  "bound_at": "2026-02-03T16:00:00Z"
}
```

**Note:** In the simulated environment, document URLs point to pre-generated templates. In production, these would be actual carrier-generated documents.

---

#### GET /carriers

List available carriers. **Internal use only.**

**Response (200):**

```json
{
  "carriers": [
    {
      "id": "SIM_CARRIER_A",
      "name": "Atlas Insurance",
      "am_best_rating": "A+",
      "supported_coverages": ["GL", "WC", "EPL", "CYBER", "DO"],
      "supported_states": ["ALL"],
      "description": "Premium carrier with comprehensive coverage options"
    },
    {
      "id": "SIM_CARRIER_B",
      "name": "Shield Direct",
      "am_best_rating": "A",
      "supported_coverages": ["GL", "WC", "CPL"],
      "supported_states": ["ALL"],
      "description": "Value-focused carrier with competitive pricing"
    },
    {
      "id": "SIM_CARRIER_C",
      "name": "Apex Mutual",
      "am_best_rating": "A",
      "supported_coverages": ["GL", "EO", "CYBER", "DO", "EPL"],
      "supported_states": ["CA", "NY", "TX", "FL", "WA", "MA"],
      "description": "Specialty carrier for tech and professional services"
    }
  ]
}
```

---

#### GET /carriers/:id/coverage-types

Get coverage types supported by a carrier. **Internal use only.**

**Response (200):**

```json
{
  "carrier_id": "SIM_CARRIER_A",
  "coverage_types": [
    {
      "code": "GL",
      "name": "General Liability",
      "description": "Protects against claims of bodily injury and property damage",
      "available_limits": [
        {"per_occurrence": 500000, "aggregate": 1000000},
        {"per_occurrence": 1000000, "aggregate": 2000000},
        {"per_occurrence": 2000000, "aggregate": 4000000}
      ],
      "available_deductibles": [0, 500, 1000, 2500, 5000],
      "minimum_requirements": {
        "years_in_business": 0,
        "min_revenue": 0,
        "excluded_industries": ["cannabis", "firearms"]
      }
    },
    {
      "code": "WC",
      "name": "Workers Compensation",
      "description": "Covers employee injuries and illnesses",
      "state_required": ["CA", "NY", "TX"],
      "minimum_requirements": {
        "min_employees": 1,
        "excluded_industries": []
      }
    }
  ]
}
```

---

### 5.5 Coverage Type Codes

Standard coverage type codes used across the system:

| Code | Full Name | Description |
|------|-----------|-------------|
| `GL` | General Liability | Bodily injury, property damage, personal injury |
| `WC` | Workers Compensation | Employee injury/illness coverage |
| `CPL` | Commercial Property | Building and contents coverage |
| `EO` | Errors & Omissions | Professional liability |
| `DO` | Directors & Officers | Management liability |
| `EPL` | Employment Practices | Hiring/firing/discrimination claims |
| `CYBER` | Cyber Liability | Data breach, cyber attacks |
| `AL` | Auto Liability | Business vehicle coverage |
| `UMB` | Umbrella | Excess liability over primary policies |
| `CRIME` | Crime | Employee theft, fraud |

---

## 6. Error Handling

### 6.1 Standard Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": [
      {
        "field": "phone",
        "message": "Phone number must be in E.164 format (+1XXXXXXXXXX)"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### 6.2 Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_STATE` | Invalid state transition (e.g., submitting expired quote) |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Valid auth but insufficient permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Resource already exists (e.g., phone already registered) |
| 422 | `UNPROCESSABLE` | Valid request but cannot be processed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Dependent service down |

### 6.3 Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| SMS send code | 3 requests | 1 hour per phone |
| Authentication | 10 requests | 1 minute per IP |
| Quote requests | 20 requests | 1 hour per user |
| General API | 100 requests | 1 minute per user |

---

## 7. Security Considerations

### 7.1 Authentication

- **JWT tokens** with 1-hour expiration for access tokens
- **Refresh tokens** with 7-day expiration, stored server-side
- **Phone verification** required before account activation
- **Password requirements**: 8+ chars, mixed case, number, special character

### 7.2 Data Protection

- All PII encrypted at rest (AES-256)
- TLS 1.3 for all API communications
- Phone numbers and emails hashed for logging
- Audit trail for all data access

### 7.3 Input Validation

- All inputs validated server-side
- SQL injection prevention via parameterized queries (Prisma)
- XSS prevention via output encoding
- CSRF tokens for state-changing operations

### 7.4 API Security

- Rate limiting on all endpoints
- Request signing for carrier API calls
- IP allowlisting for carrier API (internal only)
- API versioning to prevent breaking changes

---

## Appendix A: Coverage Limits Reference

### General Liability Standard Limits

| Limit Type | Common Values |
|------------|---------------|
| Per Occurrence | $500K, $1M, $2M |
| General Aggregate | $1M, $2M, $4M |
| Products/Completed Ops | $1M, $2M |
| Personal & Advertising | $1M |
| Damage to Rented Premises | $50K, $100K, $300K |
| Medical Expense | $5K, $10K |

### Workers Compensation Standard Limits

| Limit Type | Standard Value |
|------------|----------------|
| Bodily Injury by Accident | $500K, $1M |
| Bodily Injury by Disease (Policy Limit) | $500K, $1M |
| Bodily Injury by Disease (Per Employee) | $500K, $1M |

---

## Appendix B: State Modifiers

Approximate rate modifiers by state (for simulated pricing):

| State | GL Modifier | WC Modifier |
|-------|-------------|-------------|
| CA | 1.20 | 1.35 |
| NY | 1.25 | 1.40 |
| TX | 0.95 | 0.90 |
| FL | 1.10 | 1.15 |
| IL | 1.05 | 1.10 |
| Other | 1.00 | 1.00 |

---

## Appendix C: Industry Risk Classification

Sample NAICS codes and their risk tiers:

| NAICS Code | Industry | GL Risk Tier | WC Risk Tier |
|------------|----------|--------------|--------------|
| 541511 | Custom Computer Programming | Low | Low |
| 541512 | Computer Systems Design | Low | Low |
| 541611 | Management Consulting | Low | Low |
| 722511 | Full-Service Restaurants | Medium | Medium |
| 722513 | Limited-Service Restaurants | Medium | Medium |
| 236220 | Commercial Construction | High | High |
| 238220 | Plumbing/HVAC Contractors | High | High |
| 621111 | Offices of Physicians | Medium | Low |

---

## Document Control

**Version:** 1.0  
**Date:** February 2026  
**Author:** Backend Team  
**Status:** Draft  
**Next Review:** February 2026

**Revision History:**
- v1.0 (Feb 2026): Initial backend PRD creation

---

## Approval

This PRD requires approval from:
- [ ] Engineering Lead
- [ ] Product Lead
- [ ] Security Team
