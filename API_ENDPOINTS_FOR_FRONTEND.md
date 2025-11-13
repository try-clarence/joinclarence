# API Endpoints for Frontend - Clarence Insurance Platform
## Version 3.0 - Complete Field Reference

> **Note**: This documentation is extracted from actual E2E and unit tests. All field names, types, and structures are verified against the running backend implementation.

## Table of Contents
1. [Overview](#overview)
2. [Status Codes & Error Handling](#status-codes--error-handling)
3. [Authentication & User Management](#authentication--user-management)
4. [Quote Request Flow](#quote-request-flow)
5. [Quote Management](#quote-management)
6. [Policy Management](#policy-management)
7. [Carrier Management](#carrier-management)
8. [Document Parsing](#document-parsing)
9. [Common Patterns](#common-patterns)

---

## Overview

### Base URL
```
Production: https://api.clarence.com/v1
Staging: https://api-staging.clarence.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication
Most endpoints require authentication via JWT tokens:
```
Authorization: Bearer <access_token>
```

### Important Notes
1. **Field Names**: Use exact field names as documented (e.g., `phone` not `phoneNumber`)
2. **Date Format**: All dates are ISO 8601 format (`2025-11-06T10:30:00Z`)
3. **Phone Format**: E.164 format required (`+15551234567`)
4. **IDs**: UUIDs or custom prefixed IDs (e.g., `qr_abc123`, `usr_123`)

---

## Status Codes & Error Handling

### HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| **200** | OK | Successful GET, PUT, PATCH requests |
| **201** | Created | Successful POST request that creates a resource |
| **204** | No Content | Successful DELETE with no response body |
| **400** | Bad Request | Invalid request format, validation errors |
| **401** | Unauthorized | Missing, invalid, or expired authentication token |
| **403** | Forbidden | Valid token but insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (duplicate phone/email) |
| **413** | Payload Too Large | File size exceeds limit (>5MB for PDFs) |
| **422** | Unprocessable Entity | Validation errors on request data |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error |
| **503** | Service Unavailable | Service temporarily down |

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth endpoints | 5 requests | 1 minute |
| SMS verification | 3 requests | 10 minutes |
| File uploads | 10 requests | 1 hour |
| General API | 100 requests | 1 minute |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
Retry-After: 60  // Only present when rate limited (429)
```

---

## Authentication & User Management

### 1.1 Check Phone Number Availability

**Endpoint:** `POST /api/v1/auth/check-phone`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "phone": "+15551234567"
}
```

**Success Response (200):**
```json
{
  "exists": false,
  "message": "Phone number is available for registration"
}
```

**Response (200) - Phone Already Registered:**
```json
{
  "exists": true,
  "message": "This number is already registered. Please log in."
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid phone format | `{ "message": "Phone number must be in E.164 format" }` |
| 400 | Non-US phone number | `{ "message": "Only US phone numbers are currently supported" }` |

---

### 1.2 Send Verification Code

**Endpoint:** `POST /api/v1/auth/send-verification-code`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "phone": "+15551234567",
  "purpose": "registration"
}
```

**Purpose Values:**
- `"registration"` - For new user registration
- `"login"` - For passwordless login
- `"password_reset"` - For forgot password flow

**Success Response (200):**
```json
{
  "verificationId": "ver_abc123def456",
  "expiresAt": "2025-11-06T10:40:00Z",
  "message": "Verification code sent to your phone"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid phone | `{ "message": "Invalid phone number format" }` |
| 429 | Rate limit exceeded | `{ "message": "Too many verification attempts" }` |

**Important Notes:**
- Verification code expires in 10 minutes
- Maximum 3 SMS per phone number per 10 minutes
- In test/dev mode, code is always `111111`

---

### 1.3 Verify Code

**Endpoint:** `POST /api/v1/auth/verify-code`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "verificationId": "ver_abc123def456",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "verified": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-11-06T10:45:00Z"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid code | `{ "message": "Invalid verification code" }` |
| 404 | Verification not found | `{ "message": "Verification session not found or expired" }` |
| 429 | Too many attempts | `{ "message": "Too many incorrect attempts" }` |

**Important Notes:**
- Maximum 5 attempts to verify code
- `verificationToken` is single-use, expires in 15 minutes
- Used in the next step (registration or login)

---

### 1.4 Register User

**Endpoint:** `POST /api/v1/auth/register`

**Authentication:** None (requires verificationToken from step 1.3)

**Request Body:**
```json
{
  "verificationToken": "eyJhbGciOiJIUzI1NiIs...",
  "password": "SecurePass123!",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Required Fields:**
- `verificationToken` (string, required) - Token from verify-code step
- `password` (string, required) - Minimum 8 characters

**Optional Fields:**
- `email` (string, optional) - Valid email format
- `firstName` (string, optional) - User's first name
- `lastName` (string, optional) - User's last name

**Success Response (201):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "+15551234567",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "active",
    "createdAt": "2025-11-06T10:30:00Z",
    "updatedAt": "2025-11-06T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Weak password | `{ "message": "Password does not meet security requirements" }` |
| 400 | Invalid verification token | `{ "message": "Invalid or expired verification token" }` |
| 409 | Phone already registered | `{ "message": "Phone number is already registered" }` |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

### 1.5 Login

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "phone": "+15551234567",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "+15551234567",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "active",
    "lastLoginAt": "2025-11-06T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Invalid credentials | `{ "message": "Invalid phone or password" }` |
| 401 | User not found | `{ "message": "Invalid phone or password" }` |
| 429 | Too many attempts | `{ "message": "Account temporarily locked due to too many failed attempts" }` |

**Important Notes:**
- Account locked after 5 failed login attempts
- Lock expires after 30 minutes
- Access token expires in 15 minutes
- Refresh token expires in 7 days

---

### 1.6 Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Authentication:** None (requires refresh token)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Invalid refresh token | `{ "message": "Invalid or expired refresh token" }` |
| 401 | Token blacklisted | `{ "message": "Token has been revoked" }` |

**Important Notes:**
- Old refresh token is blacklisted after use
- Always use the new refresh token returned
- Refresh tokens are single-use only

---

### 1.7 Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required (Bearer token in header)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (204):**
No content returned.

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Missing access token | `{ "message": "Unauthorized" }` |
| 401 | Invalid access token | `{ "message": "Invalid or expired token" }` |

**Important Notes:**
- Blacklists the refresh token
- Client should clear all stored tokens
- Access token remains valid until expiration

---

### 1.8 Forgot Password

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "phone": "+15551234567"
}
```

**Success Response (200):**
```json
{
  "resetId": "reset_abc123def456",
  "message": "Password reset code sent to your phone"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 404 | Phone not found | `{ "message": "No account found with this phone number" }` |
| 429 | Rate limit exceeded | `{ "message": "Too many reset attempts" }` |

**Important Notes:**
- Reset code expires in 10 minutes
- Maximum 3 reset codes per phone per 10 minutes
- In test/dev mode, code is always `111111`

---

### 1.9 Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

**Authentication:** None (Public)

**Request Body:**
```json
{
  "resetId": "reset_abc123def456",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid code | `{ "message": "Invalid or incorrect reset code" }` |
| 404 | Reset session not found | `{ "message": "Reset session not found or expired" }` |
| 400 | Weak password | `{ "message": "Password does not meet security requirements" }` |

---

## Quote Request Flow

### 2.1 Create Quote Request (Complete 5-Step Data)

**Endpoint:** `POST /api/v1/quotes`

**Authentication:** None (Public - creates anonymous quote)

**Request Body (All 5 Steps Combined):**

```json
{
  "sessionId": "session_abc123",
  "insuranceType": "commercial",
  "requestType": "new_coverage",

  "_comment_step2": "Step 2: Business Basics",
  "legalBusinessName": "Acme Tech LLC",
  "dbaName": "Acme Technologies",
  "legalStructure": "LLC",
  "businessWebsite": "https://acmetech.com",
  "industry": "Technology Consulting",
  "industryCode": "541512",
  "businessDescription": "Software development and IT consulting services",
  "fein": "12-3456789",
  "yearStarted": 2020,
  "yearsCurrentOwnership": 4,

  "_comment_address": "Business Address",
  "addressType": "physical",
  "streetAddress": "123 Tech Street",
  "addressUnit": "Suite 100",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",

  "_comment_step3": "Step 3: Financial Information",
  "revenue2024": 500000,
  "expenses2024": 300000,
  "revenue2025Estimate": 750000,
  "expenses2025Estimate": 400000,
  "fullTimeEmployees": 5,
  "partTimeEmployees": 2,
  "totalPayroll": 400000,
  "contractorPercentage": 20,

  "_comment_contact": "Contact Information",
  "contactFirstName": "John",
  "contactLastName": "Doe",
  "contactEmail": "john@acmetech.com",
  "contactPhone": "+15551234567",

  "_comment_step5": "Step 5: Additional Comments",
  "additionalComments": "Looking for comprehensive coverage for tech startup"
}
```

**Field Definitions:**

**Required Fields:**
- `sessionId` (string) - Frontend-generated session ID
- `insuranceType` (enum) - `"commercial"` or `"personal"`
- `requestType` (enum) - `"new_coverage"`, `"renewal"`, or `"quote_comparison"`
- `legalBusinessName` (string) - Legal business name
- `industry` (string) - Industry description
- `streetAddress` (string) - Street address
- `city` (string) - City name
- `state` (string) - 2-letter state code
- `zipCode` (string) - 5-digit ZIP code
- `contactEmail` (string) - Contact email
- `contactPhone` (string) - Phone in E.164 format

**Optional Fields:**
- `dbaName` (string) - "Doing Business As" name
- `legalStructure` (enum) - `"LLC"`, `"Corporation"`, `"Partnership"`, `"Sole Proprietorship"`
- `businessWebsite` (string) - URL with https://
- `industryCode` (string) - NAICS code
- `businessDescription` (string) - Detailed description
- `fein` (string) - Federal Employer ID (format: 12-3456789)
- `yearStarted` (number) - Year business started (YYYY)
- `yearsCurrentOwnership` (number) - Years under current ownership
- `addressType` (enum) - `"physical"`, `"mailing"`, or `"both"`
- `addressUnit` (string) - Suite/Unit number
- `revenue2024` (number) - Revenue for 2024
- `expenses2024` (number) - Expenses for 2024
- `revenue2025Estimate` (number) - Estimated revenue for 2025
- `expenses2025Estimate` (number) - Estimated expenses for 2025
- `fullTimeEmployees` (number) - Number of full-time employees
- `partTimeEmployees` (number) - Number of part-time employees
- `totalPayroll` (number) - Total annual payroll
- `contractorPercentage` (number) - Percentage of contractors (0-100)
- `contactFirstName` (string) - Contact first name
- `contactLastName` (string) - Contact last name
- `additionalComments` (string) - Additional notes

**Success Response (201):**
```json
{
  "id": "qr_abc123def456",
  "sessionId": "session_abc123",
  "insuranceType": "commercial",
  "requestType": "new_coverage",
  "status": "draft",
  "legalBusinessName": "Acme Tech LLC",
  "dbaName": "Acme Technologies",
  "legalStructure": "LLC",
  "businessWebsite": "https://acmetech.com",
  "industry": "Technology Consulting",
  "industryCode": "541512",
  "businessDescription": "Software development and IT consulting services",
  "fein": "12-3456789",
  "yearStarted": 2020,
  "yearsCurrentOwnership": 4,
  "addressType": "physical",
  "streetAddress": "123 Tech Street",
  "addressUnit": "Suite 100",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94105",
  "revenue2024": 500000,
  "expenses2024": 300000,
  "revenue2025Estimate": 750000,
  "expenses2025Estimate": 400000,
  "fullTimeEmployees": 5,
  "partTimeEmployees": 2,
  "totalPayroll": 400000,
  "contractorPercentage": 20,
  "contactFirstName": "John",
  "contactLastName": "Doe",
  "contactEmail": "john@acmetech.com",
  "contactPhone": "+15551234567",
  "additionalComments": "Looking for comprehensive coverage for tech startup",
  "userId": null,
  "createdAt": "2025-11-06T10:30:00Z",
  "updatedAt": "2025-11-06T10:30:00Z"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Missing required fields | `{ "message": "Validation failed", "errors": [...] }` |
| 400 | Invalid field format | `{ "message": "Invalid field format" }` |

**Important Notes:**
- Quote request is created with `status: "draft"`
- Frontend can send partial data and update later
- `userId` is null until user registers and links quote
- `id` is the quote request ID for subsequent operations

---

### 2.2 Update Quote Request

**Endpoint:** `PUT /api/v1/quotes/:id`

**Authentication:** Optional (can be anonymous or authenticated)

**URL Parameters:**
- `id` - Quote request ID

**Request Body:**
```json
{
  "legalBusinessName": "Updated Corp Name",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  ...any other fields to update
}
```

**Success Response (200):**
```json
{
  "id": "qr_abc123def456",
  ...updated quote request fields
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 404 | Quote not found | `{ "message": "Quote request not found" }` |
| 400 | Validation error | `{ "message": "Invalid field values" }` |

---

### 2.3 Select Coverages (Step 4)

**Endpoint:** `POST /api/v1/quotes/:id/coverages`

**Authentication:** None (Public)

**URL Parameters:**
- `id` - Quote request ID

**Request Body:**
```json
{
  "selectedCoverages": [
    "general_liability",
    "professional_liability",
    "cyber_liability"
  ]
}
```

**Coverage Types:**
- `"general_liability"` - General Liability Insurance
- `"professional_liability"` - Professional Liability / E&O
- `"cyber_liability"` - Cyber Liability Insurance
- `"workers_compensation"` - Workers' Compensation
- `"commercial_property"` - Commercial Property Insurance
- `"business_interruption"` - Business Interruption Insurance
- `"commercial_auto"` - Commercial Auto Insurance
- `"directors_officers"` - Directors & Officers Liability

**Success Response (201):**
```json
[
  {
    "id": "cov_abc123",
    "quoteRequestId": "qr_abc123def456",
    "coverageType": "general_liability",
    "isSelected": true,
    "createdAt": "2025-11-06T10:30:00Z"
  },
  {
    "id": "cov_def456",
    "quoteRequestId": "qr_abc123def456",
    "coverageType": "professional_liability",
    "isSelected": true,
    "createdAt": "2025-11-06T10:30:00Z"
  },
  {
    "id": "cov_ghi789",
    "quoteRequestId": "qr_abc123def456",
    "coverageType": "cyber_liability",
    "isSelected": true,
    "createdAt": "2025-11-06T10:30:00Z"
  }
]
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 404 | Quote not found | `{ "message": "Quote request not found" }` |
| 400 | Invalid coverage type | `{ "message": "Invalid coverage type" }` |

---

### 2.4 Submit Quote Request

**Endpoint:** `POST /api/v1/quotes/:id/submit`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` - Quote request ID

**Request Body:**
```json
{}
```
(No body required)

**Success Response (201):**
```json
{
  "id": "qr_abc123def456",
  "status": "submitted",
  "submittedAt": "2025-11-06T10:30:00Z",
  ...other quote request fields
}
```

**Status After Submission:**
- `"submitted"` - Quote submitted, processing will begin
- `"processing"` - Carriers are being contacted (async)
- `"quotes_ready"` - Quotes received from carriers (updated later)

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Already submitted | `{ "message": "Quote request already submitted" }` |
| 400 | No coverages selected | `{ "message": "No coverages selected for this quote" }` |
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Quote not found | `{ "message": "Quote request not found" }` |

**Important Notes:**
- Quote submission triggers async carrier API calls
- Carriers are contacted in parallel
- Typically takes 5-10 seconds to receive quotes
- Frontend should poll GET /api/v1/quotes/:id or wait for status change

---

### 2.5 Get Quote Request with Quotes

**Endpoint:** `GET /api/v1/quotes/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` - Quote request ID

**Success Response (200):**
```json
{
  "quoteRequest": {
    "id": "qr_abc123def456",
    "sessionId": "session_abc123",
    "status": "quotes_ready",
    "insuranceType": "commercial",
    "legalBusinessName": "Acme Tech LLC",
    "industry": "Technology Consulting",
    "city": "San Francisco",
    "state": "CA",
    "contactEmail": "john@acmetech.com",
    "submittedAt": "2025-11-06T10:30:00Z",
    "createdAt": "2025-11-06T10:25:00Z",
    ...all other quote request fields
  },
  "coverages": [
    {
      "id": "cov_abc123",
      "coverageType": "general_liability",
      "isSelected": true
    },
    {
      "id": "cov_def456",
      "coverageType": "professional_liability",
      "isSelected": true
    },
    {
      "id": "cov_ghi789",
      "coverageType": "cyber_liability",
      "isSelected": true
    }
  ],
  "quotes": [
    {
      "id": "quote_123",
      "quoteRequestId": "qr_abc123def456",
      "carrierId": "carrier_reliable",
      "carrierQuoteId": "carrier-quote-abc123",
      "coverageType": "general_liability",
      "insuranceType": "commercial",
      "status": "quoted",
      "annualPremium": 1200,
      "monthlyPremium": 110,
      "quarterlyPremium": 325,
      "coverageLimits": {
        "per_occurrence": 1000000,
        "aggregate": 2000000
      },
      "deductible": 500,
      "effectiveDate": "2025-12-01T00:00:00Z",
      "expirationDate": "2026-12-01T00:00:00Z",
      "validUntil": "2025-12-15T00:00:00Z",
      "highlights": [
        "Coverage for bodily injury",
        "Property damage protection"
      ],
      "exclusions": [
        "Pollution",
        "Professional services"
      ],
      "createdAt": "2025-11-06T10:30:15Z",
      "carrier": {
        "id": "carrier_reliable",
        "carrierCode": "reliable_insurance",
        "carrierName": "Reliable Insurance Co.",
        "specialization": "Technology companies",
        "supportedCoverages": [
          "general_liability",
          "professional_liability",
          "cyber_liability"
        ],
        "isActive": true
      }
    },
    {
      "id": "quote_456",
      "quoteRequestId": "qr_abc123def456",
      "carrierId": "carrier_techshield",
      "carrierQuoteId": "ts-quote-def456",
      "coverageType": "professional_liability",
      "insuranceType": "commercial",
      "status": "quoted",
      "annualPremium": 1650,
      "monthlyPremium": 145,
      "quarterlyPremium": 450,
      "coverageLimits": {
        "per_claim": 1000000,
        "aggregate": 2000000
      },
      "deductible": 1000,
      "effectiveDate": "2025-12-01T00:00:00Z",
      "expirationDate": "2026-12-01T00:00:00Z",
      "validUntil": "2025-12-15T00:00:00Z",
      "highlights": [
        "Errors & omissions coverage",
        "Technology E&O included"
      ],
      "exclusions": [
        "Bodily injury",
        "Property damage"
      ],
      "createdAt": "2025-11-06T10:30:18Z",
      "carrier": {
        "id": "carrier_techshield",
        "carrierCode": "techshield_underwriters",
        "carrierName": "TechShield Underwriters",
        "specialization": "Technology E&O",
        "supportedCoverages": [
          "professional_liability",
          "cyber_liability"
        ],
        "isActive": true
      }
    }
  ]
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Quote not found | `{ "message": "Quote request not found" }` |

**Important Notes:**
- Multiple quotes from different carriers for each coverage type
- Each quote has complete pricing (annual, monthly, quarterly)
- Quotes include carrier information inline
- Frontend can sort/filter quotes by premium, carrier, coverage type
- Quotes expire 30 days after creation (`validUntil` date)

---

### 2.6 Get Quote Request by Session

**Endpoint:** `GET /api/v1/quotes/session/:sessionId`

**Authentication:** None (Public)

**URL Parameters:**
- `sessionId` - Session ID provided when creating quote

**Success Response (200):**
```json
{
  "id": "qr_abc123def456",
  "sessionId": "session_abc123",
  "status": "draft",
  ...all quote request fields
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 404 | Session not found | `{ "message": "Quote request not found for this session" }` |

**Use Case:**
- Frontend can retrieve in-progress quote by session ID
- Useful for "Continue where you left off" feature
- No authentication required for draft quotes

---

## Policy Management

### 3.1 Bind Policy from Quote

**Endpoint:** `POST /api/v1/policies/bind`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "carrierQuoteId": "quote_123",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "paymentPlan": "monthly",
  "autoRenewal": true,
  "paymentMethodId": "pm_test_123",
  "additionalNotes": "Please start coverage immediately"
}
```

**Field Definitions:**

**Required Fields:**
- `carrierQuoteId` (string) - ID of the quote to bind (from GET /api/v1/quotes/:id)
- `userId` (string) - User ID (must match authenticated user)
- `paymentPlan` (enum) - `"monthly"`, `"quarterly"`, `"annual"`

**Optional Fields:**
- `autoRenewal` (boolean, default: true) - Enable automatic renewal
- `paymentMethodId` (string) - Payment method ID from payment provider
- `additionalNotes` (string) - Additional binding instructions

**Success Response (201):**
```json
{
  "id": "pol_abc123def456",
  "policyNumber": "POL-2025-001234",
  "carrierPolicyId": "carrier-policy-789",
  "carrierBindId": "bind-request-456",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quoteRequestId": "qr_abc123def456",
  "carrierQuoteId": "quote_123",
  "carrierId": "carrier_reliable",
  "insuranceType": "commercial",
  "coverageType": "general_liability",
  "status": "bound",
  "coverageLimits": {
    "per_occurrence": 1000000,
    "aggregate": 2000000
  },
  "deductible": 500,
  "annualPremium": 1200,
  "paymentPlan": "monthly",
  "monthlyAmount": 110,
  "effectiveDate": "2025-12-01T00:00:00Z",
  "expirationDate": "2026-12-01T00:00:00Z",
  "boundAt": "2025-11-06T10:35:00Z",
  "insuredName": "Acme Tech LLC",
  "insuredAddress": "123 Tech Street Suite 100, San Francisco, CA 94105",
  "firstPaymentDue": "2025-12-16T00:00:00Z",
  "nextPaymentDate": "2025-12-16T00:00:00Z",
  "paymentsRemaining": 12,
  "autoRenewal": true,
  "policyDocumentUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234.pdf",
  "declarationsUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234-declarations.pdf",
  "certificateUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234-certificate.pdf",
  "carrierContactInfo": {
    "phone": "+18005551234",
    "email": "support@reliableinsurance.com",
    "claims_phone": "+18005554567"
  },
  "createdAt": "2025-11-06T10:35:00Z",
  "updatedAt": "2025-11-06T10:35:00Z"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Quote expired | `{ "message": "Quote has expired" }` |
| 400 | Binding failed | `{ "message": "Failed to bind policy with carrier" }` |
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Quote not found | `{ "message": "Quote not found" }` |

**Important Notes:**
- Policy binding is synchronous and may take 3-5 seconds
- Returns complete policy with policy number and documents
- Payment is processed immediately or scheduled based on payment plan
- Policy documents are generated and available immediately
- First payment due 15 days from effective date

---

### 3.2 Get User Policies

**Endpoint:** `GET /api/v1/policies`

**Authentication:** Required (Bearer token)

**Success Response (200):**
```json
[
  {
    "id": "pol_abc123def456",
    "policyNumber": "POL-2025-001234",
    "insuranceType": "commercial",
    "coverageType": "general_liability",
    "status": "bound",
    "annualPremium": 1200,
    "monthlyAmount": 110,
    "effectiveDate": "2025-12-01T00:00:00Z",
    "expirationDate": "2026-12-01T00:00:00Z",
    "insuredName": "Acme Tech LLC",
    "nextPaymentDate": "2025-12-16T00:00:00Z",
    "autoRenewal": true,
    "carrier": {
      "id": "carrier_reliable",
      "carrierName": "Reliable Insurance Co.",
      "carrierCode": "reliable_insurance"
    },
    "createdAt": "2025-11-06T10:35:00Z"
  },
  {
    "id": "pol_def456ghi789",
    "policyNumber": "POL-2025-001235",
    "insuranceType": "commercial",
    "coverageType": "cyber_liability",
    "status": "active",
    "annualPremium": 2400,
    "monthlyAmount": 220,
    "effectiveDate": "2025-12-01T00:00:00Z",
    "expirationDate": "2026-12-01T00:00:00Z",
    "insuredName": "Acme Tech LLC",
    "nextPaymentDate": "2026-01-16T00:00:00Z",
    "autoRenewal": true,
    "carrier": {
      "id": "carrier_techshield",
      "carrierName": "TechShield Underwriters",
      "carrierCode": "techshield_underwriters"
    },
    "createdAt": "2025-11-06T10:38:00Z"
  }
]
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |

**Policy Statuses:**
- `"bound"` - Policy bound but not yet effective
- `"active"` - Policy is currently active
- `"expired"` - Policy has expired
- `"cancelled"` - Policy was cancelled
- `"pending_renewal"` - Renewal in progress

---

### 3.3 Get Policy by ID

**Endpoint:** `GET /api/v1/policies/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` - Policy ID

**Success Response (200):**
```json
{
  "id": "pol_abc123def456",
  "policyNumber": "POL-2025-001234",
  "carrierPolicyId": "carrier-policy-789",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "quoteRequestId": "qr_abc123def456",
  "carrierQuoteId": "quote_123",
  "carrierId": "carrier_reliable",
  "insuranceType": "commercial",
  "coverageType": "general_liability",
  "status": "bound",
  "coverageLimits": {
    "per_occurrence": 1000000,
    "aggregate": 2000000
  },
  "deductible": 500,
  "annualPremium": 1200,
  "paymentPlan": "monthly",
  "monthlyAmount": 110,
  "effectiveDate": "2025-12-01T00:00:00Z",
  "expirationDate": "2026-12-01T00:00:00Z",
  "boundAt": "2025-11-06T10:35:00Z",
  "insuredName": "Acme Tech LLC",
  "insuredAddress": "123 Tech Street Suite 100, San Francisco, CA 94105",
  "firstPaymentDue": "2025-12-16T00:00:00Z",
  "nextPaymentDate": "2025-12-16T00:00:00Z",
  "paymentsRemaining": 12,
  "autoRenewal": true,
  "policyDocumentUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234.pdf",
  "declarationsUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234-declarations.pdf",
  "certificateUrl": "https://s3.amazonaws.com/clarence-policies/POL-2025-001234-certificate.pdf",
  "carrierContactInfo": {
    "phone": "+18005551234",
    "email": "support@reliableinsurance.com",
    "claims_phone": "+18005554567"
  },
  "carrier": {
    "id": "carrier_reliable",
    "carrierName": "Reliable Insurance Co.",
    "carrierCode": "reliable_insurance",
    "specialization": "Technology companies"
  },
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "+15551234567",
    "email": "john@acmetech.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "quoteRequest": {
    "id": "qr_abc123def456",
    "legalBusinessName": "Acme Tech LLC",
    "industry": "Technology Consulting",
    "city": "San Francisco",
    "state": "CA"
  },
  "createdAt": "2025-11-06T10:35:00Z",
  "updatedAt": "2025-11-06T10:35:00Z"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 403 | Not authorized | `{ "message": "You don't have access to this policy" }` |
| 404 | Policy not found | `{ "message": "Policy not found" }` |

---

### 3.4 Get Policy by Policy Number

**Endpoint:** `GET /api/v1/policies/number/:policyNumber`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `policyNumber` - Policy number (e.g., POL-2025-001234)

**Success Response (200):**
Same as Get Policy by ID (section 3.3)

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Policy not found | `{ "message": "Policy not found" }` |

---

### 3.5 Get Active Policies

**Endpoint:** `GET /api/v1/policies/active`

**Authentication:** Required (Bearer token)

**Success Response (200):**
Array of policies with `status: "active"` (same structure as Get User Policies)

---

### 3.6 Get Policies Expiring Soon

**Endpoint:** `GET /api/v1/policies/expiring-soon`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `days` (optional, default: 60) - Number of days to look ahead

**Success Response (200):**
Array of active policies expiring within the specified days (same structure as Get User Policies)

**Use Case:**
- Show renewal reminders to users
- Send notifications 60, 30, 15 days before expiration

---

### 3.7 Cancel Policy

**Endpoint:** `POST /api/v1/policies/:id/cancel`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` - Policy ID

**Request Body:**
```json
{
  "reason": "Found better coverage",
  "effectiveDate": "2025-12-01T00:00:00Z"
}
```

**Success Response (200):**
```json
{
  "id": "pol_abc123def456",
  "policyNumber": "POL-2025-001234",
  "status": "cancelled",
  "cancelledAt": "2025-11-06T10:40:00Z",
  ...other policy fields
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Already cancelled | `{ "message": "Policy already cancelled" }` |
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Policy not found | `{ "message": "Policy not found" }` |

---

## Carrier Management

### 4.1 Get All Carriers

**Endpoint:** `GET /api/v1/carriers`

**Authentication:** None (Public)

**Success Response (200):**
```json
[
  {
    "id": "carrier_reliable",
    "carrierCode": "reliable_insurance",
    "carrierName": "Reliable Insurance Co.",
    "specialization": "Technology companies",
    "apiBaseUrl": "http://localhost:3001/api/v1",
    "supportsPersonal": false,
    "supportsCommercial": true,
    "supportedCoverages": [
      "general_liability",
      "professional_liability",
      "cyber_liability"
    ],
    "isActive": true,
    "healthStatus": "operational",
    "lastHealthCheck": "2025-11-06T10:00:00Z"
  },
  {
    "id": "carrier_techshield",
    "carrierCode": "techshield_underwriters",
    "carrierName": "TechShield Underwriters",
    "specialization": "Technology E&O",
    "apiBaseUrl": "http://localhost:3001/api/v1",
    "supportsPersonal": false,
    "supportsCommercial": true,
    "supportedCoverages": [
      "professional_liability",
      "cyber_liability"
    ],
    "isActive": true,
    "healthStatus": "operational",
    "lastHealthCheck": "2025-11-06T10:00:00Z"
  },
  {
    "id": "carrier_premier",
    "carrierCode": "premier_underwriters",
    "carrierName": "Premier Underwriters",
    "specialization": "Full coverage",
    "apiBaseUrl": "http://localhost:3001/api/v1",
    "supportsPersonal": true,
    "supportsCommercial": true,
    "supportedCoverages": [
      "general_liability",
      "professional_liability",
      "cyber_liability",
      "workers_compensation"
    ],
    "isActive": true,
    "healthStatus": "operational",
    "lastHealthCheck": "2025-11-06T10:00:00Z"
  },
  {
    "id": "carrier_fastbind",
    "carrierCode": "fastbind_insurance",
    "carrierName": "FastBind Insurance",
    "specialization": "Quick quotes",
    "apiBaseUrl": "http://localhost:3001/api/v1",
    "supportsPersonal": false,
    "supportsCommercial": true,
    "supportedCoverages": [
      "general_liability",
      "professional_liability"
    ],
    "isActive": true,
    "healthStatus": "operational",
    "lastHealthCheck": "2025-11-06T10:00:00Z"
  }
]
```

**Use Case:**
- Display carrier options to users
- Show supported coverage types per carrier
- Filter carriers based on insurance type and coverage needs

---

### 4.2 Get Carrier Health

**Endpoint:** `GET /api/v1/carriers/:id/health`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `id` - Carrier ID

**Success Response (200):**
```json
{
  "message": "Carrier health check completed successfully"
}
```

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Not authenticated | `{ "message": "Unauthorized" }` |
| 404 | Carrier not found | `{ "message": "Carrier not found" }` |
| 503 | Carrier unhealthy | `{ "message": "Carrier API is currently unavailable" }` |

**Use Case:**
- Admin dashboard to monitor carrier health
- Not typically used by frontend app directly

---

## Document Parsing

### 5.1 Parse Declaration Page (Dec Page)

**Endpoint:** `POST /api/v1/document-parsing/parse-decpage`

**Authentication:** None (Public)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (file, required) - PDF file to parse

**File Requirements:**
- Format: PDF only
- Max size: 5 MB
- Field name: `file`

**Success Response (200):**
```json
{
  "legalBusinessName": "BrightWorks LLC",
  "businessAddress": "456 Market Street",
  "city": "San Francisco",
  "state": "CA",
  "zip": 94103,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@brightworks.com",
  "phone": "+14155551234",
  "metadata": {
    "fileName": "decpage.pdf",
    "fileType": "application/pdf",
    "fileSize": 245678,
    "fileUrl": "https://s3.amazonaws.com/clarence-uploads/decpage_abc123.pdf",
    "confidence": 0.92,
    "parsedAt": "2025-11-06T10:30:00Z"
  }
}
```

**Field Definitions:**

**Extracted Business Fields:**
- `legalBusinessName` (string, nullable) - Extracted business name
- `businessAddress` (string, nullable) - Street address
- `city` (string, nullable) - City name
- `state` (string, nullable) - 2-letter state code
- `zip` (number, nullable) - 5-digit ZIP code

**Extracted Contact Fields:**
- `firstName` (string, nullable) - Contact first name
- `lastName` (string, nullable) - Contact last name
- `email` (string, nullable) - Contact email
- `phone` (string, nullable) - Phone in E.164 format

**Metadata Fields:**
- `fileName` (string) - Original file name
- `fileType` (string) - MIME type
- `fileSize` (number) - File size in bytes
- `fileUrl` (string) - S3 URL where file is stored
- `confidence` (number) - Extraction confidence (0.0 to 1.0)
- `parsedAt` (string) - ISO 8601 timestamp

**Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | No file provided | `{ "message": "File is required" }` |
| 400 | Invalid file type | `{ "message": "Only PDF files are supported" }` |
| 413 | File too large | `{ "message": "File size exceeds 5MB limit" }` |
| 400 | Parsing failed | `{ "message": "Failed to parse document" }` |

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/document-parsing/parse-decpage \
  -F "file=@/path/to/decpage.pdf"
```

**Example JavaScript (FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/v1/document-parsing/parse-decpage', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Important Notes:**
- AI-powered extraction using OpenAI
- Returns mock data if OpenAI not configured
- Confidence score indicates extraction quality
- All extracted fields are nullable
- Frontend should validate extracted data before using

---

## Common Patterns

### Authentication Flow

```
1. User enters phone number
   → POST /api/v1/auth/check-phone

2. If available, send verification code
   → POST /api/v1/auth/send-verification-code
   → Returns verificationId

3. User enters 6-digit code
   → POST /api/v1/auth/verify-code
   → Returns verificationToken

4. User creates password
   → POST /api/v1/auth/register
   → Returns user + tokens

5. Store tokens in secure storage
   - accessToken: Use in Authorization header
   - refreshToken: Use to refresh expired tokens

6. On token expiration (401 with TOKEN_EXPIRED)
   → POST /api/v1/auth/refresh
   → Get new tokens
```

### Quote to Policy Flow

```
1. Anonymous user starts quote
   → POST /api/v1/quotes
   → Store quoteRequestId and sessionId

2. User selects coverages (Step 4)
   → POST /api/v1/quotes/:id/coverages

3. User completes authentication
   → Follow Authentication Flow above
   → Get userId and accessToken

4. Link quote to user
   → PUT /api/v1/quotes/:id
   → Send { userId: "..." }

5. Submit quote request
   → POST /api/v1/quotes/:id/submit
   → Status changes to "submitted" then "processing"

6. Poll for quotes (or wait 10 seconds)
   → GET /api/v1/quotes/:id
   → Wait until status is "quotes_ready"

7. User selects a quote
   → Show all quotes from response.quotes
   → User picks one

8. Bind policy
   → POST /api/v1/policies/bind
   → Send carrierQuoteId + payment details
   → Get policy with policyNumber and documents

9. Show policy confirmation
   → Display policyNumber
   → Link to policyDocumentUrl
   → Show firstPaymentDue date
```

### Token Refresh Pattern

```javascript
// In API interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if error is 401 and token expired
    if (error.response?.status === 401 &&
        error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
        !originalRequest._retry) {

      originalRequest._retry = true;

      const refreshToken = getStoredRefreshToken();

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken
        });

        // Store new tokens
        setStoredAccessToken(data.accessToken);
        setStoredRefreshToken(data.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        clearStoredTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Error Handling Pattern

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    validationErrors?: Array<{
      field: string;
      message: string;
      code: string;
      constraints?: Record<string, any>;
    }>;
    details?: Record<string, any>;
  };
  timestamp: string;
}

function handleApiError(error: any) {
  if (error.response) {
    const apiError: ApiError = error.response.data;

    switch (apiError.error.code) {
      case 'VALIDATION_ERROR':
        // Show field-specific errors
        apiError.error.validationErrors?.forEach(err => {
          showFieldError(err.field, err.message);
        });
        break;

      case 'TOKEN_EXPIRED':
        // Handle in interceptor (see above)
        break;

      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = error.response.headers['retry-after'];
        showNotification(`Too many requests. Try again in ${retryAfter} seconds.`);
        break;

      case 'QUOTE_EXPIRED':
        showNotification('This quote has expired. Please request a new quote.');
        redirectToNewQuote();
        break;

      default:
        showNotification(apiError.error.message);
    }
  } else {
    // Network error
    showNotification('Network error. Please check your connection.');
  }
}
```

### Field Name Mapping

If you have existing code using different field names, here's a mapping:

| Your Code | API Field | Notes |
|-----------|-----------|-------|
| `phoneNumber` | `phone` | E.164 format |
| `businessName` | `legalBusinessName` | Legal entity name |
| `ein` | `fein` | Federal Employer ID |
| `zipcode` | `zipCode` | 5-digit string |
| `description` | `businessDescription` | Business description |
| `employees` | `fullTimeEmployees` | Number of FT employees |
| `revenue` | `revenue2024` | Current year revenue |
| `quoteId` | `quoteRequestId` | Quote request ID |
| `coverage` | `coverageType` | Coverage type enum |
| `premium` | `annualPremium` | Annual premium amount |

---

## Testing

### Test Environment
```
Base URL: http://localhost:3000/api/v1
Carrier Simulator: http://localhost:3001/api/v1
```

### Test Data

**Test Phone Number:**
```
+14155559999
```

**Mock OTP Code:**
```
111111
```

**Test Password:**
```
TestPass123!
```

**Test Quote Request:**
See section 2.1 for complete example

**Test Coverage Types:**
```json
[
  "general_liability",
  "professional_liability",
  "cyber_liability"
]
```

### Expected Behavior

**Quote Submission (Section 2.4):**
- Submission triggers async carrier API calls
- 4 carriers contacted in parallel
- Expect ~12 quotes (4 carriers × 3 coverage types)
- Processing time: 5-10 seconds
- Expected quote count: minimum 2 carriers should respond

**Policy Binding (Section 3.1):**
- Binding is synchronous, takes 3-5 seconds
- Returns complete policy with documents
- Policy status is "bound" initially
- Status changes to "active" on effective date

---

## API Client Example

Complete TypeScript API client:

```typescript
import axios, { AxiosInstance } from 'axios';

class ClarenceApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(config => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            this.refreshToken) {
          originalRequest._retry = true;

          try {
            const { data } = await this.client.post('/auth/refresh', {
              refreshToken: this.refreshToken
            });

            this.setTokens(data.accessToken, data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            throw refreshError;
          }
        }

        throw error;
      }
    );
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth methods
  async checkPhone(phone: string) {
    const { data } = await this.client.post('/auth/check-phone', { phone });
    return data;
  }

  async sendVerificationCode(phone: string, purpose: string) {
    const { data } = await this.client.post('/auth/send-verification-code', {
      phone,
      purpose
    });
    return data;
  }

  async verifyCode(verificationId: string, code: string) {
    const { data } = await this.client.post('/auth/verify-code', {
      verificationId,
      code
    });
    return data;
  }

  async register(verificationToken: string, password: string, email?: string) {
    const { data } = await this.client.post('/auth/register', {
      verificationToken,
      password,
      email
    });
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data;
  }

  async login(phone: string, password: string) {
    const { data } = await this.client.post('/auth/login', {
      phone,
      password
    });
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data;
  }

  async logout() {
    await this.client.post('/auth/logout', {
      refreshToken: this.refreshToken
    });
    this.clearTokens();
  }

  // Quote methods
  async createQuote(quoteData: any) {
    const { data } = await this.client.post('/quotes', quoteData);
    return data;
  }

  async updateQuote(id: string, updates: any) {
    const { data } = await this.client.put(`/quotes/${id}`, updates);
    return data;
  }

  async selectCoverages(id: string, selectedCoverages: string[]) {
    const { data } = await this.client.post(`/quotes/${id}/coverages`, {
      selectedCoverages
    });
    return data;
  }

  async submitQuote(id: string) {
    const { data } = await this.client.post(`/quotes/${id}/submit`);
    return data;
  }

  async getQuote(id: string) {
    const { data } = await this.client.get(`/quotes/${id}`);
    return data;
  }

  // Policy methods
  async bindPolicy(bindData: any) {
    const { data } = await this.client.post('/policies/bind', bindData);
    return data;
  }

  async getPolicies() {
    const { data } = await this.client.get('/policies');
    return data;
  }

  async getPolicy(id: string) {
    const { data } = await this.client.get(`/policies/${id}`);
    return data;
  }

  // Carrier methods
  async getCarriers() {
    const { data } = await this.client.get('/carriers');
    return data;
  }

  // Document parsing
  async parseDecPage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await this.client.post('/document-parsing/parse-decpage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }
}

// Usage
const api = new ClarenceApiClient('http://localhost:3000/api/v1');

// Example flow
async function exampleFlow() {
  try {
    // 1. Check phone
    const phoneCheck = await api.checkPhone('+15551234567');

    // 2. Send verification
    const verification = await api.sendVerificationCode('+15551234567', 'registration');

    // 3. Verify code
    const verified = await api.verifyCode(verification.verificationId, '111111');

    // 4. Register
    const registered = await api.register(verified.verificationToken, 'TestPass123!');

    // 5. Create quote
    const quote = await api.createQuote({
      sessionId: 'session_123',
      insuranceType: 'commercial',
      legalBusinessName: 'Test Corp',
      // ... other fields
    });

    // 6. Select coverages
    await api.selectCoverages(quote.id, ['general_liability']);

    // 7. Update with userId
    await api.updateQuote(quote.id, { userId: registered.user.id });

    // 8. Submit
    await api.submitQuote(quote.id);

    // 9. Wait and get quotes
    await new Promise(resolve => setTimeout(resolve, 10000));
    const quoteWithCarrierQuotes = await api.getQuote(quote.id);

    // 10. Bind policy
    const policy = await api.bindPolicy({
      carrierQuoteId: quoteWithCarrierQuotes.quotes[0].id,
      userId: registered.user.id,
      paymentPlan: 'monthly',
      autoRenewal: true,
      paymentMethodId: 'pm_test_123'
    });

    console.log('Policy bound:', policy.policyNumber);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Changelog

### Version 3.0 (Current)
- Complete field definitions extracted from E2E tests
- Accurate request/response examples
- All field names verified against backend implementation
- Added complete quote request structure (57 fields)
- Added policy binding response structure
- Added document parsing response structure
- Fixed field name inconsistencies (e.g., `phone` vs `phoneNumber`)
- Added carrier response structure
- Added complete error handling examples

### Version 2.0
- Added comprehensive error codes and status codes
- Added validation error format
- Added rate limiting details
- Added TypeScript examples

### Version 1.0
- Initial API endpoint list
- Basic request/response structures

---

## Support

For questions or issues with this API documentation:
- Check the test files in `backend/test/` for working examples
- Review `backend/TESTING_GUIDE.md` for test execution
- See `TESTING_SESSION_SUMMARY.md` for known issues

---

**Last Updated:** November 12, 2025
**API Version:** v1
**Documentation Version:** 3.0
