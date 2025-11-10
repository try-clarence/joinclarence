# Clarence AI Backend

Backend API for Clarence AI Insurance Platform built with NestJS.

## Features

✅ **Document Parsing**: Upload PDF files and extract business information using LLM (OpenAI GPT-4 Vision)  
✅ **Phone-based Authentication**: Register and login with US phone numbers  
✅ **SMS Verification**: Secure phone verification via Twilio  
✅ **JWT Authentication**: Access and refresh tokens with rotation  
✅ **Password Management**: Secure password reset flow  
✅ **Rate Limiting**: Protection against abuse  
✅ **File Storage**: AWS S3 integration for document uploads  

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: AWS S3
- **LLM**: OpenAI GPT-4 Vision
- **SMS**: Twilio
- **Authentication**: JWT (Passport)

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- AWS S3 account
- Twilio account
- OpenAI API key

## Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=clarence

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=clarence-documents

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-vision-preview
```

### 3. Set Up PostgreSQL Database

```bash
# Create database
createdb clarence

# Or using psql
psql -U postgres
CREATE DATABASE clarence;
\q
```

### 4. Run Database Migrations

```bash
npm run migration:run
```

### 5. Start Redis

```bash
# Using Homebrew (macOS)
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 redis:7
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Document Parsing

```bash
POST /api/v1/document-parsing/parse-decpage
```

Upload a PDF file to extract business information.

### Authentication

```bash
POST /api/v1/auth/check-phone          # Check if phone is registered
POST /api/v1/auth/send-verification-code # Send SMS verification code
POST /api/v1/auth/verify-code           # Verify SMS code
POST /api/v1/auth/register              # Complete registration
POST /api/v1/auth/login                 # Login with phone + password
POST /api/v1/auth/refresh               # Refresh access token
POST /api/v1/auth/logout                # Logout
POST /api/v1/auth/forgot-password       # Request password reset
POST /api/v1/auth/reset-password        # Reset password
```

## Testing the APIs

### 1. Parse DEC Page

```bash
curl -X POST http://localhost:3000/api/v1/document-parsing/parse-decpage \
  -F "file=@/path/to/your/document.pdf"
```

### 2. Register a New User

**Step 1: Send verification code**
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "purpose": "registration"
  }'
```

**Step 2: Verify the code**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "uuid-from-step-1",
    "code": "123456"
  }'
```

**Step 3: Complete registration**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "verificationToken": "token-from-step-2",
    "password": "SecurePass123!",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "password": "SecurePass123!"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                    # Authentication module
│   │   │   ├── dto/                 # Data transfer objects
│   │   │   ├── strategies/          # JWT strategies
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/                   # User management
│   │   │   ├── entities/
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── document-parsing/        # Document parsing with LLM
│   │   │   ├── dto/
│   │   │   ├── document-parsing.controller.ts
│   │   │   ├── document-parsing.service.ts
│   │   │   └── document-parsing.module.ts
│   │   ├── sms/                     # SMS service (Twilio)
│   │   ├── redis/                   # Redis service
│   │   └── file-storage/            # AWS S3 service
│   ├── common/
│   │   ├── decorators/              # Custom decorators
│   │   ├── filters/                 # Exception filters
│   │   ├── guards/                  # Auth guards
│   │   └── interceptors/            # Response interceptors
│   ├── migrations/                  # Database migrations
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── package.json
└── README.md
```

## Security Features

- ✅ Phone number verification (US only)
- ✅ Password strength validation (8+ chars, upper/lower/number/special)
- ✅ bcrypt password hashing (cost 12)
- ✅ JWT access tokens (15 min) + refresh tokens (7 days)
- ✅ Refresh token rotation
- ✅ Token blacklisting on logout
- ✅ Rate limiting (SMS: 3/hour, Login attempts: 5)
- ✅ Account lockout after failed login attempts (15 min)
- ✅ CORS protection
- ✅ Input validation and sanitization

## Environment-Specific Notes

### Development
- Database auto-sync is enabled
- Detailed SQL logging is enabled
- Mock data returned if OpenAI API key not configured

### Production
- Disable database auto-sync
- Use migrations for schema changes
- Enable proper logging
- Set strong JWT secrets
- Configure proper CORS origins

## Testing

The project includes comprehensive unit and E2E tests:

```bash
# Run all unit tests (110+ tests)
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage report
npm run test:cov

# Run in watch mode
npm run test:watch
```

**Test Coverage:**
- ✅ 110+ tests across all modules
- ✅ 87%+ code coverage
- ✅ Complete E2E flows for auth and document parsing
- ✅ All critical paths tested

See **[TESTING.md](TESTING.md)** for complete testing guide.

## Useful Commands

```bash
# Development
npm run start:dev        # Start with hot reload
npm run build            # Build for production
npm run start:prod       # Start production build

# Database
npm run migration:generate  # Generate migration from entities
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:cov         # Generate coverage report
npm run test:all         # Run all tests

# Code Quality
npm run lint             # Lint and fix
npm run format           # Format code with Prettier
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d clarence
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### SMS Not Sending
- Verify Twilio credentials in `.env`
- Check Twilio account balance
- Ensure phone number is verified in Twilio (trial accounts)

### OpenAI API Issues
- Verify API key is correct
- Check OpenAI account has credits
- Model `gpt-4-vision-preview` requires GPT-4 API access

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs

Interactive API documentation with request/response examples.

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Clarence AI Platform

