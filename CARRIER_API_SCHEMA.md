# Carrier API Simulator - API Reference (MVP)

**⚠️ Fake/Mock API for testing purposes only**

**Version:** MVP  
**Base URL:** `http://localhost:3001/api/v1`  
**Last Updated:** November 11, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Data Types](#common-data-types)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Quote Generation](#1-quote-generation)
   - [Policy Binding](#2-policy-binding)
   - [Policy Retrieval](#3-policy-retrieval)
   - [Policy Renewal](#4-policy-renewal)
   - [Policy Endorsement](#5-policy-endorsement)
   - [Policy Cancellation](#6-policy-cancellation)
   - [Certificate Generation](#7-certificate-generation)
   - [Carrier Health Check](#8-carrier-health-check)
6. [Testing](#testing)

---

## Overview

Simple mock API that simulates insurance carrier systems for testing:

- **4 Fake Carriers**: Reliable Insurance, TechShield, Premier, FastBind
- **Personal Insurance**: Homeowners, Auto, Renters, Life, Umbrella
- **Commercial Insurance**: GL, E&O, Cyber, Workers Comp, Property, Auto, D&O, EPL, Crime, Media, Fiduciary, Employee Benefits
- **Mock Responses**: Returns fake but realistic data

### Supported Carrier IDs

| Carrier ID | Carrier Name | Specialization |
|------------|--------------|----------------|
| `reliable_insurance` | Reliable Insurance Co. | Balanced, family & small business |
| `techshield_underwriters` | TechShield Underwriters | Tech companies, cyber/E&O |
| `premier_underwriters` | Premier Underwriters | Premium, high net worth & large biz |
| `fastbind_insurance` | FastBind Insurance | Fast, competitive, small risks |

---

## Authentication

All API requests require an API key header:

```http
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

**Test API Key:** `test_clarence_key_123`

### Example Request

```bash
curl -X POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote \
  -H "X-API-Key: test_clarence_key_123" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Common Data Types

### Address Object

```typescript
{
  "street": "123 Main St",
  "unit": "Apt 4B",           // Optional
  "city": "San Francisco",
  "state": "CA",              // 2-letter state code
  "zip": "94102"
}
```

### Premium Object

```typescript
{
  "annual": 1250.00,          // Annual premium in USD
  "monthly": 110.00,          // Monthly payment option
  "quarterly": 325.00,        // Quarterly payment option
  "payment_in_full_discount": 50.00  // Discount for paying annually
}
```

### Coverage Limits Object

Varies by coverage type. Examples:

```typescript
// General Liability
{
  "per_occurrence": 1000000,
  "general_aggregate": 2000000,
  "products_operations_aggregate": 2000000,
  "personal_advertising_injury": 1000000,
  "medical_expense": 5000
}

// Homeowners
{
  "dwelling": 750000,
  "personal_property": 500000,
  "liability": 300000,
  "medical_payments": 5000,
  "loss_of_use": 150000
}

// Auto
{
  "bodily_injury_per_person": 250000,
  "bodily_injury_per_accident": 500000,
  "property_damage": 100000,
  "uninsured_motorist": 250000,
  "medical_payments": 5000
}
```

---

## Error Handling

All errors follow a consistent format:

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "field_name",       // Optional: which field caused error
    "details": "Additional details"  // Optional
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Request validation failed |
| 400 | `MISSING_REQUIRED_FIELD` | Required field is missing |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 404 | `NOT_FOUND` | Resource not found |
| 404 | `CARRIER_NOT_FOUND` | Invalid carrier ID |
| 404 | `POLICY_NOT_FOUND` | Policy doesn't exist |
| 410 | `QUOTE_EXPIRED` | Quote expired (30 days) |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Endpoints

## 1. Quote Generation

### POST /api/v1/carriers/{carrier_id}/quote

Get fake insurance quote(s) for personal or commercial insurance.

---

#### Request: Personal Insurance Quote

```http
POST /api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "quote_request_id": "qr_personal_001",
  "insurance_type": "personal",
  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1985-06-15",
    "gender": "M",
    "marital_status": "married",
    "occupation": "Software Engineer",
    "credit_score_tier": "good",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    },
    "email": "john.doe@example.com",
    "phone": "+15551234567"
  },
  "coverage_requests": [
    {
      "coverage_type": "homeowners",
      "property_info": {
        "dwelling_value": 750000,
        "year_built": 2015,
        "square_feet": 2000,
        "construction_type": "frame",
        "roof_type": "asphalt_shingle",
        "roof_age": 3,
        "bedrooms": 3,
        "bathrooms": 2,
        "garage": true,
        "pool": false,
        "alarm_system": true,
        "fire_sprinklers": false,
        "distance_to_fire_station_miles": 2.5
      },
      "requested_limits": {
        "dwelling": 750000,
        "personal_property": 500000,
        "liability": 300000,
        "medical_payments": 5000
      },
      "requested_deductible": 1000,
      "effective_date": "2025-12-01"
    },
    {
      "coverage_type": "auto",
      "vehicle_info": {
        "year": 2022,
        "make": "Toyota",
        "model": "Camry",
        "vin": "1HGBH41JXMN109186",
        "usage": "commute",
        "annual_mileage": 12000,
        "garaging_address": {
          "city": "San Francisco",
          "state": "CA",
          "zip": "94102"
        }
      },
      "driver_info": [
        {
          "first_name": "John",
          "last_name": "Doe",
          "date_of_birth": "1985-06-15",
          "license_number": "D1234567",
          "license_state": "CA",
          "years_licensed": 20,
          "accidents_last_3_years": 0,
          "violations_last_3_years": 0
        }
      ],
      "requested_limits": {
        "bodily_injury_per_person": 250000,
        "bodily_injury_per_accident": 500000,
        "property_damage": 100000
      },
      "requested_deductibles": {
        "collision": 500,
        "comprehensive": 250
      },
      "effective_date": "2025-12-01"
    }
  ],
  "additional_data": {
    "prior_insurance": true,
    "prior_carrier": "State Farm",
    "continuous_coverage_years": 5,
    "claims_last_5_years": []
  }
}
```

---

#### Request: Commercial Insurance Quote

```http
POST /api/v1/carriers/techshield_underwriters/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "quote_request_id": "qr_commercial_001",
  "insurance_type": "commercial",
  "business_info": {
    "legal_name": "Acme Tech Solutions LLC",
    "dba_name": "Acme Tech",
    "legal_structure": "LLC",
    "website": "https://acmetech.com",
    "industry": "Technology Consulting",
    "industry_code": "541512",
    "description": "We provide IT consulting and software development services to small businesses",
    "fein": "12-3456789",
    "year_started": 2018,
    "years_current_ownership": 5,
    "address": {
      "street": "123 Main St",
      "suite": "Suite 200",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    },
    "financial_info": {
      "annual_revenue": 500000,
      "annual_payroll": 400000,
      "full_time_employees": 5,
      "part_time_employees": 2,
      "contractors": 3
    },
    "contact_info": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acmetech.com",
      "phone": "+15551234567",
      "title": "CEO"
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
    },
    {
      "coverage_type": "professional_liability",
      "requested_limits": {
        "per_claim": 1000000,
        "aggregate": 2000000
      },
      "requested_deductible": 5000,
      "requested_retroactive_date": "2018-01-01",
      "effective_date": "2025-12-01"
    },
    {
      "coverage_type": "cyber_liability",
      "cyber_info": {
        "has_cybersecurity_policy": true,
        "has_incident_response_plan": true,
        "handles_pii": true,
        "number_of_records": 5000,
        "has_encryption": true,
        "has_mfa": true,
        "conducts_security_training": true
      },
      "requested_limits": {
        "per_incident": 1000000,
        "aggregate": 2000000
      },
      "requested_deductible": 10000,
      "effective_date": "2025-12-01"
    }
  ],
  "additional_data": {
    "prior_coverage": true,
    "claims_history": [],
    "credit_score_tier": "good"
  }
}
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "carrier_id": "techshield_underwriters",
  "carrier_name": "TechShield Underwriters",
  "carrier_quote_id": "TSU-Q-2025-001234",
  "requested_quote_id": "qr_commercial_001",
  "timestamp": "2025-11-11T10:30:00Z",
  "valid_until": "2025-12-11T10:30:00Z",
  "quotes": [
    {
      "quote_id": "TSU-Q-2025-001234-GL",
      "coverage_type": "general_liability",
      "status": "quoted",
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
        "payment_in_full_discount": 50.00
      },
      "deductible": 500,
      "effective_date": "2025-12-01",
      "expiration_date": "2026-12-01",
      "policy_form": "ISO CGL",
      "highlights": [
        "Coverage for bodily injury and property damage",
        "Legal defense costs covered in addition to limits",
        "Medical payments up to $5,000",
        "Products and completed operations included",
        "Contractual liability coverage"
      ],
      "exclusions": [
        "Professional services (covered by E&O)",
        "Pollution liability",
        "Employee injuries (covered by Workers Comp)",
        "Auto liability (requires separate policy)",
        "Cyber incidents (requires cyber policy)"
      ],
      "optional_coverages": [
        {
          "name": "Hired and Non-Owned Auto Liability",
          "additional_premium": 125.00,
          "description": "Liability for rented, leased, or borrowed vehicles"
        },
        {
          "name": "Employee Benefits Liability",
          "additional_premium": 300.00,
          "description": "Coverage for errors in benefits administration"
        }
      ],
      "underwriting_notes": [
        "Low-risk industry classification",
        "Good business credit rating",
        "No prior claims history",
        "Competitive market conditions for tech consulting"
      ]
    },
    {
      "quote_id": "TSU-Q-2025-001234-PL",
      "coverage_type": "professional_liability",
      "status": "quoted",
      "coverage_limits": {
        "per_claim": 1000000,
        "aggregate": 2000000
      },
      "premium": {
        "annual": 2850.00,
        "monthly": 250.00,
        "quarterly": 740.00
      },
      "deductible": 5000,
      "effective_date": "2025-12-01",
      "expiration_date": "2026-12-01",
      "policy_form": "Claims-Made",
      "retroactive_date": "2018-01-01",
      "highlights": [
        "Covers professional errors and omissions",
        "Defense costs in addition to policy limits",
        "Cyber incident response included (up to $25k)",
        "Prior acts coverage from retroactive date",
        "60-day extended reporting period included"
      ],
      "exclusions": [
        "Bodily injury or property damage (covered by GL)",
        "Intentional acts or fraud",
        "Violations of securities laws",
        "Patent or trademark infringement"
      ],
      "optional_coverages": [
        {
          "name": "Extended Reporting Period (3 years)",
          "additional_premium": 2850.00,
          "description": "Coverage for claims made up to 3 years after policy ends"
        }
      ],
      "underwriting_notes": [
        "Technology consulting is moderate risk for E&O",
        "Strong controls and processes in place",
        "Established business with solid track record"
      ]
    },
    {
      "quote_id": "TSU-Q-2025-001234-CY",
      "coverage_type": "cyber_liability",
      "status": "quoted",
      "coverage_limits": {
        "per_incident": 1000000,
        "aggregate": 2000000,
        "breach_response_sublimit": 500000,
        "business_interruption_sublimit": 250000,
        "cyber_extortion_sublimit": 100000
      },
      "premium": {
        "annual": 3200.00,
        "monthly": 280.00,
        "quarterly": 830.00
      },
      "deductible": 10000,
      "waiting_period_hours": 8,
      "effective_date": "2025-12-01",
      "expiration_date": "2026-12-01",
      "policy_form": "TechShield Cyber Pro",
      "highlights": [
        "Data breach notification and credit monitoring",
        "Forensic investigation costs",
        "Business interruption from cyber event",
        "Cyber extortion and ransomware coverage",
        "PCI fines and penalties coverage",
        "24/7 incident response hotline"
      ],
      "exclusions": [
        "War and terrorism",
        "Failure to maintain security standards",
        "Theft of intellectual property",
        "Loss of future revenue"
      ],
      "optional_coverages": [
        {
          "name": "Social Engineering Coverage",
          "additional_premium": 450.00,
          "description": "Coverage for funds transfer fraud"
        },
        {
          "name": "Media Liability",
          "additional_premium": 600.00,
          "description": "Copyright infringement, defamation online"
        }
      ],
      "underwriting_notes": [
        "Strong cybersecurity posture noted",
        "MFA and encryption in place",
        "Regular security training conducted",
        "Handles moderate amount of PII (5k records)",
        "TechShield specialty - competitive pricing"
      ]
    }
  ],
  "package_discount": {
    "available": true,
    "discount_percentage": 5,
    "discount_amount": 362.50,
    "description": "Multi-coverage package discount",
    "applied_to": "all_coverages"
  },
  "total_package_premium": {
    "annual": 6937.50,
    "monthly": 608.00,
    "quarterly": 1802.50
  },
  "underwriting_summary": {
    "overall_risk_rating": "preferred",
    "approval_likelihood": "high",
    "notes": [
      "Tech consulting is in TechShield's core appetite",
      "Strong risk management practices",
      "Clean claims history",
      "All coverages approved at requested limits"
    ]
  },
  "required_documents": [],
  "bind_eligibility": "eligible_immediate",
  "next_steps": [
    "Review quotes and select coverages",
    "Proceed to bind endpoint to purchase",
    "Quotes valid until 2025-12-11"
  ]
}
```

---

#### Response: Declined (200 OK)

```json
{
  "success": true,
  "carrier_id": "premier_underwriters",
  "carrier_name": "Premier Underwriters",
  "carrier_quote_id": "PRE-Q-2025-001235",
  "requested_quote_id": "qr_commercial_002",
  "timestamp": "2025-11-11T10:35:00Z",
  "quotes": [
    {
      "quote_id": "PRE-Q-2025-001235-GL",
      "coverage_type": "general_liability",
      "status": "declined",
      "decline_reason": "Business revenue below our minimum threshold of $1M for commercial general liability",
      "decline_code": "REVENUE_TOO_LOW",
      "alternative_suggestions": [
        "Consider FastBind Insurance for businesses under $1M revenue",
        "Reapply when annual revenue exceeds $1M",
        "Contact our surplus lines division for manual review"
      ]
    }
  ],
  "underwriting_summary": {
    "overall_risk_rating": "outside_appetite",
    "notes": [
      "Premier focuses on larger businesses",
      "Minimum revenue requirement: $1M",
      "Current business revenue: $500k"
    ]
  }
}
```

---

#### Response: Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: business_info.industry_code",
    "field": "business_info.industry_code",
    "details": "Industry code (NAICS) is required for commercial insurance underwriting"
  }
}
```

---

## 2. Policy Binding

### POST /api/v1/carriers/{carrier_id}/bind

Bind (purchase) an insurance policy from an accepted quote.

**Important:**
- Quote must not be expired (check `valid_until`)
- Only one policy can be bound per quote_id

---

#### Request

```http
POST /api/v1/carriers/techshield_underwriters/bind
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "quote_id": "TSU-Q-2025-001234-CY",
  "effective_date": "2025-12-01",
  "payment_plan": "monthly",
  "payment_info": {
    "method": "credit_card",
    "token": "tok_stripe_12345",
    "billing_address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    }
  },
  "insured_info": {
    "primary_contact": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acmetech.com",
      "phone": "+15551234567",
      "title": "CEO"
    },
    "additional_insureds": [
      {
        "name": "Client Company LLC",
        "address": {
          "street": "456 Oak Ave",
          "city": "Los Angeles",
          "state": "CA",
          "zip": "90001"
        },
        "relationship": "Client per contract dated 11/01/2025"
      }
    ]
  },
  "signature": {
    "full_name": "John Doe",
    "signed_at": "2025-11-11T11:00:00Z",
    "ip_address": "192.168.1.100"
  },
  "customizations": {
    "endorsements": ["waiver_of_subrogation"],
    "special_provisions": [
      "Certificate holder added as additional insured"
    ]
  }
}
```

---

#### Response: Success (201 Created)

```json
{
  "success": true,
  "carrier_id": "techshield_underwriters",
  "bind_id": "TSU-B-2025-001234",
  "policy": {
    "policy_id": "TSU-P-2025-001234",
    "policy_number": "TSU-2025-CY-001234",
    "status": "bound",
    "insurance_type": "commercial",
    "coverage_type": "cyber_liability",
    "effective_date": "2025-12-01T00:00:00Z",
    "expiration_date": "2026-12-01T00:00:00Z",
    "insured_name": "Acme Tech Solutions LLC",
    "insured_address": "123 Main St, Suite 200, San Francisco, CA 94102",
    "coverage_limits": {
      "per_incident": 1000000,
      "aggregate": 2000000,
      "breach_response_sublimit": 500000,
      "business_interruption_sublimit": 250000
    },
    "premium": {
      "annual": 3200.00,
      "payment_plan": "monthly",
      "monthly_amount": 280.00,
      "first_payment_due": "2025-12-01",
      "next_payment_date": "2026-01-01"
    },
    "deductible": 10000,
    "carrier_contact": {
      "policy_service_phone": "1-800-555-0300",
      "claims_phone": "1-800-555-0400",
      "email": "service@techshield.com",
      "claims_email": "claims@techshield.com"
    },
    "documents": [
      {
        "type": "policy",
        "name": "Cyber Liability Policy",
        "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/policy.pdf",
        "size_bytes": 524288,
        "generated_at": "2025-11-11T11:01:00Z"
      },
      {
        "type": "declarations",
        "name": "Declarations Page",
        "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/declarations.pdf",
        "size_bytes": 102400,
        "generated_at": "2025-11-11T11:01:00Z"
      },
      {
        "type": "certificate",
        "name": "Certificate of Insurance",
        "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/certificate.pdf",
        "size_bytes": 81920,
        "generated_at": "2025-11-11T11:01:00Z"
      }
    ],
    "endorsements": [
      {
        "endorsement_id": "END-001",
        "name": "Waiver of Subrogation",
        "effective_date": "2025-12-01"
      }
    ],
    "additional_insureds": [
      {
        "name": "Client Company LLC",
        "address": "456 Oak Ave, Los Angeles, CA 90001",
        "relationship": "Client per contract dated 11/01/2025",
        "added_date": "2025-12-01"
      }
    ]
  },
  "payment_confirmation": {
    "payment_id": "pay_12345",
    "amount": 280.00,
    "currency": "USD",
    "payment_method": "card_ending_4242",
    "status": "succeeded",
    "receipt_url": "https://carrier-simulator.clarence.app/receipts/pay_12345.pdf"
  },
  "bound_at": "2025-11-11T11:01:00Z",
  "confirmation_email_sent": true,
  "next_steps": [
    "Policy documents are ready for download",
    "First payment will be charged on 2025-12-01",
    "Certificate of insurance available immediately",
    "24/7 incident response hotline: 1-800-555-0400"
  ]
}
```

---

#### Response: Quote Expired (410 Gone)

```json
{
  "success": false,
  "error": {
    "code": "QUOTE_EXPIRED",
    "message": "Quote has expired and is no longer bindable",
    "expired_at": "2025-12-11T10:30:00Z",
    "quote_id": "TSU-Q-2025-001234-CY"
  }
}
```

---

## 3. Policy Retrieval

### GET /api/v1/carriers/{carrier_id}/policies/{policy_id}

Retrieve current policy details.

---

#### Request

```http
GET /api/v1/carriers/techshield_underwriters/policies/TSU-P-2025-001234
X-API-Key: test_clarence_key_123
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "policy": {
    "policy_id": "TSU-P-2025-001234",
    "policy_number": "TSU-2025-CY-001234",
    "status": "active",
    "insurance_type": "commercial",
    "coverage_type": "cyber_liability",
    "effective_date": "2025-12-01T00:00:00Z",
    "expiration_date": "2026-12-01T00:00:00Z",
    "days_until_expiration": 360,
    "insured": {
      "legal_name": "Acme Tech Solutions LLC",
      "dba_name": "Acme Tech",
      "address": "123 Main St, Suite 200, San Francisco, CA 94102",
      "contact": {
        "name": "John Doe",
        "email": "john@acmetech.com",
        "phone": "+15551234567"
      }
    },
    "coverage_details": {
      "per_incident": 1000000,
      "aggregate": 2000000,
      "breach_response_sublimit": 500000,
      "business_interruption_sublimit": 250000,
      "cyber_extortion_sublimit": 100000,
      "deductible": 10000,
      "waiting_period_hours": 8
    },
    "premium": {
      "annual": 3200.00,
      "payment_plan": "monthly",
      "monthly_amount": 280.00,
      "next_payment_date": "2026-01-01",
      "next_payment_amount": 280.00,
      "payments_remaining": 11,
      "auto_renewal": true
    },
    "endorsements": [
      {
        "endorsement_id": "END-001",
        "name": "Waiver of Subrogation",
        "effective_date": "2025-12-01"
      }
    ],
    "additional_insureds": [
      {
        "name": "Client Company LLC",
        "address": "456 Oak Ave, Los Angeles, CA 90001",
        "added_date": "2025-12-01"
      }
    ],
    "documents": [
      {
        "document_id": "doc_policy_001",
        "type": "policy",
        "name": "Cyber Liability Policy",
        "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/policy.pdf",
        "size_bytes": 524288,
        "uploaded_at": "2025-11-11T11:01:00Z"
      },
      {
        "document_id": "doc_cert_001",
        "type": "certificate",
        "name": "Certificate of Insurance",
        "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/certificate.pdf",
        "size_bytes": 81920,
        "uploaded_at": "2025-11-11T11:01:00Z"
      }
    ],
    "carrier_contact": {
      "policy_service_phone": "1-800-555-0300",
      "claims_phone": "1-800-555-0400",
      "email": "service@techshield.com"
    }
  }
}
```

---

## 4. Policy Renewal

### POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/renew

Request a renewal quote for an existing policy.

**Best Practice:** Start renewal process 90 days before expiration.

---

#### Request

```http
POST /api/v1/carriers/techshield_underwriters/policies/TSU-P-2025-001234/renew
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "renewal_type": "review_and_update",
  "business_changes": {
    "revenue_changed": true,
    "new_annual_revenue": 750000,
    "employees_changed": true,
    "new_full_time_employees": 8,
    "new_part_time_employees": 2,
    "locations_changed": false,
    "operations_changed": false,
    "has_new_records": true,
    "new_records_count": 8000
  },
  "coverage_changes": {
    "increase_limits": true,
    "new_limits": {
      "per_incident": 2000000,
      "aggregate": 4000000
    },
    "add_coverages": ["social_engineering"],
    "remove_coverages": []
  },
  "desired_effective_date": "2026-12-02"
}
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "renewal_quote_id": "TSU-RQ-2026-001234",
  "original_policy_id": "TSU-P-2025-001234",
  "renewal_status": "quoted",
  "quote": {
    "quote_id": "TSU-RQ-2026-001234-CY",
    "coverage_type": "cyber_liability",
    "effective_date": "2026-12-02",
    "expiration_date": "2027-12-02",
    "coverage_limits": {
      "per_incident": 2000000,
      "aggregate": 4000000,
      "breach_response_sublimit": 1000000,
      "business_interruption_sublimit": 500000,
      "cyber_extortion_sublimit": 200000,
      "social_engineering_sublimit": 100000
    },
    "premium": {
      "annual": 4250.00,
      "monthly": 372.00,
      "quarterly": 1103.00
    },
    "premium_change": {
      "amount": 1050.00,
      "percentage": 32.8,
      "reasons": [
        "Revenue increase: 50% (+$500 premium)",
        "Employee count increase: 60% (+$300 premium)",
        "Limit increase: $1M to $2M (+$800 premium)",
        "Social engineering coverage added (+$450 premium)",
        "Records count increase: 5k to 8k (+$150 premium)",
        "Market rate adjustment: +3% (+$96 premium)",
        "Less loyalty discount: -5% (-$246 premium)"
      ]
    },
    "deductible": 10000,
    "loyalty_discount": {
      "percentage": 5,
      "amount": 224.00,
      "description": "1-year claims-free discount"
    },
    "valid_until": "2026-11-15T23:59:59Z",
    "highlights": [
      "Increased limits to $2M per incident",
      "Social engineering coverage included",
      "All prior endorsements maintained",
      "No underwriting required for renewal"
    ]
  },
  "underwriting_notes": [
    "Positive growth trajectory",
    "No claims in prior term",
    "Strong cybersecurity posture maintained",
    "Automatic renewal eligibility confirmed"
  ],
  "bind_eligibility": "eligible_automatic",
  "comparison": {
    "current_policy": {
      "annual_premium": 3200.00,
      "limits": "1M/2M"
    },
    "renewal_quote": {
      "annual_premium": 4250.00,
      "limits": "2M/4M"
    }
  },
  "next_steps": [
    "Review renewal quote",
    "Accept renewal to bind new policy",
    "Current policy expires 2026-12-01",
    "Renewal quote valid until 2026-11-15"
  ]
}
```

---

## 5. Policy Endorsement

### POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/endorse

Request a mid-term policy modification (endorsement).

---

#### Request: Add Additional Insured

```http
POST /api/v1/carriers/techshield_underwriters/policies/TSU-P-2025-001234/endorse
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "endorsement_type": "add_additional_insured",
  "effective_date": "2025-12-15",
  "details": {
    "additional_insured": {
      "name": "New Client LLC",
      "address": {
        "street": "789 Pine St",
        "city": "Seattle",
        "state": "WA",
        "zip": "98101"
      },
      "relationship": "Client per contract dated 12/10/2025"
    }
  }
}
```

---

#### Request: Increase Limits

```json
{
  "endorsement_type": "increase_limits",
  "effective_date": "2026-01-01",
  "details": {
    "new_limits": {
      "per_incident": 2000000,
      "aggregate": 4000000
    }
  }
}
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "endorsement_id": "TSU-END-2025-001234-002",
  "policy_id": "TSU-P-2025-001234",
  "status": "approved",
  "endorsement_type": "add_additional_insured",
  "effective_date": "2025-12-15T00:00:00Z",
  "premium_change": {
    "amount": 25.00,
    "annual_adjustment": 25.00,
    "pro_rated_charge": 23.12,
    "explanation": "Additional insured endorsement fee, pro-rated from 12/15/2025 to policy expiration"
  },
  "documents": [
    {
      "type": "endorsement",
      "name": "Endorsement - Additional Insured",
      "url": "https://carrier-simulator.clarence.app/documents/TSU-END-2025-001234-002.pdf",
      "generated_at": "2025-11-11T12:00:00Z"
    },
    {
      "type": "updated_declarations",
      "name": "Updated Declarations Page",
      "url": "https://carrier-simulator.clarence.app/documents/TSU-P-2025-001234/declarations_v2.pdf",
      "generated_at": "2025-11-11T12:00:00Z"
    }
  ],
  "updated_policy_summary": {
    "total_annual_premium": 3225.00,
    "additional_insureds_count": 2,
    "next_payment_adjustment": 2.09
  },
  "confirmation_email_sent": true,
  "next_steps": [
    "Endorsement effective 2025-12-15",
    "Pro-rated charge of $23.12 added to next payment",
    "Updated documents available for download",
    "New certificate of insurance can be generated"
  ]
}
```

---

## 6. Policy Cancellation

### POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/cancel

Request policy cancellation.

**Note:** Cancellation may incur fees depending on carrier and timing.

---

#### Request

```http
POST /api/v1/carriers/techshield_underwriters/policies/TSU-P-2025-001234/cancel
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "cancellation_type": "insured_request",
  "effective_date": "2026-03-01",
  "reason": "Switching to different carrier",
  "signature": {
    "full_name": "John Doe",
    "signed_at": "2025-11-11T13:00:00Z",
    "ip_address": "192.168.1.100"
  }
}
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "cancellation_id": "TSU-CAN-2025-001234",
  "policy_id": "TSU-P-2025-001234",
  "policy_number": "TSU-2025-CY-001234",
  "status": "pending_cancellation",
  "effective_date": "2026-03-01T00:00:00Z",
  "cancellation_type": "insured_request",
  "refund": {
    "earned_premium": 933.33,
    "unearned_premium": 2266.67,
    "cancellation_fee": 50.00,
    "short_rate_penalty": 0.00,
    "net_refund": 2216.67,
    "refund_method": "original_payment_method",
    "estimated_refund_date": "2026-03-15",
    "refund_breakdown": {
      "total_premium_paid": 933.33,
      "days_policy_active": 90,
      "total_days": 365,
      "percentage_earned": 24.66
    }
  },
  "documents": [
    {
      "type": "cancellation_notice",
      "name": "Cancellation Notice",
      "url": "https://carrier-simulator.clarence.app/documents/TSU-CAN-2025-001234.pdf",
      "generated_at": "2025-11-11T13:01:00Z"
    }
  ],
  "important_notes": [
    "Policy coverage ends at 12:01 AM on 2026-03-01",
    "No coverage after cancellation date",
    "Refund will be processed within 15 business days",
    "Consider obtaining replacement coverage before cancellation",
    "Claims made after cancellation will not be covered"
  ],
  "confirmation_email_sent": true,
  "next_steps": [
    "Cancellation notice sent to your email",
    "Secure replacement coverage before 2026-03-01",
    "Refund of $2,216.67 will be issued to original payment method",
    "Contact us if you wish to withdraw cancellation request"
  ]
}
```

---

## 7. Certificate Generation

### POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/certificate

Generate a Certificate of Insurance (ACORD 25 form).

---

#### Request

```http
POST /api/v1/carriers/techshield_underwriters/policies/TSU-P-2025-001234/certificate
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

```json
{
  "certificate_holder": {
    "name": "Certificate Holder Company LLC",
    "address": {
      "street": "456 Pine Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    }
  },
  "additional_insured": true,
  "description_of_operations": "Software development and IT consulting services per contract dated 11/01/2025",
  "special_provisions": [
    "Certificate holder is included as additional insured",
    "Waiver of subrogation applies in favor of certificate holder",
    "30 days notice of cancellation provided"
  ],
  "project_number": "PROJ-2025-001",
  "project_description": "Enterprise software implementation"
}
```

---

#### Response: Success (200 OK)

```json
{
  "success": true,
  "certificate_id": "TSU-CERT-2025-001234-003",
  "policy_id": "TSU-P-2025-001234",
  "certificate_number": "CERT-TSU-2025-001234-003",
  "issued_date": "2025-11-11",
  "certificate_holder": {
    "name": "Certificate Holder Company LLC",
    "address": "456 Pine Ave, New York, NY 10001"
  },
  "format": "ACORD 25",
  "document": {
    "url": "https://carrier-simulator.clarence.app/certificates/TSU-CERT-2025-001234-003.pdf",
    "format": "PDF",
    "size_bytes": 245760
  },
  "generated_at": "2025-11-11T14:00:00Z",
  "expires_at": "2026-12-01T00:00:00Z",
  "coverage_summary": {
    "coverage_type": "cyber_liability",
    "limits": "2M/4M",
    "policy_number": "TSU-2025-CY-001234",
    "effective_date": "2025-12-01",
    "expiration_date": "2026-12-01"
  },
  "confirmation_email_sent": true,
  "next_steps": [
    "Certificate ready for download",
    "Valid until policy expiration",
    "Can generate additional certificates as needed",
    "Email sent to certificate holder (optional feature)"
  ]
}
```

---

## 8. Carrier Health Check

### GET /api/v1/carriers/{carrier_id}/health

Check carrier system availability and status.

---

#### Request

```http
GET /api/v1/carriers/techshield_underwriters/health
X-API-Key: test_clarence_key_123
```

---

#### Response: Operational (200 OK)

```json
{
  "status": "operational",
  "carrier_id": "techshield_underwriters",
  "carrier_name": "TechShield Underwriters",
  "timestamp": "2025-11-11T15:00:00Z",
  "services": {
    "quoting": "operational",
    "binding": "operational",
    "policy_management": "operational",
    "document_generation": "operational"
  },
  "supported_insurance_types": ["personal", "commercial"],
  "supported_coverages": {
    "personal": ["homeowners", "auto", "renters", "life", "umbrella"],
    "commercial": ["general_liability", "professional_liability", "cyber_liability", "workers_comp", "commercial_property", "business_auto", "umbrella", "directors_officers", "employment_practices", "crime", "media", "fiduciary", "employee_benefits"]
  }
}
```

---

#### Response: Degraded (503 Service Unavailable)

```json
{
  "status": "degraded",
  "carrier_id": "techshield_underwriters",
  "carrier_name": "TechShield Underwriters",
  "timestamp": "2025-11-11T15:00:00Z",
  "services": {
    "quoting": "operational",
    "binding": "degraded",
    "policy_management": "operational",
    "document_generation": "down"
  },
  "message": "Document generation service experiencing issues. Policies can be bound but documents will be delayed.",
  "estimated_restoration": "2025-11-11T16:00:00Z",
  "alternative_actions": [
    "Binding is still available",
    "Documents will be generated once service restored",
    "Customers will be notified when documents ready"
  ]
}
```

---


## Testing

### Quick Testing with REST Client

**Best approach:** Use `api.http` file with REST Client extension in VS Code

1. Install REST Client extension
2. Open `api.http`
3. Click "Send Request" on any endpoint
4. View response immediately

### Test Environment

**Base URL:** `http://localhost:3001/api/v1`

**Test API Key:** `test_clarence_key_123`

### Test Carriers

All 4 fake carriers available: `reliable_insurance`, `techshield_underwriters`, `premier_underwriters`, `fastbind_insurance`

### Sample Test Data

#### Test Personal Insurance Request (Homeowners)

```json
{
  "quote_request_id": "test_personal_001",
  "insurance_type": "personal",
  "personal_info": {
    "first_name": "Jane",
    "last_name": "Smith",
    "date_of_birth": "1990-05-20",
    "occupation": "Teacher",
    "credit_score_tier": "excellent",
    "address": {
      "street": "789 Oak St",
      "city": "Austin",
      "state": "TX",
      "zip": "78701"
    }
  },
  "coverage_requests": [{
    "coverage_type": "homeowners",
    "property_info": {
      "dwelling_value": 350000,
      "year_built": 2018,
      "square_feet": 1800,
      "construction_type": "frame",
      "roof_age": 2
    },
    "requested_deductible": 1000,
    "effective_date": "2025-12-01"
  }]
}
```

#### Test Commercial Insurance Request (Tech Startup)

```json
{
  "quote_request_id": "test_commercial_001",
  "insurance_type": "commercial",
  "business_info": {
    "legal_name": "Test Startup Inc",
    "industry": "Software Publishing",
    "industry_code": "511210",
    "year_started": 2023,
    "financial_info": {
      "annual_revenue": 200000,
      "annual_payroll": 150000,
      "full_time_employees": 3
    },
    "address": {
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    }
  },
  "coverage_requests": [{
    "coverage_type": "general_liability",
    "requested_limits": {
      "per_occurrence": 1000000,
      "general_aggregate": 2000000
    },
    "effective_date": "2025-12-01"
  }]
}
```

### Testing Tips

- Use `api.http` for quick testing (easier than Postman)
- Test both personal and commercial insurance
- Try all 4 carriers
- Test the full workflow: quote → bind → policy → certificate

---

## Appendix: Coverage Type Reference

### Personal Insurance Coverage Types

| Coverage Type | Code | Description |
|---------------|------|-------------|
| Homeowners | `homeowners` | HO-3 or HO-5 dwelling coverage |
| Auto Insurance | `auto` | Personal auto liability and physical damage |
| Renters Insurance | `renters` | HO-4 personal property and liability |
| Life Insurance | `life` | Term or whole life insurance |
| Personal Umbrella | `personal_umbrella` | Excess liability above home/auto |

### Commercial Insurance Coverage Types

| Coverage Type | Code | Description |
|---------------|------|-------------|
| General Liability | `general_liability` | CGL bodily injury and property damage |
| Professional Liability | `professional_liability` | E&O errors and omissions |
| Cyber Liability | `cyber_liability` | Data breach and cyber incident response |
| Workers Compensation | `workers_compensation` | Employee injury coverage |
| Commercial Property | `commercial_property` | Building and contents |
| Business Auto | `business_auto` | Commercial vehicle coverage |
| Umbrella | `umbrella` | Excess liability for business |
| Directors & Officers | `directors_officers` | D&O management liability |
| Employment Practices | `employment_practices` | EPL discrimination/harassment |
| Crime | `crime` | Employee theft and fraud |
| Media Liability | `media` | Copyright infringement, defamation |
| Fiduciary Liability | `fiduciary` | ERISA violations |
| Employee Benefits | `employee_benefits` | Benefits administration errors |

---

## More Resources

- **Quick Reference:** See `API_QUICK_REFERENCE.md`
- **Integration Guide:** See `INTEGRATION_GUIDE.md`
- **REST Client Tests:** See `api.http`
- **Project Overview:** See `README.md`

---

**Version:** MVP  
**Last Updated:** November 11, 2025  
**Status:** Simplified for Fast Prototyping
