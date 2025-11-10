# API Specification - Clarence Insurance Platform

## Overview

This document outlines the REST API specifications for the Clarence platform, including both sandbox (simulated) and production endpoints.

**Base URL (Development):** `https://api-dev.joinclarence.com/v1`  
**Base URL (Production):** `https://api.joinclarence.com/v1`

**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`  
**Rate Limiting:** 100 requests/minute per user

---

## Authentication Endpoints

### POST /auth/register
Register a new user with phone number and password.

**Request Body:**
```json
{
  "phone": "+15551234567",
  "verification_code": "123456",
  "password": "SecurePass123!",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "quote_request_id": "temp_quote_12345"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "phone": "+15551234567",
    "email": "user@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "PHONE_ALREADY_REGISTERED",
    "message": "This phone number is already registered",
    "field": "phone"
  }
}
```

---

### POST /auth/send-verification
Send SMS verification code to phone number.

**Request Body:**
```json
{
  "phone": "+15551234567",
  "purpose": "registration"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Verification code sent",
    "expires_in": 600,
    "attempts_remaining": 3
  }
}
```

---

### POST /auth/login
Log in existing user.

**Request Body:**
```json
{
  "phone": "+15551234567",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

---

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

---

### POST /auth/forgot-password
Initiate password reset flow.

**Request Body:**
```json
{
  "phone": "+15551234567"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset code sent to your phone"
  }
}
```

---

### POST /auth/reset-password
Reset password with verification code.

**Request Body:**
```json
{
  "phone": "+15551234567",
  "verification_code": "123456",
  "new_password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

---

## Quote Request Endpoints

### POST /quote-requests
Create a new quote request (unauthenticated during 5-step flow).

**Request Body:**
```json
{
  "insurance_type": "commercial",
  "coverage_need": "new_coverage",
  "business_info": {
    "legal_name": "Acme Tech Solutions LLC",
    "dba_name": "Acme Tech",
    "legal_structure": "LLC",
    "website": "https://acmetech.com",
    "primary_industry": "Technology Consulting",
    "industry_code": "541512",
    "description": "We provide IT consulting and software development services to small businesses",
    "fein": "12-3456789",
    "year_started": 2018,
    "years_current_ownership": 5,
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102",
      "type": "physical"
    }
  },
  "financial_info": {
    "revenue_2024": 500000,
    "expenses_2024": 350000,
    "estimated_revenue_2025": 650000,
    "estimated_expenses_2025": 450000,
    "full_time_employees": 5,
    "part_time_employees": 2,
    "total_payroll": 400000,
    "independent_contractor_payroll_percentage": 20
  },
  "business_details": {
    "has_subsidiaries": false,
    "has_foreign_subsidiaries": false,
    "multiple_entities": false
  },
  "coverage_selections": [
    "general_liability",
    "professional_liability",
    "cyber_liability"
  ],
  "contact_info": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@acmetech.com",
    "phone": "+15551234567"
  },
  "additional_comments": "We handle sensitive client data and need robust cyber coverage",
  "consent": {
    "accuracy_confirmed": true,
    "communication_consent": true,
    "privacy_policy_agreed": true
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "quote_request_id": "qr_1234567890",
    "status": "pending",
    "created_at": "2025-11-06T10:30:00Z",
    "estimated_completion": "2025-11-06T14:30:00Z",
    "next_step": "registration",
    "registration_url": "/auth/register?quote_id=qr_1234567890"
  }
}
```

---

### POST /quote-requests/upload-document
Upload declaration page or business document for AI parsing.

**Content-Type:** `multipart/form-data`

**Request Body (form-data):**
```
file: [binary file data]
document_type: "declaration_page" | "business_license" | "other"
quote_request_id: "qr_1234567890" (optional)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_abc123",
    "file_name": "dec_page.pdf",
    "file_size": 524288,
    "status": "processing",
    "extraction_status": "in_progress",
    "estimated_completion": "2025-11-06T10:32:00Z"
  }
}
```

---

### GET /quote-requests/{quote_request_id}/document-extraction
Get extracted data from uploaded document.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_abc123",
    "extraction_status": "completed",
    "extracted_data": {
      "business_info": {
        "legal_name": "Acme Tech Solutions LLC",
        "address": {
          "street": "123 Main St",
          "city": "San Francisco",
          "state": "CA",
          "zip": "94102"
        },
        "confidence_score": 0.95
      },
      "coverage_info": {
        "current_coverages": ["general_liability", "workers_comp"],
        "current_limits": {
          "general_liability": {
            "per_occurrence": 1000000,
            "general_aggregate": 2000000
          }
        },
        "confidence_score": 0.92
      }
    },
    "fields_requiring_review": ["fein", "year_started"]
  }
}
```

---

### GET /quote-requests/{quote_request_id}
Get quote request details and status.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quote_request_id": "qr_1234567890",
    "status": "processing",
    "created_at": "2025-11-06T10:30:00Z",
    "updated_at": "2025-11-06T10:35:00Z",
    "estimated_completion": "2025-11-06T14:30:00Z",
    "progress": {
      "stage": "risk_assessment",
      "percentage": 45,
      "message": "Analyzing your business risk profile..."
    },
    "business_info": { /* full business info */ },
    "coverage_selections": ["general_liability", "professional_liability"],
    "quotes_generated": 0,
    "quotes_ready": false
  }
}
```

---

### GET /quote-requests
Get all quote requests for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, processing, completed, expired)
- `limit` (optional): Results per page (default: 10, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quote_requests": [
      {
        "quote_request_id": "qr_1234567890",
        "status": "completed",
        "created_at": "2025-11-06T10:30:00Z",
        "coverage_types": ["general_liability", "professional_liability"],
        "quotes_count": 8,
        "business_name": "Acme Tech Solutions LLC"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 10,
      "offset": 0,
      "has_more": false
    }
  }
}
```

---

## Sandbox Quote Generation Endpoints

### POST /sandbox/quotes/generate
Generate simulated insurance quotes (sandbox only).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "quote_request_id": "qr_1234567890",
  "coverage_types": ["general_liability", "professional_liability", "cyber_liability"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quote_batch_id": "qb_xyz789",
    "quote_request_id": "qr_1234567890",
    "total_quotes": 9,
    "quotes_by_coverage": {
      "general_liability": 3,
      "professional_liability": 3,
      "cyber_liability": 3
    },
    "generation_time_ms": 3420,
    "ready_at": "2025-11-06T10:35:20Z"
  }
}
```

---

### GET /quotes
Get all quotes for a quote request.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `quote_request_id` (required): Quote request ID
- `coverage_type` (optional): Filter by coverage type
- `sort_by` (optional): Sort by `premium_asc`, `premium_desc`, `recommended` (default)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "quote_id": "qt_abc123",
        "quote_request_id": "qr_1234567890",
        "carrier": {
          "id": "carrier_sim_001",
          "name": "Reliable Insurance Co. (Simulated)",
          "logo_url": "https://cdn.clarence.com/carriers/reliable.png",
          "rating": "A+ (AM Best)"
        },
        "coverage_type": "general_liability",
        "coverage_limits": {
          "per_occurrence": 1000000,
          "general_aggregate": 2000000,
          "products_operations_aggregate": 2000000,
          "personal_advertising_injury": 1000000,
          "medical_expense": 5000
        },
        "premium": {
          "annual": 1250.00,
          "monthly": 110.00,
          "quarterly": 325.00,
          "payment_discount_full": 50.00
        },
        "deductible": 500,
        "effective_date": "2025-12-01",
        "expiration_date": "2026-12-01",
        "highlights": [
          "Coverage for bodily injury and property damage",
          "Legal defense costs covered",
          "Medical payments up to $5,000",
          "Products and completed operations included",
          "Contractual liability coverage"
        ],
        "exclusions": [
          "Professional services (covered by E&O)",
          "Pollution liability",
          "Employee injuries (covered by Workers Comp)",
          "Auto liability (requires separate policy)"
        ],
        "additional_features": [
          "Waiver of subrogation available",
          "Additional insured endorsements included",
          "30-day notice of cancellation"
        ],
        "recommendation": {
          "is_recommended": true,
          "reason": "Best value for your business size and industry",
          "confidence_score": 0.88
        },
        "valid_until": "2025-11-20T10:30:00Z",
        "created_at": "2025-11-06T10:35:20Z"
      },
      {
        "quote_id": "qt_def456",
        "carrier": {
          "id": "carrier_sim_002",
          "name": "Premier Underwriters (Simulated)",
          "logo_url": "https://cdn.clarence.com/carriers/premier.png",
          "rating": "A (AM Best)"
        },
        "coverage_type": "general_liability",
        "coverage_limits": {
          "per_occurrence": 1000000,
          "general_aggregate": 2000000,
          "products_operations_aggregate": 2000000,
          "personal_advertising_injury": 1000000,
          "medical_expense": 5000
        },
        "premium": {
          "annual": 1380.00,
          "monthly": 120.00,
          "quarterly": 355.00,
          "payment_discount_full": 60.00
        },
        "deductible": 1000,
        "effective_date": "2025-12-01",
        "expiration_date": "2026-12-01",
        "highlights": [
          "Enhanced coverage limits available",
          "24/7 claims support",
          "Risk management resources included"
        ],
        "exclusions": [
          "Professional services",
          "Cyber incidents",
          "Employment practices"
        ],
        "additional_features": [
          "Blanket additional insured",
          "Primary and non-contributory endorsement",
          "Annual policy review included"
        ],
        "recommendation": {
          "is_recommended": false,
          "reason": "Higher premium for similar coverage",
          "confidence_score": 0.65
        },
        "valid_until": "2025-11-20T10:30:00Z",
        "created_at": "2025-11-06T10:35:20Z"
      }
    ],
    "quote_summary": {
      "total_quotes": 9,
      "coverage_types": ["general_liability", "professional_liability", "cyber_liability"],
      "price_range": {
        "lowest_annual": 1250.00,
        "highest_annual": 2800.00
      },
      "recommended_package": {
        "total_annual_premium": 4950.00,
        "coverage_count": 3,
        "potential_savings": 150.00
      }
    }
  }
}
```

---

### GET /quotes/{quote_id}
Get detailed information for a specific quote.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quote_id": "qt_abc123",
    /* Full quote details as shown above */
    "detailed_coverage": {
      "coverage_parts": [
        {
          "name": "Bodily Injury and Property Damage Liability",
          "limit": "$1,000,000 per occurrence",
          "description": "Covers claims for injuries or property damage caused by your business operations"
        },
        {
          "name": "Personal and Advertising Injury Liability",
          "limit": "$1,000,000",
          "description": "Covers claims for libel, slander, copyright infringement, etc."
        }
      ],
      "optional_coverages": [
        {
          "name": "Hired and Non-Owned Auto",
          "additional_premium": 125.00,
          "description": "Covers autos you rent, lease, hire, or borrow"
        }
      ]
    }
  }
}
```

---

## Quote Selection & Purchase Endpoints

### POST /quotes/select
Select quotes for purchase.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "quote_ids": ["qt_abc123", "qt_ghi789", "qt_jkl012"],
  "customizations": {
    "qt_abc123": {
      "coverage_limits": {
        "per_occurrence": 2000000,
        "general_aggregate": 4000000
      },
      "deductible": 1000
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "selection_id": "sel_xyz789",
    "selected_quotes": [
      {
        "quote_id": "qt_abc123",
        "coverage_type": "general_liability",
        "premium": {
          "annual": 1650.00,
          "monthly": 145.00
        },
        "customized": true
      },
      {
        "quote_id": "qt_ghi789",
        "coverage_type": "professional_liability",
        "premium": {
          "annual": 1850.00,
          "monthly": 162.00
        },
        "customized": false
      },
      {
        "quote_id": "qt_jkl012",
        "coverage_type": "cyber_liability",
        "premium": {
          "annual": 1450.00,
          "monthly": 127.00
        },
        "customized": false
      }
    ],
    "total_premium": {
      "annual": 4950.00,
      "monthly": 434.00,
      "quarterly": 1287.00
    },
    "package_discount": {
      "amount": 150.00,
      "percentage": 3.0,
      "reason": "Multi-coverage discount"
    },
    "final_total": {
      "annual": 4800.00,
      "monthly": 420.00,
      "quarterly": 1248.00
    },
    "expires_at": "2025-11-20T10:30:00Z"
  }
}
```

---

### POST /purchase
Purchase selected quotes.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "selection_id": "sel_xyz789",
  "payment_plan": "monthly",
  "payment_method": {
    "type": "card",
    "stripe_payment_method_id": "pm_1234567890",
    "billing_address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    }
  },
  "auto_renewal": true,
  "effective_date": "2025-12-01",
  "signature": {
    "full_name": "John Doe",
    "signed_at": "2025-11-06T11:00:00Z",
    "ip_address": "192.168.1.100"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "purchase_id": "pur_abc123",
    "payment_intent_id": "pi_stripe_123",
    "status": "processing",
    "policies": [
      {
        "policy_id": "pol_gl_001",
        "policy_number": "CLR-2025-001234",
        "coverage_type": "general_liability",
        "effective_date": "2025-12-01",
        "expiration_date": "2026-12-01",
        "status": "pending_issuance",
        "estimated_issuance": "2025-11-06T11:05:00Z"
      },
      {
        "policy_id": "pol_pl_001",
        "policy_number": "CLR-2025-001235",
        "coverage_type": "professional_liability",
        "effective_date": "2025-12-01",
        "expiration_date": "2026-12-01",
        "status": "pending_issuance",
        "estimated_issuance": "2025-11-06T11:05:00Z"
      }
    ],
    "payment": {
      "first_payment": 420.00,
      "payment_date": "2025-12-01",
      "payment_method": "card_ending_4242"
    },
    "next_steps": [
      "Your payment is being processed",
      "Policy documents are being generated",
      "You'll receive an email with your policies within 5 minutes"
    ]
  }
}
```

---

### GET /purchase/{purchase_id}
Get purchase status and details.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "purchase_id": "pur_abc123",
    "status": "completed",
    "payment_status": "paid",
    "policies": [
      {
        "policy_id": "pol_gl_001",
        "policy_number": "CLR-2025-001234",
        "status": "active",
        "document_url": "https://cdn.clarence.com/policies/pol_gl_001.pdf"
      }
    ],
    "receipt_url": "https://cdn.clarence.com/receipts/pur_abc123.pdf",
    "completed_at": "2025-11-06T11:05:30Z"
  }
}
```

---

## Policy Management Endpoints

### GET /policies
Get all policies for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (optional): Filter by status (active, expired, cancelled)
- `coverage_type` (optional): Filter by coverage type

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "policy_id": "pol_gl_001",
        "policy_number": "CLR-2025-001234",
        "coverage_type": "general_liability",
        "status": "active",
        "effective_date": "2025-12-01",
        "expiration_date": "2026-12-01",
        "premium": {
          "annual": 1650.00,
          "payment_plan": "monthly",
          "next_payment_date": "2026-01-01",
          "next_payment_amount": 145.00
        },
        "carrier": {
          "name": "Reliable Insurance Co. (Simulated)",
          "logo_url": "https://cdn.clarence.com/carriers/reliable.png"
        },
        "documents": [
          {
            "type": "policy",
            "url": "https://cdn.clarence.com/policies/pol_gl_001.pdf",
            "uploaded_at": "2025-11-06T11:05:30Z"
          },
          {
            "type": "certificate",
            "url": "https://cdn.clarence.com/certificates/cert_001.pdf",
            "uploaded_at": "2025-11-06T11:05:30Z"
          }
        ]
      }
    ],
    "summary": {
      "total_active_policies": 3,
      "total_annual_premium": 4800.00,
      "upcoming_renewal": {
        "policy_number": "CLR-2025-001234",
        "days_until_expiration": 360
      }
    }
  }
}
```

---

### GET /policies/{policy_id}
Get detailed policy information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "policy_id": "pol_gl_001",
    "policy_number": "CLR-2025-001234",
    "status": "active",
    "coverage_type": "general_liability",
    "effective_date": "2025-12-01",
    "expiration_date": "2026-12-01",
    "days_until_renewal": 360,
    "business_info": {
      "legal_name": "Acme Tech Solutions LLC",
      "address": "123 Main St, San Francisco, CA 94102"
    },
    "carrier": {
      "name": "Reliable Insurance Co. (Simulated)",
      "policy_service_number": "1-800-555-0100",
      "claims_number": "1-800-555-0200"
    },
    "coverage_details": {
      "per_occurrence": 1000000,
      "general_aggregate": 2000000,
      "deductible": 500
    },
    "premium": {
      "annual": 1650.00,
      "payment_plan": "monthly",
      "monthly_amount": 145.00,
      "next_payment_date": "2026-01-01",
      "auto_renewal": true
    },
    "additional_insureds": [
      {
        "name": "Client Company LLC",
        "added_date": "2025-12-15"
      }
    ],
    "endorsements": [
      {
        "name": "Waiver of Subrogation",
        "effective_date": "2025-12-01"
      }
    ],
    "documents": [
      {
        "document_id": "doc_policy_001",
        "type": "policy",
        "name": "General Liability Policy",
        "url": "https://cdn.clarence.com/policies/pol_gl_001.pdf",
        "size_bytes": 524288,
        "uploaded_at": "2025-11-06T11:05:30Z"
      }
    ]
  }
}
```

---

### POST /policies/{policy_id}/certificates
Generate a certificate of insurance.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "certificate_holder": {
    "name": "Client Company LLC",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001"
    }
  },
  "additional_insured": true,
  "description_of_operations": "Software development services per contract dated 11/1/2025",
  "special_provisions": "Certificate holder is included as additional insured"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "certificate_id": "cert_abc123",
    "policy_id": "pol_gl_001",
    "certificate_number": "CLR-CERT-2025-001",
    "issued_date": "2025-11-06",
    "certificate_holder": {
      "name": "Client Company LLC",
      "address": "456 Oak Ave, Los Angeles, CA 90001"
    },
    "document_url": "https://cdn.clarence.com/certificates/cert_abc123.pdf",
    "format": "ACORD 25",
    "created_at": "2025-11-06T11:15:00Z"
  }
}
```

---

### PUT /policies/{policy_id}
Request policy modification (endorsement).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "modification_type": "add_additional_insured",
  "details": {
    "additional_insured": {
      "name": "New Client LLC",
      "relationship": "Client per contract"
    }
  },
  "effective_date": "2025-12-15"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "modification_request_id": "mod_req_123",
    "policy_id": "pol_gl_001",
    "status": "pending_review",
    "modification_type": "add_additional_insured",
    "premium_change": {
      "amount": 25.00,
      "effective_date": "2025-12-15"
    },
    "estimated_completion": "2025-11-07T10:00:00Z",
    "message": "Your modification request is being reviewed. You'll receive an update within 24 hours."
  }
}
```

---

## Chat Support Endpoints

### POST /chat/sessions
Create a new chat session.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "context": {
    "policy_id": "pol_gl_001",
    "page": "policy_dashboard"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session_id": "chat_session_abc123",
    "created_at": "2025-11-06T11:20:00Z",
    "greeting": "Hi John! I'm Clarence, your AI insurance assistant. How can I help you today?"
  }
}
```

---

### POST /chat/sessions/{session_id}/messages
Send a message in chat session.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "message": "What does my general liability policy cover?",
  "attachments": []
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "session_id": "chat_session_abc123",
    "user_message": "What does my general liability policy cover?",
    "ai_response": {
      "text": "Your General Liability policy (CLR-2025-001234) covers:\n\n1. **Bodily Injury & Property Damage**: Up to $1,000,000 per occurrence if your business operations cause injury or damage to others\n\n2. **Personal & Advertising Injury**: Up to $1,000,000 for claims like libel, slander, or copyright infringement\n\n3. **Medical Payments**: Up to $5,000 for medical expenses\n\n4. **Legal Defense**: Legal costs are covered even if the claim is groundless\n\nWould you like me to generate a certificate of insurance or explain any specific coverage in more detail?",
      "citations": [
        {
          "document": "General Liability Policy",
          "page": 3,
          "section": "Coverage A - Bodily Injury and Property Damage Liability"
        }
      ],
      "suggested_actions": [
        {
          "label": "Generate Certificate of Insurance",
          "action": "generate_coi"
        },
        {
          "label": "View Full Policy",
          "action": "view_policy",
          "policy_id": "pol_gl_001"
        }
      ]
    },
    "timestamp": "2025-11-06T11:20:15Z"
  }
}
```

---

### POST /chat/sessions/{session_id}/escalate
Escalate chat to human agent.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "reason": "complex_question",
  "user_message": "I need help with a claim"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "escalation_id": "esc_abc123",
    "status": "agent_assigned",
    "agent": {
      "name": "Sarah Johnson",
      "role": "Insurance Specialist",
      "expected_response_time": "5 minutes"
    },
    "message": "I'm connecting you with Sarah, one of our insurance specialists. She'll be with you shortly."
  }
}
```

---

## Renewal Endpoints

### GET /renewals
Get upcoming renewals for user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "renewals": [
      {
        "renewal_id": "ren_abc123",
        "policy_id": "pol_gl_001",
        "policy_number": "CLR-2025-001234",
        "coverage_type": "general_liability",
        "current_expiration": "2026-12-01",
        "days_until_expiration": 360,
        "status": "not_started",
        "current_premium": 1650.00,
        "estimated_renewal_premium": 1650.00,
        "renewal_options_available": false,
        "renewal_available_date": "2026-09-01"
      }
    ]
  }
}
```

---

### POST /renewals/{policy_id}/initiate
Initiate renewal process for a policy.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "renewal_type": "review_and_update",
  "business_changes": {
    "revenue_changed": true,
    "new_revenue": 750000,
    "employees_changed": true,
    "new_employee_count": 8,
    "new_locations": []
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "renewal_id": "ren_abc123",
    "status": "in_progress",
    "ai_assessment": {
      "coverage_recommendations": [
        {
          "coverage_type": "professional_liability",
          "reason": "Your revenue has increased by 50% - consider increasing limits",
          "recommended_action": "increase_limits"
        }
      ],
      "estimated_premium_change": {
        "current": 1650.00,
        "estimated_new": 1950.00,
        "change_percentage": 18.2,
        "reason": "Revenue and employee count increase"
      }
    },
    "next_step": "review_recommendations"
  }
}
```

---

### POST /renewals/{renewal_id}/accept
Accept renewal (one-click or with modifications).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "renewal_type": "one_click",
  "accept_current_coverage": true,
  "payment_method_id": "pm_existing_123",
  "signature": {
    "full_name": "John Doe",
    "signed_at": "2025-11-06T11:30:00Z"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "renewal_id": "ren_abc123",
    "status": "completed",
    "new_policy_id": "pol_gl_002",
    "new_policy_number": "CLR-2026-001234",
    "effective_date": "2026-12-02",
    "expiration_date": "2027-12-02",
    "premium": 1650.00,
    "confirmation": "Your policy has been renewed successfully. Your new policy documents are being generated."
  }
}
```

---

## Webhook Events

Clarence can send webhook events to notify your system of important events.

### Event Types

**`quote.completed`**
```json
{
  "event_id": "evt_abc123",
  "type": "quote.completed",
  "created_at": "2025-11-06T10:35:20Z",
  "data": {
    "quote_request_id": "qr_1234567890",
    "user_id": "usr_abc123",
    "total_quotes": 9,
    "coverage_types": ["general_liability", "professional_liability", "cyber_liability"]
  }
}
```

**`purchase.completed`**
```json
{
  "event_id": "evt_def456",
  "type": "purchase.completed",
  "created_at": "2025-11-06T11:05:30Z",
  "data": {
    "purchase_id": "pur_abc123",
    "user_id": "usr_abc123",
    "policies": ["pol_gl_001", "pol_pl_001", "pol_cy_001"],
    "total_premium": 4800.00
  }
}
```

**`policy.issued`**
```json
{
  "event_id": "evt_ghi789",
  "type": "policy.issued",
  "created_at": "2025-11-06T11:05:30Z",
  "data": {
    "policy_id": "pol_gl_001",
    "policy_number": "CLR-2025-001234",
    "user_id": "usr_abc123",
    "coverage_type": "general_liability"
  }
}
```

**`renewal.reminder`**
```json
{
  "event_id": "evt_jkl012",
  "type": "renewal.reminder",
  "created_at": "2025-09-01T09:00:00Z",
  "data": {
    "policy_id": "pol_gl_001",
    "user_id": "usr_abc123",
    "days_until_expiration": 90,
    "reminder_type": "90_days"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `PHONE_ALREADY_REGISTERED` | 400 | Phone number already in use |
| `INVALID_VERIFICATION_CODE` | 400 | Verification code incorrect or expired |
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `QUOTE_EXPIRED` | 410 | Quote has expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

**Authenticated Endpoints:**
- 100 requests per minute per user
- 1,000 requests per hour per user

**Unauthenticated Endpoints:**
- 20 requests per minute per IP
- 100 requests per hour per IP

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699281600
```

---

## Versioning

API versions are specified in the URL path (e.g., `/v1/`).

Current version: **v1**

Deprecation policy: Minimum 6 months notice before version retirement.

---

## Testing

**Sandbox Environment:**
```
Base URL: https://api-sandbox.joinclarence.com/v1
```

**Test Phone Numbers:**
- `+15555551000`: Auto-approves verification (code: `000000`)
- `+15555551001`: Simulates SMS delivery failure
- `+15555551002`: Already registered account

**Test Cards (Stripe):**
- `4242424242424242`: Successful payment
- `4000000000000002`: Card declined
- `4000002500003155`: Requires authentication

---

## Support

**API Documentation:** https://docs.joinclarence.com  
**Developer Portal:** https://developers.joinclarence.com  
**Support Email:** api-support@joinclarence.com  
**Status Page:** https://status.joinclarence.com


