# Quick Start Guide

Get the Clarence AI Backend up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Redis 6+ installed (or use Docker)
- [ ] AWS S3 account (for file storage)
- [ ] Twilio account (for SMS)
- [ ] OpenAI API key (for document parsing)

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Database Services

**Option A: Using Docker (Recommended for Development)**

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check they're running
docker-compose ps
```

**Option B: Using Local Services**

```bash
# PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Redis (macOS with Homebrew)
brew services start redis
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

**Minimum Required Configuration:**

```env
# Database (if using docker-compose, these are already correct)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=clarence

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (CHANGE THESE!)
JWT_SECRET=change-this-to-a-random-secret-key
JWT_REFRESH_SECRET=change-this-to-another-random-secret-key

# AWS S3 (required for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_S3_BUCKET=your-bucket-name

# Twilio (required for SMS verification)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (required for document parsing)
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Create Database

```bash
# Create the database
createdb clarence

# Or using psql
psql -U postgres -c "CREATE DATABASE clarence;"
```

### 5. Run Migrations

```bash
npm run migration:run
```

### 6. Start the Server

```bash
# Development mode (with hot reload)
npm run start:dev
```

**You should see:**

```
🚀 Application is running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
```

## Testing the API

### 1. Check API is Running

```bash
curl http://localhost:3000/api/v1/health
```

### 2. Test Document Parsing (Mock Mode)

If OpenAI API key is not configured, the API will return mock data:

```bash
# Create a dummy PDF file
echo "Test PDF content" > test.pdf

# Upload it
curl -X POST http://localhost:3000/api/v1/document-parsing/parse-decpage \
  -F "file=@test.pdf"
```

### 3. Test Phone Registration Flow

**Step 1: Check phone availability**
```bash
curl -X POST http://localhost:3000/api/v1/auth/check-phone \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234"}'
```

**Step 2: Send verification code**
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "purpose": "registration"
  }'
```

**Check your phone for the SMS code (or check Twilio console)**

**Step 3: Verify code**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "PUT_VERIFICATION_ID_FROM_STEP_2",
    "code": "123456"
  }'
```

**Step 4: Complete registration**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "verificationToken": "PUT_TOKEN_FROM_STEP_3",
    "password": "SecurePass123!",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**You'll receive access and refresh tokens!**

### 4. Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155551234",
    "password": "SecurePass123!"
  }'
```

## Using Swagger Documentation

Visit: http://localhost:3000/api/docs

- Interactive API documentation
- Test all endpoints directly from browser
- See request/response schemas
- No need for curl commands!

## Common Issues & Solutions

### "Connection refused" error

**Problem:** Database or Redis not running

**Solution:**
```bash
# Check services
docker-compose ps

# Restart if needed
docker-compose restart
```

### "TWILIO_ACCOUNT_SID not found" warning

**Problem:** Twilio not configured

**Solution:** SMS will log to console instead of sending. To actually send SMS, add Twilio credentials to `.env`

### "OpenAI API key not configured" warning

**Problem:** OpenAI key not set

**Solution:** Document parsing will return mock data. To use real LLM parsing, add OpenAI API key to `.env`

### Port 3000 already in use

**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill
```

## Development Workflow

```bash
# Run in development mode (auto-reload on changes)
npm run start:dev

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test
```

## Production Deployment

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

**Important for Production:**
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Disable database auto-sync
- Enable proper logging
- Set up proper CORS origins
- Use environment-specific .env files

## What's Next?

1. ✅ **Explore Swagger Docs**: http://localhost:3000/api/docs
2. ✅ **Test all endpoints** using Postman or Swagger
3. ✅ **Integrate with frontend** 
4. ✅ **Add more features** as needed

## Need Help?

- Check the main README.md for detailed documentation
- Review the API_IMPLEMENTATION_PLAN.md for architecture details
- Check logs for error messages: they're very descriptive!

---

**Pro Tip:** Use docker-compose for development. It sets up PostgreSQL and Redis with zero configuration!

```bash
docker-compose up -d    # Start services
docker-compose logs -f  # View logs
docker-compose down     # Stop services
```

