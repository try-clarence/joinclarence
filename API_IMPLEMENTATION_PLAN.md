# Clarence AI Backend API Implementation Plan (NestJS)

## Overview
This document outlines the backend API implementation for Clarence AI Insurance Platform. The backend provides two main functionalities:
1. **DEC Page Parsing**: Upload PDF documents and extract business information using LLM
2. **User Registration & Authentication**: Phone-based registration with SMS verification

---

## Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Cache/Sessions**: Redis
- **File Storage**: AWS S3 (or similar)
- **LLM Provider**: OpenAI GPT-4 Vision / Claude (for PDF parsing)
- **SMS Service**: Twilio
- **Email Service**: SendGrid (optional, for confirmation emails)
- **Authentication**: JWT (Access + Refresh tokens)

---

## NestJS Project Structure

```
src/
├── modules/
│   ├── document-parsing/
│   │   ├── document-parsing.controller.ts
│   │   ├── document-parsing.service.ts
│   │   ├── document-parsing.module.ts
│   │   └── dto/
│   │       └── parse-decpage-response.dto.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── verify-code.dto.ts
│   │       └── send-code.dto.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   └── sms/
│       ├── sms.service.ts
│       └── sms.module.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── jwt-refresh.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── pipes/
│       └── validation.pipe.ts
└── config/
    ├── database.config.ts
    ├── jwt.config.ts
    ├── aws.config.ts
    └── twilio.config.ts
```

---

## API Specifications

## 1. Document Parsing API

### 1.1 Parse DEC Page

**Endpoint**: `POST /api/v1/document-parsing/parse-decpage`

**Description**: Upload a PDF document (DEC page or business document) and extract business information using LLM.

**Authentication**: Not required (public endpoint)

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```typescript
  {
    file: File // PDF file (max 5MB)
  }
  ```

**Response**: `200 OK`
```typescript
{
  // Business Basics
  legalBusinessName?: string;
  doingBusinessAs?: string;
  legalStructure?: "llc" | "corporation" | "partnership" | "sole-proprietorship";
  businessWebsite?: string;
  primaryIndustry?: string;
  businessDescription?: string;
  businessFen?: string;
  yearBusinessStarted?: string; // YYYY format
  yearsUnderCurrentOwnership?: string;
  
  // Address Information
  addressType?: string[]; // e.g., ["physical"]
  businessAddress?: string;
  city?: string;
  state?: string; // 2-letter state code
  zip?: number;
  
  // Business Details
  hasSubsidiaries?: "yes" | "no";
  hasForeignSubsidiaries?: "yes" | "no";
  seekingMultipleEntities?: "yes" | "no";
  
  // Contact Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  
  // Financial Information
  lastYearRevenue?: number;
  estimatedCurrentYearRevenue?: number;
  lastYearExpenses?: number;
  estimatedCurrentYearExpenses?: number;
  numberOfEmployees?: number;
  numberOfPartTimeEmployees?: number;
  estimatedTotalPayroll?: number;
  independentContractorsPayrollPercent?: number; // 0-100
  
  // Metadata
  metadata: {
    fileName: string;
    fileType: string; // MIME type
    fileSize: number; // bytes
    parsedAt: string; // ISO 8601 timestamp
    confidence: number; // 0-1, average confidence of extracted data
    fileUrl?: string; // S3 URL (optional)
  };
}
```

**Error Responses**:
```typescript
// 400 Bad Request
{
  statusCode: 400,
  message: "Invalid file format. Only PDF files are supported.",
  error: "Bad Request"
}

// 413 Payload Too Large
{
  statusCode: 413,
  message: "File size exceeds 5MB limit.",
  error: "Payload Too Large"
}

// 500 Internal Server Error
{
  statusCode: 500,
  message: "Failed to parse document. Please try again.",
  error: "Internal Server Error"
}
```

**Implementation Details**:

1. **File Upload Handling**:
   - Accept only PDF files
   - Max file size: 5MB
   - Validate MIME type
   - Store file temporarily or upload to S3

2. **LLM Integration**:
   - Use OpenAI GPT-4 Vision API or Claude with vision capabilities
   - Convert PDF to images if needed (using pdf-lib or pdf2pic)
   - Send to LLM with structured extraction prompt

3. **Prompt Template** (example for OpenAI):
```typescript
const prompt = `
You are an expert at extracting business information from insurance documents and DEC pages.

Extract the following information from the provided document. Return ONLY valid JSON with no additional text.

Required format:
{
  "legalBusinessName": "string or null",
  "doingBusinessAs": "string or null",
  "legalStructure": "llc|corporation|partnership|sole-proprietorship or null",
  "businessWebsite": "string or null",
  "primaryIndustry": "string or null",
  "businessDescription": "string or null",
  "businessFen": "string or null",
  "yearBusinessStarted": "string (YYYY) or null",
  "yearsUnderCurrentOwnership": "string or null",
  "addressType": ["physical"] or null,
  "businessAddress": "string or null",
  "city": "string or null",
  "state": "string (2-letter code) or null",
  "zip": number or null,
  "hasSubsidiaries": "yes|no or null",
  "hasForeignSubsidiaries": "yes|no or null",
  "seekingMultipleEntities": "yes|no or null",
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "lastYearRevenue": number or null,
  "estimatedCurrentYearRevenue": number or null,
  "lastYearExpenses": number or null,
  "estimatedCurrentYearExpenses": number or null,
  "numberOfEmployees": number or null,
  "numberOfPartTimeEmployees": number or null,
  "estimatedTotalPayroll": number or null,
  "independentContractorsPayrollPercent": number or null
}

Important:
- Return null for any field not found in the document
- Extract numbers without currency symbols or commas
- Phone numbers should be in format: +1XXXXXXXXXX
- State should be 2-letter code (e.g., CA, NY)
- Ensure all JSON is valid and properly formatted
`;
```

4. **Confidence Scoring**:
   - Calculate average confidence based on how many fields were successfully extracted
   - Return confidence score (0-1) in metadata

5. **File Storage** (optional):
   - Upload original PDF to S3
   - Store S3 URL in response
   - Set expiration policy (e.g., 30 days)

---

## 2. User Registration & Authentication APIs

### 2.1 Check Phone Number

**Endpoint**: `POST /api/v1/auth/check-phone`

**Description**: Check if a phone number is already registered.

**Authentication**: Not required

**Request Body**:
```typescript
{
  phone: string; // Format: +1XXXXXXXXXX (US only)
}
```

**Response**: `200 OK`
```typescript
{
  exists: boolean;
  message?: string; // "Phone number is available" or "This number is already registered"
}
```

**Validation**:
- US phone number format: `+1XXXXXXXXXX` (11 digits total)
- Must start with +1

---

### 2.2 Send Verification Code

**Endpoint**: `POST /api/v1/auth/send-verification-code`

**Description**: Send a 6-digit verification code via SMS to the provided phone number.

**Authentication**: Not required

**Request Body**:
```typescript
{
  phone: string; // Format: +1XXXXXXXXXX
  purpose: "registration" | "password-reset"; // default: "registration"
}
```

**Response**: `200 OK`
```typescript
{
  verificationId: string; // UUID to reference this verification session
  expiresAt: string; // ISO 8601, 10 minutes from now
  message: "Verification code sent to your phone";
}
```

**Error Responses**:
```typescript
// 400 Bad Request
{
  statusCode: 400,
  message: "Invalid phone number format. Must be US number starting with +1",
  error: "Bad Request"
}

// 429 Too Many Requests
{
  statusCode: 429,
  message: "Too many verification requests. Please try again later.",
  error: "Too Many Requests"
}
```

**Implementation Details**:

1. **Generate Code**:
   - Generate random 6-digit numeric code
   - Store in Redis with 10-minute expiration
   ```typescript
   {
     key: `verification:${verificationId}`,
     value: {
       phone: "+1234567890",
       code: "123456",
       attempts: 0,
       purpose: "registration",
       createdAt: timestamp
     },
     ttl: 600 // 10 minutes
   }
   ```

2. **Send SMS via Twilio**:
   ```typescript
   await twilioClient.messages.create({
     body: `Your Clarence verification code is: ${code}. Valid for 10 minutes.`,
     to: phone,
     from: process.env.TWILIO_PHONE_NUMBER
   });
   ```

3. **Rate Limiting**:
   - Max 3 verification codes per phone per hour
   - Track in Redis: `rate-limit:phone:${phone}`

---

### 2.3 Verify Code

**Endpoint**: `POST /api/v1/auth/verify-code`

**Description**: Verify the SMS code entered by the user.

**Authentication**: Not required

**Request Body**:
```typescript
{
  verificationId: string; // From send-verification-code response
  code: string; // 6-digit code
}
```

**Response**: `200 OK`
```typescript
{
  verified: true;
  verificationToken: string; // Short-lived token for completing registration
  expiresAt: string; // ISO 8601, 15 minutes from now
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Invalid code
{
  statusCode: 400,
  message: "Invalid verification code. X attempts remaining.",
  error: "Bad Request"
}

// 404 Not Found - Verification session expired or not found
{
  statusCode: 404,
  message: "Verification session not found or expired.",
  error: "Not Found"
}

// 429 Too Many Requests - Max attempts exceeded
{
  statusCode: 429,
  message: "Too many failed attempts. Please request a new code.",
  error: "Too Many Requests"
}
```

**Implementation Details**:

1. **Verification Logic**:
   - Retrieve verification session from Redis
   - Compare code (case-insensitive if needed)
   - Increment attempt counter
   - Max 3 attempts per verification session

2. **Generate Verification Token**:
   - Short-lived JWT token valid for 15 minutes
   - Contains phone number and purpose
   - Used to complete registration without re-verifying

3. **Cleanup**:
   - Delete verification session from Redis after successful verification
   - Or keep for audit trail with `verified: true` flag

---

### 2.4 Register (Complete Registration)

**Endpoint**: `POST /api/v1/auth/register`

**Description**: Complete user registration by creating an account with a password.

**Authentication**: Not required (requires verificationToken)

**Request Body**:
```typescript
{
  verificationToken: string; // From verify-code response
  password: string; // Min 8 chars, must include uppercase, lowercase, number, special char
  email?: string; // Optional
  firstName?: string; // Optional
  lastName?: string; // Optional
}
```

**Response**: `201 Created`
```typescript
{
  user: {
    id: string; // UUID
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    createdAt: string; // ISO 8601
  };
  tokens: {
    accessToken: string; // JWT, valid for 15 minutes
    refreshToken: string; // JWT, valid for 7 days
    expiresIn: number; // seconds until accessToken expires (900)
  };
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Invalid verification token
{
  statusCode: 400,
  message: "Invalid or expired verification token.",
  error: "Bad Request"
}

// 400 Bad Request - Weak password
{
  statusCode: 400,
  message: [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one lowercase letter",
    "Password must contain at least one number",
    "Password must contain at least one special character"
  ],
  error: "Bad Request"
}

// 409 Conflict - User already exists
{
  statusCode: 409,
  message: "An account with this phone number already exists.",
  error: "Conflict"
}
```

**Implementation Details**:

1. **Validate Verification Token**:
   - Verify JWT token signature
   - Check expiration (15 minutes)
   - Extract phone number

2. **Password Validation**:
   - Min 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

3. **Password Hashing**:
   ```typescript
   import * as bcrypt from 'bcrypt';
   const saltRounds = 12;
   const hashedPassword = await bcrypt.hash(password, saltRounds);
   ```

4. **Create User**:
   - Insert into `users` table
   - Store hashed password
   - Store phone, email, firstName, lastName

5. **Generate Tokens**:
   - **Access Token**: JWT with 15-minute expiration
     ```typescript
     {
       sub: userId,
       phone: phone,
       type: 'access',
       iat: timestamp,
       exp: timestamp + 900
     }
     ```
   - **Refresh Token**: JWT with 7-day expiration
     ```typescript
     {
       sub: userId,
       phone: phone,
       type: 'refresh',
       jti: uuid(), // unique token ID for rotation
       iat: timestamp,
       exp: timestamp + 604800
     }
     ```

6. **Auto-login**:
   - Return both tokens immediately
   - User is logged in upon registration

7. **Optional**: Send welcome email

---

### 2.5 Login

**Endpoint**: `POST /api/v1/auth/login`

**Description**: Login with phone number and password.

**Authentication**: Not required

**Request Body**:
```typescript
{
  phone: string; // Format: +1XXXXXXXXXX
  password: string;
}
```

**Response**: `200 OK`
```typescript
{
  user: {
    id: string;
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    lastLoginAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**Error Responses**:
```typescript
// 401 Unauthorized
{
  statusCode: 401,
  message: "Invalid phone number or password.",
  error: "Unauthorized"
}

// 423 Locked - Account locked after too many failed attempts
{
  statusCode: 423,
  message: "Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.",
  error: "Locked"
}
```

**Implementation Details**:

1. **Find User by Phone**:
   - Query database for user with phone number
   - Return generic error if not found (don't reveal if user exists)

2. **Verify Password**:
   ```typescript
   const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
   ```

3. **Failed Login Tracking**:
   - Track failed attempts in Redis
   - Key: `failed-login:${phone}`
   - Lock account after 5 failed attempts for 15 minutes
   - Reset counter after successful login

4. **Update Last Login**:
   - Update `users.last_login_at` timestamp

5. **Generate Tokens**:
   - Generate access and refresh tokens (same as registration)

---

### 2.6 Refresh Token

**Endpoint**: `POST /api/v1/auth/refresh`

**Description**: Get a new access token using a refresh token.

**Authentication**: Not required (requires refresh token in body)

**Request Body**:
```typescript
{
  refreshToken: string;
}
```

**Response**: `200 OK`
```typescript
{
  accessToken: string; // New access token
  refreshToken: string; // New refresh token (rotation)
  expiresIn: number;
}
```

**Error Responses**:
```typescript
// 401 Unauthorized
{
  statusCode: 401,
  message: "Invalid or expired refresh token.",
  error: "Unauthorized"
}
```

**Implementation Details**:

1. **Verify Refresh Token**:
   - Validate JWT signature
   - Check expiration
   - Verify token type is 'refresh'
   - Check if token is blacklisted (in Redis)

2. **Refresh Token Rotation**:
   - Generate new access token
   - Generate new refresh token with new `jti`
   - Blacklist old refresh token (store `jti` in Redis)

3. **Security**:
   - Detect token reuse (if old token used again after refresh)
   - If reuse detected, invalidate all refresh tokens for that user

---

### 2.7 Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Description**: Logout and invalidate refresh token.

**Authentication**: Required (Bearer access token)

**Request Body**:
```typescript
{
  refreshToken: string;
}
```

**Response**: `204 No Content`

**Implementation Details**:

1. **Blacklist Refresh Token**:
   - Extract `jti` from refresh token
   - Add to Redis blacklist
   - Key: `blacklist:${jti}`
   - TTL: 7 days (same as refresh token expiration)

2. **Optional**: Blacklist access token
   - Add access token to blacklist if immediate logout needed
   - Key: `blacklist-access:${accessTokenJti}`
   - TTL: 15 minutes

---

### 2.8 Forgot Password (Request Reset)

**Endpoint**: `POST /api/v1/auth/forgot-password`

**Description**: Request a password reset code via SMS.

**Authentication**: Not required

**Request Body**:
```typescript
{
  phone: string; // Format: +1XXXXXXXXXX
}
```

**Response**: `200 OK`
```typescript
{
  resetId: string; // UUID to reference this reset session
  message: "Password reset code sent to your phone";
}
```

**Error Responses**:
```typescript
// 404 Not Found
{
  statusCode: 404,
  message: "No account found with this phone number.",
  error: "Not Found"
}

// 429 Too Many Requests
{
  statusCode: 429,
  message: "Too many reset requests. Please try again later.",
  error: "Too Many Requests"
}
```

**Implementation Details**:

1. **Verify User Exists**:
   - Check if phone number is registered
   - Return error if not found

2. **Generate Reset Code**:
   - Generate 6-digit code
   - Store in Redis with 15-minute expiration
   - Same structure as verification codes

3. **Send SMS**:
   ```typescript
   await twilioClient.messages.create({
     body: `Your Clarence password reset code is: ${code}. Valid for 15 minutes.`,
     to: phone,
     from: process.env.TWILIO_PHONE_NUMBER
   });
   ```

4. **Rate Limiting**:
   - Max 3 reset requests per phone per hour

---

### 2.9 Reset Password

**Endpoint**: `POST /api/v1/auth/reset-password`

**Description**: Reset password using the verification code.

**Authentication**: Not required

**Request Body**:
```typescript
{
  resetId: string; // From forgot-password response
  code: string; // 6-digit code from SMS
  newPassword: string;
}
```

**Response**: `200 OK`
```typescript
{
  message: "Password reset successful. You can now login with your new password.";
}
```

**Error Responses**:
```typescript
// 400 Bad Request
{
  statusCode: 400,
  message: "Invalid reset code.",
  error: "Bad Request"
}

// 404 Not Found
{
  statusCode: 404,
  message: "Reset session not found or expired.",
  error: "Not Found"
}
```

**Implementation Details**:

1. **Verify Reset Code**:
   - Retrieve reset session from Redis
   - Compare code
   - Max 3 attempts

2. **Validate New Password**:
   - Same validation rules as registration

3. **Update Password**:
   - Hash new password
   - Update in database
   - Delete reset session from Redis

4. **Invalidate All Sessions** (optional but recommended):
   - Blacklist all existing refresh tokens for this user
   - Force re-login with new password

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL, -- Format: +1XXXXXXXXXX
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  account_status VARCHAR(20) DEFAULT 'active', -- active, locked, suspended
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
```

### Redis Data Structures

#### Verification Sessions
```typescript
// Key: verification:{verificationId}
// TTL: 600 seconds (10 minutes)
{
  phone: string,
  code: string,
  attempts: number,
  purpose: "registration" | "password-reset",
  createdAt: number
}
```

#### Rate Limiting
```typescript
// Key: rate-limit:phone:{phone}
// TTL: 3600 seconds (1 hour)
{
  count: number, // Number of requests
  resetAt: number // Unix timestamp when counter resets
}

// Key: failed-login:{phone}
// TTL: 900 seconds (15 minutes)
{
  attempts: number,
  lockedUntil?: number // Unix timestamp
}
```

#### Token Blacklist
```typescript
// Key: blacklist:{jti}
// TTL: 604800 seconds (7 days)
{
  userId: string,
  blacklistedAt: number
}
```

---

## Error Response Format (Standardized)

All errors follow this structure:

```typescript
{
  statusCode: number; // HTTP status code
  message: string | string[]; // Error message(s)
  error: string; // Error type (e.g., "Bad Request", "Unauthorized")
  timestamp?: string; // ISO 8601 timestamp
  path?: string; // API endpoint path
}
```

---

## Security Features

### Authentication
- JWT tokens (access: 15 min, refresh: 7 days)
- Refresh token rotation (prevents token reuse)
- Token blacklisting for logout
- Bcrypt password hashing (cost factor 12)

### Rate Limiting
- **SMS Verification**: 3 codes per phone per hour
- **Login**: 5 failed attempts → 15-minute lockout
- **Password Reset**: 3 requests per phone per hour
- **API Global**: 100 requests/minute per IP (configurable)

### Input Validation
- Phone number format validation (US only: +1XXXXXXXXXX)
- Password strength validation
- Email format validation
- File type and size validation (PDF, max 5MB)

### Data Protection
- Password hashing with bcrypt
- HTTPS only (enforce in production)
- File upload scanning (optional: antivirus)
- SQL injection prevention (ORM parameterized queries)
- XSS prevention (input sanitization)

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clarence
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=clarence-documents

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (for document parsing)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-vision-preview

# OR Claude
ANTHROPIC_API_KEY=your-anthropic-api-key

# Server
PORT=3000
NODE_ENV=development
```

---

## Implementation Checklist

### Phase 1: Project Setup (Week 1)
- [ ] Initialize NestJS project
- [ ] Set up PostgreSQL database
- [ ] Set up Redis
- [ ] Configure TypeORM/Prisma
- [ ] Set up AWS S3 bucket
- [ ] Configure Twilio account
- [ ] Set up environment variables
- [ ] Create database migrations

### Phase 2: Document Parsing (Week 1-2)
- [ ] Create document-parsing module
- [ ] Implement file upload with validation
- [ ] Integrate LLM API (OpenAI/Claude)
- [ ] Implement PDF parsing logic
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Test with sample DEC pages

### Phase 3: Authentication & Registration (Week 2-3)
- [ ] Create auth module
- [ ] Create users module
- [ ] Create SMS service
- [ ] Implement phone verification flow
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT strategy
- [ ] Implement refresh token logic
- [ ] Implement forgot/reset password
- [ ] Add rate limiting
- [ ] Write unit and integration tests

### Phase 4: Testing & Documentation (Week 3-4)
- [ ] End-to-end testing
- [ ] API documentation (Swagger)
- [ ] Postman collection
- [ ] Performance testing
- [ ] Security audit

### Phase 5: Deployment (Week 4)
- [ ] Docker configuration
- [ ] CI/CD pipeline setup
- [ ] Deploy to staging
- [ ] Load testing
- [ ] Deploy to production

---

## API Testing Examples

### Using cURL

#### 1. Parse DEC Page
```bash
curl -X POST http://localhost:3000/api/v1/document-parsing/parse-decpage \
  -F "file=@/path/to/decpage.pdf"
```

#### 2. Send Verification Code
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "purpose": "registration"
  }'
```

#### 3. Verify Code
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "uuid-here",
    "code": "123456"
  }'
```

#### 4. Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "verificationToken": "token-from-verify-step",
    "password": "SecurePass123!",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### 5. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "password": "SecurePass123!"
  }'
```

#### 6. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

#### 7. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

---

## Next Steps

1. **Review this plan** and confirm requirements
2. **Choose LLM provider** (OpenAI GPT-4 Vision or Claude)
3. **Set up development environment**:
   - PostgreSQL
   - Redis
   - AWS S3
   - Twilio account
   - LLM API key
4. **Start implementation** with NestJS project setup
5. **Implement in order**: Document Parsing → Authentication → Testing

---

## Questions Before Implementation

1. **LLM Provider**: OpenAI GPT-4 Vision or Claude for PDF parsing?
2. **File Storage**: AWS S3 or alternative (Google Cloud Storage, Azure)?
3. **Database**: PostgreSQL or MySQL?
4. **Testing**: What test coverage % target?
5. **Documentation**: Need Swagger/OpenAPI documentation?
6. **Deployment**: Docker + Kubernetes or other?

---

**Document Version**: 2.0  
**Last Updated**: November 10, 2025  
**Status**: Ready for Implementation

