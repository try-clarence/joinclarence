# Complete API List for Frontend Implementation
## Based on UI Screen Specifications & PRD

This document provides a comprehensive list of all APIs required to implement the Clarence Insurance Platform frontend, organized by feature area and mapped to specific UI screens.

---

## Table of Contents

1. [Authentication & Registration](#1-authentication--registration)
2. [Quote Request Flow (Steps 1-5)](#2-quote-request-flow-steps-1-5)
3. [Dashboard](#3-dashboard)
4. [Quote Management & Comparison](#4-quote-management--comparison)
5. [Purchase Flow](#5-purchase-flow)
6. [Policy Management](#6-policy-management)
7. [Document Management](#7-document-management)
8. [AI Chat Support](#8-ai-chat-support)
9. [Settings & Profile](#9-settings--profile)
10. [Help Center](#10-help-center)
11. [Notifications](#11-notifications)
12. [Payment & Billing](#12-payment--billing)
13. [Renewal & Retention](#13-renewal--retention)

---

## 1. Authentication & Registration

### 1.1 Registration Screen APIs

#### Check Phone Availability
```
POST /api/v1/auth/check-phone
```
**Purpose:** Check if phone number is already registered (before showing registration form)

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid phone format
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Request:**
```json
{
  "phoneNumber": "+15551234567"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "Phone number is available"
  }
}
```

**Error Responses:**

**400 - Invalid Phone Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "validationErrors": [
      {
        "field": "phoneNumber",
        "message": "Phone number must be in E.164 format (e.g., +15551234567)",
        "code": "INVALID_FORMAT"
      }
    ]
  }
}
```

**400 - Non-US Phone:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "Currently only US phone numbers are supported"
  }
}
```

**429 - Rate Limit:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

#### Send Verification Code
```
POST /api/v1/auth/send-verification-code
```
**Purpose:** Send SMS verification code to phone number

**Status Codes:**
- `200 OK` - Code sent successfully
- `400 Bad Request` - Invalid phone format or purpose
- `429 Too Many Requests` - Too many code requests (max 3 attempts)
- `500 Internal Server Error` - SMS service error

**Request:**
```json
{
  "phoneNumber": "+15551234567",
  "purpose": "registration"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "verificationId": "ver_abc123",
    "expiresIn": 600,
    "message": "Verification code sent"
  }
}
```

**Error Responses:**

**400 - Invalid Purpose:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid purpose. Must be 'registration', 'login', or 'password_reset'"
  }
}
```

**429 - Max Attempts Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "MAX_ATTEMPTS_EXCEEDED",
    "message": "Maximum verification code requests exceeded. Please try again later.",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

#### Verify Code
```
POST /api/v1/auth/verify-code
```
**Purpose:** Verify SMS code and get verification token

**Status Codes:**
- `200 OK` - Code verified successfully
- `400 Bad Request` - Invalid code or expired
- `404 Not Found` - Verification ID not found
- `429 Too Many Requests` - Too many verification attempts

**Request:**
```json
{
  "verificationId": "ver_abc123",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "verificationToken": "vt_xyz789",
    "expiresIn": 300
  }
}
```

**Error Responses:**

**400 - Invalid Code:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_VERIFICATION_CODE",
    "message": "Verification code is incorrect",
    "details": {
      "attemptsRemaining": 2
    }
  }
}
```

**400 - Code Expired:**
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_CODE_EXPIRED",
    "message": "Verification code has expired. Please request a new code."
  }
}
```

**404 - Verification Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Verification ID not found or already used"
  }
}
```

#### Register User
```
POST /api/v1/auth/register
```
**Purpose:** Create account with verified phone and password

**Status Codes:**
- `201 Created` - Account created successfully
- `400 Bad Request` - Invalid token, weak password, or validation error
- `409 Conflict` - Phone already registered
- `404 Not Found` - Verification token not found or expired

**Request:**
```json
{
  "verificationToken": "vt_xyz789",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "phone": "+15551234567",
      "accountStatus": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**

**400 - Weak Password:**
```json
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password does not meet requirements",
    "validationErrors": [
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter",
        "code": "MISSING_UPPERCASE"
      }
    ]
  }
}
```

**400 - Invalid Token:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_VERIFICATION_TOKEN",
    "message": "Verification token is invalid or expired"
  }
}
```

**409 - Phone Already Registered:**
```json
{
  "success": false,
  "error": {
    "code": "PHONE_ALREADY_REGISTERED",
    "message": "This phone number is already registered. Please log in."
  }
}
```

#### Login
```
POST /api/v1/auth/login
```
**Purpose:** Login with phone and password

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Validation error
- `429 Too Many Requests` - Too many login attempts

**Request:**
```json
{
  "phoneNumber": "+15551234567",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

**Error Responses:**

**401 - Invalid Credentials:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Phone number or password is incorrect"
  }
}
```

**401 - Account Locked:**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account is temporarily locked due to too many failed login attempts",
    "details": {
      "unlockAt": "2025-11-12T11:00:00Z"
    }
  }
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
```
**Purpose:** Get new access token using refresh token

**Status Codes:**
- `200 OK` - Token refreshed successfully
- `401 Unauthorized` - Invalid or expired refresh token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Refresh token is invalid or expired. Please log in again."
  }
}
```

#### Logout
```
POST /api/v1/auth/logout
```
**Purpose:** Invalidate tokens and logout user

**Status Codes:**
- `204 No Content` - Logout successful
- `401 Unauthorized` - Invalid token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Success Response (204):** No content

#### Forgot Password
```
POST /api/v1/auth/forgot-password
```
**Purpose:** Initiate password reset flow

**Status Codes:**
- `200 OK` - Reset code sent
- `404 Not Found` - Phone number not registered
- `429 Too Many Requests` - Too many reset requests

**Request:**
```json
{
  "phoneNumber": "+15551234567"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "resetId": "reset_abc123",
    "message": "Password reset code sent to your phone"
  }
}
```

#### Reset Password
```
POST /api/v1/auth/reset-password
```
**Purpose:** Reset password with reset token

**Status Codes:**
- `200 OK` - Password reset successful
- `400 Bad Request` - Invalid code or weak password
- `404 Not Found` - Reset ID not found

**Request:**
```json
{
  "resetId": "reset_abc123",
  "code": "123456",
  "newPassword": "NewPass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. Please log in with your new password."
  }
}
```

---

## 2. Quote Request Flow (Steps 1-5)

### 2.1 Step 1: Insurance Needs

#### Create Quote Request
```
POST /api/v1/quotes
```
**Purpose:** Create new quote request (Step 1 - Insurance Needs)

**Status Codes:**
- `201 Created` - Quote request created successfully
- `400 Bad Request` - Invalid request type or insurance type
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

**Request:**
```json
{
  "requestType": "new_coverage", // or "renewal"
  "insuranceType": "commercial", // or "personal"
  "sessionId": "session_abc123" // Optional: for unauthenticated users
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "sessionId": "session_abc123",
    "status": "draft",
    "step": 1,
    "requestType": "new_coverage",
    "insuranceType": "commercial",
    "createdAt": "2025-11-12T10:30:00Z"
  }
}
```

**Error Responses:**

**400 - Invalid Request Type:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid requestType. Must be 'new_coverage' or 'renewal'"
  }
}
```

### 2.2 Step 2: Business Basics

#### Update Quote Request
```
PUT /api/v1/quotes/:id
```
**Purpose:** Update quote request with business information (Step 2)

**Status Codes:**
- `200 OK` - Quote request updated successfully
- `400 Bad Request` - Invalid data or quote already submitted
- `404 Not Found` - Quote request not found
- `422 Unprocessable Entity` - Validation error
- `403 Forbidden` - Not authorized to update this quote request

**Request:**
```json
{
  "businessInfo": {
    "legalBusinessName": "Acme Tech Solutions LLC",
    "dba": "Acme Tech",
    "legalStructure": "LLC",
    "website": "https://acmetech.com",
    "industry": "Technology Consulting",
    "industryCode": "541512",
    "businessDescription": "We provide technology consulting services...",
    "fein": "12-3456789",
    "yearStarted": 2020,
    "yearsUnderCurrentOwnership": 3
  },
  "address": {
    "type": "physical", // or "virtual"
    "streetAddress": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102"
  },
  "contact": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@acmetech.com",
    "phone": "+15551234567"
  },
  "additionalInfo": {
    "hasSubsidiaries": false,
    "hasForeignSubsidiaries": false,
    "multipleEntities": false
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "step": 2,
    "status": "draft",
    "businessInfo": { ... },
    "updatedAt": "2025-11-12T10:35:00Z"
  }
}
```

**Error Responses:**

**400 - Quote Already Submitted:**
```json
{
  "success": false,
  "error": {
    "code": "QUOTE_ALREADY_SUBMITTED",
    "message": "Cannot update quote request that has already been submitted"
  }
}
```

**404 - Quote Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Quote request not found"
  }
}
```

#### Upload Business Document
```
POST /api/v1/document-parsing/upload
```
**Purpose:** Upload business document for AI parsing (Step 2 - optional)

**Status Codes:**
- `200 OK` - Document uploaded and parsed successfully
- `400 Bad Request` - Invalid file or missing file
- `413 Payload Too Large` - File exceeds 5MB limit
- `415 Unsupported Media Type` - Invalid file format (only PDF supported)
- `500 Internal Server Error` - Upload or parsing failed

**Request:** `multipart/form-data`
```
file: <PDF/Image file>
quoteRequestId: "quote_req_123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_123",
    "extractedData": {
      "legalBusinessName": "Acme Tech Solutions LLC",
      "businessAddress": { ... },
      "firstName": "John",
      "confidence": 0.95,
      "fields": [
        {
          "field": "legalBusinessName",
          "value": "Acme Tech Solutions LLC",
          "confidence": 0.98,
          "needsReview": false
        }
      ]
    },
    "fileUrl": "https://s3.../doc_123.pdf"
  }
}
```

#### Parse Document (DEC Page)
```
POST /api/v1/document-parsing/parse-dec-page
```
**Purpose:** Parse uploaded document and extract business information

**Status Codes:**
- `200 OK` - Document parsed successfully
- `400 Bad Request` - Missing file or invalid file
- `413 Payload Too Large` - File exceeds 5MB limit
- `415 Unsupported Media Type` - Invalid file format
- `500 Internal Server Error` - Parsing failed

**Request:** `multipart/form-data`
```
file: <PDF file>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "fileName": "test-document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024,
      "confidence": 0.95,
      "parsedAt": "2025-11-12T10:40:00Z"
    },
    "legalBusinessName": "Acme Tech Solutions LLC",
    "businessAddress": { ... },
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

**Error Responses:**

**413 - File Too Large:**
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

**415 - Unsupported File Type:**
```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "Only PDF files are supported"
  }
}
```

### 2.3 Step 3: Business Details

#### Update Financial Information
```
PUT /api/v1/quotes/:id
```
**Purpose:** Update quote request with financial details (Step 3)

**Request:**
```json
{
  "financialInfo": {
    "revenue2024": 500000,
    "expenses2024": 300000,
    "estimatedRevenue2025": 600000,
    "estimatedExpenses2025": 350000,
    "fullTimeEmployees": 5,
    "partTimeEmployees": 2,
    "totalPayroll": 250000,
    "contractorPayrollPercentage": 20
  },
  "riskInfo": {
    "hasExistingCoverage": false,
    "hasClaimsLast3Years": false,
    "claimsDescription": null
  }
}
```

### 2.4 Step 4: Coverage Selection

#### Select Coverages
```
POST /api/v1/quotes/:id/coverages
```
**Purpose:** Select coverage types for quote request (Step 4)

**Request:**
```json
{
  "selectedCoverages": [
    "general_liability",
    "professional_liability",
    "cyber_liability"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "selectedCoverages": [
      {
        "type": "general_liability",
        "name": "General Liability",
        "recommended": true,
        "required": false
      },
      {
        "type": "professional_liability",
        "name": "Professional Liability (E&O)",
        "recommended": true,
        "required": false
      },
      {
        "type": "cyber_liability",
        "name": "Cyber Liability",
        "recommended": false,
        "required": false
      }
    ],
    "step": 4
  }
}
```

#### Get Available Coverages
```
GET /api/v1/coverages
```
**Purpose:** Get list of all available coverage types with descriptions

**Response:**
```json
{
  "success": true,
  "data": {
    "coverages": [
      {
        "type": "general_liability",
        "name": "General Liability",
        "description": "Protects against claims of bodily injury...",
        "icon": "shield",
        "commonLimits": [500000, 1000000, 2000000]
      },
      ...
    ]
  }
}
```

### 2.5 Step 5: Review & Submit

#### Update Final Details
```
PUT /api/v1/quotes/:id
```
**Purpose:** Add final comments and confirmations (Step 5)

**Request:**
```json
{
  "additionalComments": "Please note our special requirements...",
  "confirmations": {
    "informationAccurate": true,
    "consentToCommunication": true,
    "privacyPolicyAccepted": true
  }
}
```

#### Submit Quote Request
```
POST /api/v1/quotes/:id/submit
```
**Purpose:** Submit quote request and trigger quote generation

**Status Codes:**
- `201 Created` - Quote request submitted successfully
- `400 Bad Request` - Quote already submitted or incomplete data
- `404 Not Found` - Quote request not found
- `422 Unprocessable Entity` - Missing required fields
- `500 Internal Server Error` - Failed to submit

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "status": "processing", // or "submitted"
    "submittedAt": "2025-11-12T10:45:00Z",
    "estimatedCompletionTime": "2025-11-12T14:45:00Z",
    "message": "Your quote request has been submitted. We'll notify you when quotes are ready."
  }
}
```

#### Get Quote Request by Session
```
GET /api/v1/quotes/session/:sessionId
```
**Purpose:** Retrieve quote request for unauthenticated users (using session ID)

---

## 3. Dashboard

### 3.1 Dashboard Overview

#### Get Dashboard Data
```
GET /api/v1/dashboard
```
**Purpose:** Get all dashboard data (quotes, policies, notifications, activity)

**Status Codes:**
- `200 OK` - Dashboard data retrieved successfully
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+15551234567"
    },
    "quoteRequests": [
      {
        "id": "quote_req_123",
        "status": "processing",
        "progress": 65,
        "submittedAt": "2025-11-12T10:30:00Z",
        "estimatedCompletion": "2025-11-12T14:30:00Z",
        "coverageTypes": ["general_liability", "professional_liability"],
        "businessName": "Acme Tech Solutions LLC"
      },
      {
        "id": "quote_req_456",
        "status": "ready",
        "quotesCount": 9,
        "carriersCount": 4,
        "lowestPrice": 110,
        "lowestPriceAnnual": 1250,
        "validUntil": "2025-12-12T10:30:00Z"
      }
    ],
    "policies": [
      {
        "id": "policy_123",
        "policyNumber": "CLR-2025-001234",
        "coverageType": "general_liability",
        "carrier": "Reliable Insurance Co.",
        "status": "active",
        "effectiveDate": "2025-12-01",
        "expirationDate": "2026-12-01",
        "daysRemaining": 362,
        "premium": {
          "annual": 1250,
          "monthly": 110,
          "nextPaymentDate": "2025-12-01"
        }
      }
    ],
    "notifications": [
      {
        "id": "notif_123",
        "type": "quote_ready",
        "title": "Your quotes are ready!",
        "message": "9 quotes from 4 carriers are ready for review",
        "read": false,
        "createdAt": "2025-11-12T14:15:00Z",
        "actionUrl": "/quotes/quote_req_456"
      }
    ],
    "recentActivity": [
      {
        "id": "activity_123",
        "type": "quote_submitted",
        "description": "Quote request submitted for business insurance",
        "timestamp": "2025-11-12T10:30:00Z"
      }
    ],
    "quickStats": {
      "activePolicies": 3,
      "totalAnnualPremium": 4550,
      "upcomingRenewals": 1,
      "pendingQuotes": 1
    }
  }
}
```

### 3.2 Quote Processing Status

#### Get Quote Request Status
```
GET /api/v1/quotes/:id/status
```
**Purpose:** Get real-time status of quote processing

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "status": "processing",
    "progress": 65,
    "currentStep": "comparing_quotes",
    "steps": [
      {
        "step": "data_review",
        "status": "completed",
        "completedAt": "2025-11-12T10:31:00Z"
      },
      {
        "step": "carrier_selection",
        "status": "completed",
        "completedAt": "2025-11-12T10:35:00Z"
      },
      {
        "step": "comparing_quotes",
        "status": "in_progress",
        "startedAt": "2025-11-12T10:40:00Z"
      },
      {
        "step": "finalizing",
        "status": "pending"
      }
    ],
    "estimatedCompletionTime": "2025-11-12T14:30:00Z"
  }
}
```

---

## 4. Quote Management & Comparison

### 4.1 My Quotes List

#### Get User's Quote Requests
```
GET /api/v1/quotes
```
**Purpose:** Get all quote requests for authenticated user

**Query Parameters:**
- `status`: filter by status (draft, submitted, processing, ready, expired)
- `page`: page number (default: 1)
- `limit`: items per page (default: 20)
- `sort`: sort field (default: createdAt:desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "quoteRequests": [
      {
        "id": "quote_req_123",
        "status": "ready",
        "businessName": "Acme Tech Solutions LLC",
        "coverageTypes": ["general_liability", "professional_liability"],
        "quotesCount": 9,
        "carriersCount": 4,
        "lowestPrice": 110,
        "lowestPriceAnnual": 1250,
        "requestedAt": "2025-11-12T10:30:00Z",
        "completedAt": "2025-11-12T14:15:00Z",
        "validUntil": "2025-12-12T14:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 4.2 Quote Detail View

#### Get Quote Request with Quotes
```
GET /api/v1/quotes/:id
```
**Purpose:** Get full quote request with all carrier quotes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote_req_123",
    "status": "ready",
    "businessInfo": { ... },
    "selectedCoverages": ["general_liability", "professional_liability"],
    "quotes": [
      {
        "id": "quote_123",
        "carrierQuoteId": "carrier_quote_123",
        "carrier": {
          "id": "carrier_1",
          "name": "Reliable Insurance Co.",
          "code": "reliable_insurance",
          "rating": "A+",
          "logoUrl": "https://..."
        },
        "coverageType": "general_liability",
        "status": "quoted",
        "premium": {
          "annual": 1250,
          "monthly": 110,
          "quarterly": 325,
          "paymentInFullDiscount": 50
        },
        "coverageLimits": {
          "perOccurrence": 1000000,
          "aggregate": 2000000
        },
        "deductible": 500,
        "effectiveDate": "2025-12-01",
        "expirationDate": "2026-12-01",
        "highlights": [
          "Coverage for bodily injury and property damage",
          "Legal defense costs covered"
        ],
        "exclusions": ["Pollution", "Professional services"],
        "recommended": true,
        "recommendationReason": "Best value for your business size and industry",
        "validUntil": "2025-12-15T00:00:00Z"
      }
    ],
    "packageDiscount": {
      "percentage": 3,
      "amount": 137,
      "applied": true
    }
  }
}
```

### 4.3 Quote Comparison

#### Compare Selected Quotes
```
POST /api/v1/quotes/compare
```
**Purpose:** Get side-by-side comparison of selected quotes

**Request:**
```json
{
  "quoteIds": ["quote_123", "quote_456", "quote_789"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "id": "quote_123",
        "carrier": "Reliable Insurance Co.",
        "premium": { "annual": 1250, "monthly": 110 },
        "coverageLimits": { ... },
        "deductible": 500,
        "highlights": { ... }
      }
    ],
    "comparison": {
      "lowestPrice": "quote_123",
      "bestValue": "quote_123",
      "mostCoverage": "quote_456"
    }
  }
}
```

#### Export Quotes to PDF
```
GET /api/v1/quotes/:id/export
```
**Purpose:** Generate PDF summary of all quotes

**Query Parameters:**
- `format`: pdf (default)

**Response:** PDF file download

---

## 5. Purchase Flow

### 5.1 Quote Selection

#### Select Quotes for Purchase
```
POST /api/v1/policies/select-quotes
```
**Purpose:** Select quotes to purchase (before payment)

**Request:**
```json
{
  "quoteIds": ["quote_123", "quote_456"],
  "paymentPlan": "monthly" // or "annual", "quarterly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "selectedQuotes": [ ... ],
    "totalPremium": {
      "annual": 3100,
      "monthly": 275,
      "quarterly": 800
    },
    "discounts": {
      "packageDiscount": 93,
      "paymentInFullDiscount": 50
    },
    "finalTotal": {
      "annual": 2957,
      "monthly": 275,
      "quarterly": 800
    },
    "purchaseId": "purchase_123"
  }
}
```

### 5.2 Payment

#### Create Payment Intent
```
POST /api/v1/payments/create-intent
```
**Purpose:** Create Stripe payment intent

**Request:**
```json
{
  "purchaseId": "purchase_123",
  "paymentPlan": "monthly",
  "paymentMethod": "card", // or "ach"
  "amount": 275
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

#### Confirm Payment
```
POST /api/v1/payments/confirm
```
**Purpose:** Confirm payment and proceed to binding

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "purchaseId": "purchase_123"
}
```

### 5.3 Policy Binding

#### Bind Policy
```
POST /api/v1/policies/bind
```
**Purpose:** Bind selected quote to create policy

**Status Codes:**
- `201 Created` - Policy bound successfully
- `400 Bad Request` - Invalid quote, quote expired, or missing required fields
- `404 Not Found` - Quote not found
- `402 Payment Required` - Payment failed
- `500 Internal Server Error` - Binding failed (carrier API error)
- `503 Service Unavailable` - Carrier API unavailable

**Request:**
```json
{
  "quoteId": "quote_123",
  "paymentPlan": "monthly",
  "paymentMethodId": "pm_xxx",
  "paymentInfo": {
    "method": "credit_card",
    "token": "tok_xxx",
    "billingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    }
  },
  "insuredInfo": {
    "primaryContact": {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john@acmetech.com",
      "phone": "+15551234567"
    }
  },
  "signature": {
    "fullName": "John Smith",
    "signedAt": "2025-11-12T15:00:00Z",
    "ipAddress": "127.0.0.1"
  },
  "termsAccepted": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "policy": {
      "id": "policy_123",
      "policyNumber": "CLR-2025-001234",
      "status": "active",
      "effectiveDate": "2025-12-01",
      "expirationDate": "2026-12-01",
      "carrier": { ... },
      "coverageType": "general_liability",
      "premium": {
        "annual": 1250,
        "monthly": 110
      },
      "documents": {
        "policyUrl": "https://s3.../policy.pdf",
        "declarationsUrl": "https://s3.../declarations.pdf",
        "certificateUrl": "https://s3.../certificate.pdf"
      }
    },
    "payment": {
      "id": "payment_123",
      "status": "succeeded",
      "amount": 110,
      "nextPaymentDate": "2025-12-01"
    }
  }
}
```

**Error Responses:**

**400 - Quote Expired:**
```json
{
  "success": false,
  "error": {
    "code": "QUOTE_EXPIRED",
    "message": "Quote has expired. Please request a new quote."
  }
}
```

**402 - Payment Failed:**
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment was declined. Please update your payment method."
  }
}
```

**503 - Carrier Unavailable:**
```json
{
  "success": false,
  "error": {
    "code": "CARRIER_UNAVAILABLE",
    "message": "Carrier API is temporarily unavailable. Please try again later."
  }
}
```

---

## 6. Policy Management

### 6.1 My Policies List

#### Get User's Policies
```
GET /api/v1/policies
```
**Purpose:** Get all policies for authenticated user

**Query Parameters:**
- `status`: filter by status (active, expiring_soon, expired, cancelled)
- `coverageType`: filter by coverage type
- `page`, `limit`, `sort`

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "policy_123",
        "policyNumber": "CLR-2025-001234",
        "carrier": {
          "name": "Reliable Insurance Co.",
          "code": "reliable_insurance",
          "rating": "A+"
        },
        "coverageType": "general_liability",
        "status": "active",
        "effectiveDate": "2025-12-01",
        "expirationDate": "2026-12-01",
        "daysRemaining": 362,
        "premium": {
          "annual": 1250,
          "monthly": 110,
          "paymentPlan": "monthly",
          "nextPaymentDate": "2025-12-01"
        },
        "coverageLimits": {
          "perOccurrence": 1000000,
          "aggregate": 2000000
        },
        "deductible": 500
      }
    ],
    "summary": {
      "totalPolicies": 3,
      "totalAnnualPremium": 4550,
      "totalMonthlyPayments": 405,
      "nextPaymentDue": "2025-12-01",
      "upcomingRenewals": 1
    },
    "pagination": { ... }
  }
}
```

### 6.2 Policy Detail

#### Get Policy Details
```
GET /api/v1/policies/:id
```
**Purpose:** Get full policy details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "policy_123",
    "policyNumber": "CLR-2025-001234",
    "carrier": { ... },
    "coverageType": "general_liability",
    "status": "active",
    "effectiveDate": "2025-12-01",
    "expirationDate": "2026-12-01",
    "premium": { ... },
    "coverageLimits": { ... },
    "deductible": 500,
    "policyForm": "ISO CGL (2013)",
    "documents": {
      "policy": {
        "url": "https://s3.../policy.pdf",
        "size": 2456789,
        "uploadedAt": "2025-12-01T10:00:00Z"
      },
      "declarations": { ... },
      "certificate": { ... }
    },
    "insuredInfo": {
      "businessName": "Acme Tech Solutions LLC",
      "address": { ... },
      "contact": { ... }
    },
    "paymentInfo": {
      "method": "credit_card",
      "last4": "4242",
      "nextPaymentDate": "2025-12-01",
      "autoRenewal": true
    },
    "renewalInfo": {
      "renewalAvailable": false,
      "renewalDate": "2026-11-01",
      "renewalQuote": null
    }
  }
}
```

### 6.3 Certificate of Insurance (COI)

#### Generate Certificate
```
POST /api/v1/policies/:id/certificate
```
**Purpose:** Generate certificate of insurance

**Request:**
```json
{
  "certificateHolder": {
    "name": "ABC Corp",
    "address": {
      "street": "456 Client St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94103"
    }
  },
  "options": {
    "addAsAdditionalInsured": true,
    "waiverOfSubrogation": false,
    "primaryAndNonContributory": false
  },
  "descriptionOfOperations": "General contractor services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": "coi_123",
    "url": "https://s3.../coi_123.pdf",
    "expiresAt": "2026-12-01",
    "downloadUrl": "https://..."
  }
}
```

#### Get Certificates
```
GET /api/v1/policies/:id/certificates
```
**Purpose:** Get all certificates for a policy

### 6.4 Policy Modifications

#### Request Policy Change
```
POST /api/v1/policies/:id/endorsements
```
**Purpose:** Request policy modification/endorsement

**Request:**
```json
{
  "type": "add_location",
  "description": "Add new office location",
  "details": {
    "newLocation": {
      "address": "789 New St",
      "city": "Oakland",
      "state": "CA",
      "zip": "94601"
    }
  }
}
```

#### Get Policy Endorsements
```
GET /api/v1/policies/:id/endorsements
```
**Purpose:** Get all endorsements for a policy

### 6.5 Policy Renewal

#### Get Renewal Quote
```
GET /api/v1/policies/:id/renewal
```
**Purpose:** Get renewal quote for expiring policy

#### Renew Policy
```
POST /api/v1/policies/:id/renew
```
**Purpose:** Renew existing policy

**Request:**
```json
{
  "renewalQuoteId": "quote_789",
  "paymentPlan": "monthly",
  "autoRenewal": true
}
```

#### Cancel Policy
```
POST /api/v1/policies/:id/cancel
```
**Purpose:** Cancel active policy

**Request:**
```json
{
  "reason": "business_closed",
  "effectiveDate": "2025-12-31",
  "comments": "Business is closing"
}
```

---

## 7. Document Management

### 7.1 Document List

#### Get User's Documents
```
GET /api/v1/documents
```
**Purpose:** Get all documents for user

**Query Parameters:**
- `type`: filter by type (policy, certificate, quote, endorsement)
- `policyId`: filter by policy
- `page`, `limit`, `sort`

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "type": "policy",
        "name": "General Liability Policy",
        "policyId": "policy_123",
        "policyNumber": "CLR-2025-001234",
        "fileUrl": "https://s3.../policy.pdf",
        "size": 2456789,
        "format": "pdf",
        "uploadedAt": "2025-12-01T10:00:00Z",
        "metadata": {
          "coverageType": "general_liability",
          "effectiveDate": "2025-12-01"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

### 7.2 Document Operations

#### Upload Document
```
POST /api/v1/documents/upload
```
**Purpose:** Upload new document

**Request:** `multipart/form-data`
```
file: <file>
type: "custom"
policyId: "policy_123" (optional)
description: "Additional document"
```

#### Get Document
```
GET /api/v1/documents/:id
```
**Purpose:** Get document details and download URL

#### Download Document
```
GET /api/v1/documents/:id/download
```
**Purpose:** Get signed download URL for document

#### Share Document
```
POST /api/v1/documents/:id/share
```
**Purpose:** Generate shareable link for document

**Request:**
```json
{
  "expiresIn": 604800, // seconds (7 days)
  "passwordProtected": false,
  "password": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareLink": "https://clarence.com/share/abc123",
    "expiresAt": "2025-11-19T10:00:00Z"
  }
}
```

#### Delete Document
```
DELETE /api/v1/documents/:id
```
**Purpose:** Delete document

---

## 8. AI Chat Support

### 8.1 Chat Messages

#### Send Chat Message
```
POST /api/v1/chat/messages
```
**Purpose:** Send message to Clarence AI

**Request:**
```json
{
  "message": "What does my general liability cover?",
  "context": {
    "policyId": "policy_123", // optional
    "quoteId": "quote_123" // optional
  }
}
```

**Response (Streaming):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "response": "Your General Liability policy (CLR-2025-001234) covers...",
    "citations": [
      {
        "policyId": "policy_123",
        "section": "Section A, Page 3",
        "url": "https://..."
      }
    ],
    "suggestedActions": [
      {
        "type": "generate_certificate",
        "label": "Generate Certificate",
        "action": "/policies/policy_123/certificate"
      }
    ]
  }
}
```

#### Get Chat History
```
GET /api/v1/chat/history
```
**Purpose:** Get chat conversation history

**Query Parameters:**
- `policyId`: filter by policy
- `limit`: number of messages (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "role": "user",
        "content": "What does my general liability cover?",
        "timestamp": "2025-11-12T15:00:00Z"
      },
      {
        "id": "msg_124",
        "role": "assistant",
        "content": "Your General Liability policy covers...",
        "citations": [ ... ],
        "timestamp": "2025-11-12T15:00:01Z"
      }
    ]
  }
}
```

#### Delete Chat History
```
DELETE /api/v1/chat/history
```
**Purpose:** Clear chat history

---

## 9. Settings & Profile

### 9.1 Profile Management

#### Get User Profile
```
GET /api/v1/users/profile
```
**Purpose:** Get current user's profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "phone": "+15551234567",
    "email": "john@acmetech.com",
    "firstName": "John",
    "lastName": "Smith",
    "profilePhoto": "https://...",
    "businessInfo": {
      "legalBusinessName": "Acme Tech Solutions LLC",
      "address": { ... }
    },
    "preferences": {
      "notifications": { ... },
      "language": "en",
      "timezone": "America/Los_Angeles"
    }
  }
}
```

#### Update Profile
```
PUT /api/v1/users/profile
```
**Purpose:** Update user profile

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@acmetech.com",
  "jobTitle": "CEO",
  "businessInfo": {
    "legalBusinessName": "Acme Tech Solutions LLC",
    "address": { ... }
  }
}
```

#### Upload Profile Photo
```
POST /api/v1/users/profile/photo
```
**Purpose:** Upload profile photo

**Request:** `multipart/form-data`
```
file: <image file>
```

### 9.2 Security Settings

#### Change Password
```
POST /api/v1/users/change-password
```
**Purpose:** Change user password

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

#### Enable 2FA
```
POST /api/v1/users/2fa/enable
```
**Purpose:** Enable two-factor authentication

#### Disable 2FA
```
POST /api/v1/users/2fa/disable
```
**Purpose:** Disable two-factor authentication

#### Get Active Sessions
```
GET /api/v1/users/sessions
```
**Purpose:** Get all active sessions

#### Revoke Session
```
DELETE /api/v1/users/sessions/:sessionId
```
**Purpose:** Revoke specific session

#### Revoke All Sessions
```
DELETE /api/v1/users/sessions
```
**Purpose:** Revoke all sessions except current

### 9.3 Notification Preferences

#### Get Notification Preferences
```
GET /api/v1/users/notifications/preferences
```
**Purpose:** Get notification preferences

**Response:**
```json
{
  "success": true,
  "data": {
    "email": {
      "quoteUpdates": true,
      "policyRenewals": true,
      "paymentReminders": true,
      "claimsUpdates": true,
      "marketingEmails": false,
      "weeklySummary": true
    },
    "sms": {
      "criticalAlertsOnly": true,
      "allNotifications": false
    },
    "push": {
      "enabled": true,
      "quoteUpdates": true,
      "policyReminders": true,
      "paymentAlerts": true,
      "chatMessages": true
    }
  }
}
```

#### Update Notification Preferences
```
PUT /api/v1/users/notifications/preferences
```
**Purpose:** Update notification preferences

**Request:**
```json
{
  "email": {
    "quoteUpdates": true,
    "marketingEmails": false
  },
  "sms": {
    "criticalAlertsOnly": true
  }
}
```

---

## 10. Help Center

### 10.1 Help Articles

#### Search Help Articles
```
GET /api/v1/help/search
```
**Purpose:** Search help articles

**Query Parameters:**
- `q`: search query
- `category`: filter by category
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "article_123",
        "title": "How to Request an Insurance Quote",
        "category": "getting_started",
        "excerpt": "Getting an insurance quote with Clarence is simple...",
        "views": 1234,
        "readTime": 5
      }
    ],
    "pagination": { ... }
  }
}
```

#### Get Help Article
```
GET /api/v1/help/articles/:id
```
**Purpose:** Get full help article

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "article_123",
    "title": "How to Request an Insurance Quote",
    "category": "getting_started",
    "content": "<html>...</html>",
    "views": 1234,
    "readTime": 5,
    "relatedArticles": [ ... ],
    "helpful": {
      "yes": 234,
      "no": 12
    }
  }
}
```

#### Get Help Categories
```
GET /api/v1/help/categories
```
**Purpose:** Get all help categories

#### Submit Article Feedback
```
POST /api/v1/help/articles/:id/feedback
```
**Purpose:** Submit helpful/not helpful feedback

**Request:**
```json
{
  "helpful": true,
  "comment": "Very helpful!"
}
```

### 10.2 Contact Support

#### Schedule Call
```
POST /api/v1/support/schedule-call
```
**Purpose:** Schedule callback with support

**Request:**
```json
{
  "preferredDate": "2025-11-15",
  "preferredTime": "14:00",
  "timezone": "America/Los_Angeles",
  "reason": "policy_question",
  "phoneNumber": "+15551234567"
}
```

#### Send Support Email
```
POST /api/v1/support/email
```
**Purpose:** Send email to support

**Request:**
```json
{
  "subject": "Question about my policy",
  "message": "I have a question about...",
  "policyId": "policy_123" // optional
}
```

---

## 11. Notifications

### 11.1 Get Notifications

#### Get User Notifications
```
GET /api/v1/notifications
```
**Purpose:** Get all notifications for user

**Query Parameters:**
- `read`: filter by read status (true/false)
- `type`: filter by type
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "quote_ready",
        "title": "Your quotes are ready!",
        "message": "9 quotes from 4 carriers are ready for review",
        "read": false,
        "actionUrl": "/quotes/quote_req_456",
        "createdAt": "2025-11-12T14:15:00Z"
      }
    ],
    "unreadCount": 3,
    "pagination": { ... }
  }
}
```

#### Mark Notification as Read
```
PUT /api/v1/notifications/:id/read
```
**Purpose:** Mark notification as read

#### Mark All as Read
```
PUT /api/v1/notifications/read-all
```
**Purpose:** Mark all notifications as read

#### Delete Notification
```
DELETE /api/v1/notifications/:id
```
**Purpose:** Delete notification

---

## 12. Payment & Billing

### 12.1 Payment Methods

#### Get Payment Methods
```
GET /api/v1/payments/methods
```
**Purpose:** Get all saved payment methods

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "pm_123",
        "type": "card",
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2027,
        "isDefault": true
      },
      {
        "id": "pm_456",
        "type": "ach",
        "bankName": "Chase Bank",
        "last4": "6789",
        "accountType": "checking",
        "isDefault": false
      }
    ]
  }
}
```

#### Add Payment Method
```
POST /api/v1/payments/methods
```
**Purpose:** Add new payment method

**Request:**
```json
{
  "type": "card",
  "token": "tok_xxx", // from Stripe
  "isDefault": false
}
```

#### Update Payment Method
```
PUT /api/v1/payments/methods/:id
```
**Purpose:** Update payment method

#### Set Default Payment Method
```
PUT /api/v1/payments/methods/:id/default
```
**Purpose:** Set payment method as default

#### Delete Payment Method
```
DELETE /api/v1/payments/methods/:id
```
**Purpose:** Delete payment method

### 12.2 Payment History

#### Get Payment History
```
GET /api/v1/payments/history
```
**Purpose:** Get payment history

**Query Parameters:**
- `policyId`: filter by policy
- `status`: filter by status (succeeded, failed, pending)
- `startDate`, `endDate`: date range
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment_123",
        "policyId": "policy_123",
        "policyNumber": "CLR-2025-001234",
        "amount": 110,
        "status": "succeeded",
        "paymentMethod": {
          "type": "card",
          "last4": "4242"
        },
        "paidAt": "2025-11-01T10:00:00Z",
        "receiptUrl": "https://..."
      }
    ],
    "pagination": { ... }
  }
}
```

#### Get Payment Receipt
```
GET /api/v1/payments/:id/receipt
```
**Purpose:** Get payment receipt PDF

### 12.3 Make Payment

#### Make One-Time Payment
```
POST /api/v1/payments
```
**Purpose:** Make one-time payment for policy

**Request:**
```json
{
  "policyId": "policy_123",
  "amount": 110,
  "paymentMethodId": "pm_123"
}
```

#### Update Payment Plan
```
PUT /api/v1/policies/:id/payment-plan
```
**Purpose:** Change payment plan (monthly/quarterly/annual)

**Request:**
```json
{
  "paymentPlan": "annual",
  "paymentMethodId": "pm_123"
}
```

---

## 13. Renewal & Retention

### 13.1 Renewal Management

#### Get Upcoming Renewals
```
GET /api/v1/renewals
```
**Purpose:** Get all upcoming renewals

**Query Parameters:**
- `daysAhead`: filter by days until renewal (default: 90)
- `status`: filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "renewals": [
      {
        "id": "renewal_123",
        "policyId": "policy_123",
        "policyNumber": "CLR-2025-001234",
        "currentExpirationDate": "2026-12-01",
        "daysUntilRenewal": 45,
        "renewalQuote": {
          "id": "quote_789",
          "premium": {
            "annual": 1320,
            "monthly": 120
          },
          "change": {
            "amount": 70,
            "percentage": 5.6
          }
        },
        "status": "quote_available"
      }
    ]
  }
}
```

#### Get Renewal Recommendations
```
GET /api/v1/renewals/recommendations
```
**Purpose:** Get AI-powered renewal recommendations

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "policyId": "policy_123",
        "type": "coverage_gap",
        "title": "Your business has grown - let's review your coverage",
        "message": "We noticed your revenue increased 20%...",
        "suggestedAction": "review_coverage"
      }
    ]
  }
}
```

### 13.2 One-Click Renewal

#### One-Click Renewal
```
POST /api/v1/renewals/:id/one-click
```
**Purpose:** Renew policy with current coverage (one-click)

**Request:**
```json
{
  "paymentPlan": "monthly",
  "autoRenewal": true
}
```

---

## API Status Summary

### ✅ Implemented APIs
- Authentication (check-phone, send-verification-code, verify-code, register, login, refresh, logout)
- Quote Request Flow (create, update, select-coverages, submit, get by id/session)
- Policy Binding (bind)
- Carriers (list, health check)
- Document Parsing (upload, parse-dec-page)

### 🚧 APIs to Implement
- Dashboard endpoints
- Quote comparison endpoints
- Payment endpoints (create-intent, confirm, methods, history)
- Policy management (list, detail, certificates, endorsements, renew, cancel)
- Document management (list, upload, download, share, delete)
- AI Chat (messages, history)
- Settings & Profile (profile, 2FA, sessions, notifications)
- Help Center (search, articles, categories, feedback, support)
- Notifications (list, mark read, delete)
- Renewal management (renewals, recommendations, one-click)

---

## Implementation Priority

### Phase 1 (MVP - Critical)
1. Dashboard APIs
2. Quote comparison APIs
3. Policy list & detail APIs
4. Payment APIs (basic)
5. Document list & download APIs

### Phase 2 (Core Features)
1. Certificate generation APIs
2. Chat APIs
3. Notification APIs
4. Settings APIs
5. Payment method management

### Phase 3 (Enhanced Features)
1. Policy modifications/endorsements
2. Renewal management
3. Help center APIs
4. Advanced document management
5. Analytics/reporting APIs

---

## Complete Error Code Reference

### HTTP Status Codes Summary

| Status Code | Meaning | Common Scenarios |
|-------------|---------|------------------|
| **200 OK** | Success | GET, PUT, PATCH requests completed successfully |
| **201 Created** | Resource created | POST requests that create new resources |
| **204 No Content** | Success with no body | DELETE requests, logout |
| **400 Bad Request** | Invalid request | Validation errors, malformed data |
| **401 Unauthorized** | Authentication required | Missing/invalid token, expired token |
| **403 Forbidden** | Insufficient permissions | Valid token but no access to resource |
| **404 Not Found** | Resource doesn't exist | Invalid ID, resource deleted |
| **409 Conflict** | Resource conflict | Duplicate phone/email, resource already exists |
| **410 Gone** | Resource expired | Quote expired, token expired |
| **413 Payload Too Large** | File too large | Upload exceeds size limit |
| **415 Unsupported Media Type** | Invalid file type | Wrong file format |
| **422 Unprocessable Entity** | Validation failed | Field-level validation errors |
| **429 Too Many Requests** | Rate limit exceeded | Too many requests in time period |
| **500 Internal Server Error** | Server error | Unexpected server issues |
| **503 Service Unavailable** | Service down | Maintenance, external service unavailable |

### Error Codes by Category

#### Authentication Errors
- `UNAUTHORIZED` (401) - Missing or invalid authentication token
- `TOKEN_EXPIRED` (401) - Access token expired
- `INVALID_CREDENTIALS` (401) - Wrong phone/password
- `ACCOUNT_LOCKED` (401) - Account temporarily locked
- `INVALID_VERIFICATION_CODE` (400) - Wrong SMS code
- `VERIFICATION_CODE_EXPIRED` (400) - Code expired (10 minutes)
- `INVALID_VERIFICATION_TOKEN` (400) - Invalid verification token
- `PHONE_ALREADY_REGISTERED` (409) - Phone number in use
- `MAX_ATTEMPTS_EXCEEDED` (429) - Too many verification attempts

#### Validation Errors
- `VALIDATION_ERROR` (422) - Request validation failed
- `REQUIRED_FIELD` (422) - Missing required field
- `INVALID_FORMAT` (422) - Invalid field format
- `INVALID_EMAIL` (422) - Invalid email format
- `INVALID_PHONE_NUMBER` (400) - Invalid phone format
- `WEAK_PASSWORD` (400) - Password doesn't meet requirements
- `MIN_LENGTH` (422) - Field too short
- `MAX_LENGTH` (422) - Field too long
- `INVALID_DATE_RANGE` (400) - Invalid date parameters

#### Resource Errors
- `NOT_FOUND` (404) - Resource doesn't exist
- `DUPLICATE_RESOURCE` (409) - Resource already exists
- `RESOURCE_LOCKED` (423) - Resource being modified
- `QUOTE_EXPIRED` (410) - Quote no longer valid
- `POLICY_NOT_ACTIVE` (400) - Policy is inactive/cancelled
- `POLICY_ALREADY_CANCELLED` (400) - Policy already cancelled
- `RENEWAL_NOT_AVAILABLE` (400) - Renewal not ready yet

#### Payment Errors
- `PAYMENT_FAILED` (402) - Payment declined
- `INSUFFICIENT_FUNDS` (402) - Not enough funds
- `INVALID_PAYMENT_METHOD` (400) - Invalid payment method
- `PAYMENT_METHOD_EXPIRED` (400) - Card expired

#### File Upload Errors
- `DOCUMENT_TOO_LARGE` (413) - File exceeds size limit (5MB for documents, 10MB for others)
- `UNSUPPORTED_FILE_TYPE` (415) - Invalid file format
- `UPLOAD_FAILED` (500) - Upload service error

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- Check `Retry-After` header for wait time

#### Business Logic Errors
- `QUOTE_ALREADY_SUBMITTED` (400) - Quote request already submitted
- `QUOTE_NOT_READY` (400) - Quotes not yet generated
- `POLICY_BINDING_FAILED` (500) - Failed to bind policy with carrier
- `CARRIER_UNAVAILABLE` (503) - Carrier API unavailable

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName",  // Only for validation errors
    "details": {
      // Additional context (retryAfter, attemptsRemaining, etc.)
    },
    "validationErrors": [  // Only for 422 errors
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_EMAIL"
      }
    ]
  },
  "timestamp": "2025-11-12T10:30:00Z"
}
```

### Common Error Handling Patterns

#### 1. Validation Errors (422)
```typescript
if (response.status === 422) {
  const errors = response.error.validationErrors;
  errors.forEach(err => {
    // Display field-specific error
    setFieldError(err.field, err.message);
  });
}
```

#### 2. Authentication Errors (401)
```typescript
if (response.status === 401) {
  if (response.error.code === 'TOKEN_EXPIRED') {
    // Refresh token
    await refreshToken();
    // Retry request
  } else {
    // Redirect to login
    router.push('/login');
  }
}
```

#### 3. Rate Limiting (429)
```typescript
if (response.status === 429) {
  const retryAfter = response.error.details.retryAfter;
  // Show message: "Too many requests. Please try again in ${retryAfter} seconds"
  // Disable button for retryAfter seconds
}
```

#### 4. Not Found (404)
```typescript
if (response.status === 404) {
  // Show friendly message: "Resource not found"
  // Redirect to appropriate page
}
```

#### 5. Server Errors (500, 503)
```typescript
if (response.status >= 500) {
  // Show generic error: "Something went wrong. Please try again later."
  // Log error for debugging
  // Optionally retry with exponential backoff
}
```

---

## Notes for Frontend Engineers

1. **Authentication**: All endpoints except auth endpoints require `Authorization: Bearer <token>` header
2. **Error Handling**: Always check `success` field in response. Handle validation errors (422) with field-specific messages
3. **Pagination**: Use pagination for list endpoints to improve performance
4. **File Uploads**: Use `multipart/form-data` for document uploads
5. **Real-time Updates**: Consider WebSocket connections for quote processing status and notifications
6. **Caching**: Cache static data (coverages, carriers) to reduce API calls
7. **Rate Limiting**: Implement request throttling and respect `Retry-After` headers
8. **Session Management**: Store session ID for unauthenticated quote requests
9. **Status Codes**: Always check HTTP status code AND `success` field in response body
10. **Error Codes**: Use error codes for programmatic error handling (e.g., show different UI for different error types)

---

**Last Updated:** November 12, 2025  
**API Version:** v1  
**Base URL:** `http://localhost:3000/api/v1` (development)

