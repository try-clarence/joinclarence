# SMS Mock Mode - Local Development Guide

## Overview

For local development without a Twilio account, the backend supports **SMS Mock Mode**. This bypasses real SMS sending and uses a hardcoded OTP: **`111111`** for all verification flows.

---

## Quick Start

### Enable Mock Mode

Add this to your `.env` file:

```bash
SMS_MOCK_MODE=true
```

### Restart Server

```bash
npm run start:dev
```

You'll see this message in the logs:

```
[Nest] WARN [SmsService] 🔧 SMS MOCK MODE ENABLED - All SMS will be logged instead of sent. Use OTP: 111111
```

---

## How It Works

### 1. Code Generation

When `SMS_MOCK_MODE=true`, all OTP codes are hardcoded to **`111111`** instead of random 6-digit numbers.

**Code Location:** `backend/src/modules/auth/auth.service.ts`

```typescript
private generateCode(): string {
  const mockMode = this.configService.get('SMS_MOCK_MODE') === 'true';
  if (mockMode) {
    return '111111'; // Hardcoded for local dev
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### 2. SMS Sending

When `SMS_MOCK_MODE=true`, SMS messages are logged to the console instead of being sent via Twilio.

**Code Location:** `backend/src/modules/sms/sms.service.ts`

```typescript
private async sendSms(to: string, body: string): Promise<void> {
  if (this.mockMode) {
    this.logger.log(`📱 [MOCK SMS] To: ${to}`);
    this.logger.log(`📱 [MOCK SMS] Message: ${body}`);
    this.logger.log(`📱 [MOCK SMS] Use hardcoded OTP: 111111`);
    return; // Don't actually send
  }
  // ... real Twilio sending code
}
```

---

## Complete Registration Flow Example

### Step 1: Check Phone

```bash
curl -X POST http://localhost:3000/api/v1/auth/check-phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14155551234"}'
```

**Response:**
```json
{
  "exists": false,
  "message": "Phone number is available"
}
```

### Step 2: Send Verification Code

```bash
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14155551234","purpose":"registration"}'
```

**Response:**
```json
{
  "verificationId": "d5833108-e124-4a7c-8001-832f5458772f",
  "expiresAt": "2025-11-10T11:36:06.901Z",
  "message": "Verification code sent to your phone"
}
```

**Server Console:**
```
[Nest] 88543  - 6:26:06 PM   LOG [SmsService] 📱 [MOCK SMS] To: +14155551234
[Nest] 88543  - 6:26:06 PM   LOG [SmsService] 📱 [MOCK SMS] Message: Your Clarence verification code is: 111111. Valid for 10 minutes.
[Nest] 88543  - 6:26:06 PM   LOG [SmsService] 📱 [MOCK SMS] Use hardcoded OTP: 111111
```

### Step 3: Verify Code (Use 111111)

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "d5833108-e124-4a7c-8001-832f5458772f",
    "code": "111111"
  }'
```

**Response:**
```json
{
  "verified": true,
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-11-10T11:41:08.047Z"
}
```

### Step 4: Complete Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "password": "SecurePass123!",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "phone": "+14155551234",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-11-10T11:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

## Testing with HTTP Files

### Using `backend/api-tests/auth.http`

1. **Open** `backend/api-tests/auth.http` in VS Code with REST Client extension

2. **Find** the "Complete Registration Flow Example" section

3. **Execute** requests in sequence:
   - Step 1: Check phone → Get availability
   - Step 2: Send verification code → Get verificationId
   - Step 3: Verify code → **Use OTP: 111111** ✅
   - Step 4: Register → Get tokens

4. **Variables auto-extract**, so you just click "Send Request" for each step!

### Example HTTP Request

```http
### Verify code with hardcoded OTP in mock mode
POST {{baseUrl}}/auth/verify-code
Content-Type: application/json

{
  "verificationId": "{{verificationId}}",
  "code": "111111"
}
```

---

## Password Reset Flow

Mock mode also works for password reset:

### 1. Request Reset

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14155551234"}'
```

**Server Console:**
```
[SmsService] 📱 [MOCK SMS] To: +14155551234
[SmsService] 📱 [MOCK SMS] Message: Your Clarence password reset code is: 111111. Valid for 15 minutes.
[SmsService] 📱 [MOCK SMS] Use hardcoded OTP: 111111
```

### 2. Reset Password (Use 111111)

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetId": "uuid-from-previous-response",
    "code": "111111",
    "newPassword": "NewSecurePass123!"
  }'
```

---

## Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# SMS Mock Mode (Local Development)
# Set to "true" to bypass Twilio and use hardcoded OTP: 111111
SMS_MOCK_MODE=true

# Twilio (not needed when mock mode is enabled)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### When Mock Mode is Enabled

✅ **OTP is always:** `111111`  
✅ **SMS logged to console** instead of sent  
✅ **No Twilio credentials needed**  
✅ **No SMS charges**  
✅ **Faster testing**  

### When Mock Mode is Disabled

❌ **OTP is random** (6 digits)  
❌ **SMS sent via Twilio**  
❌ **Requires valid Twilio credentials**  
❌ **SMS charges apply**  
❌ **Real phone number needed**  

---

## Switching Between Modes

### Enable Mock Mode (Local Development)

```bash
# .env file
SMS_MOCK_MODE=true
```

```bash
# Restart server
npm run start:dev
```

**Result:** Use OTP `111111` for all verifications

### Disable Mock Mode (Production/Staging)

```bash
# .env file
SMS_MOCK_MODE=false
# or remove the line entirely
```

```bash
# Restart server
npm run start:dev
```

**Result:** Real SMS sent via Twilio with random OTPs

---

## Server Logs

### Startup Message

When mock mode is enabled, you'll see:

```
[Nest] WARN [SmsService] 🔧 SMS MOCK MODE ENABLED - All SMS will be logged instead of sent. Use OTP: 111111
```

### SMS Send Message

When verification code is sent:

```
[Nest] LOG [SmsService] 📱 [MOCK SMS] To: +14155551234
[Nest] LOG [SmsService] 📱 [MOCK SMS] Message: Your Clarence verification code is: 111111. Valid for 10 minutes.
[Nest] LOG [SmsService] 📱 [MOCK SMS] Use hardcoded OTP: 111111
```

---

## Benefits

### For Developers

✅ **No Twilio Account Needed** - Start developing immediately  
✅ **No Setup Required** - Just set `SMS_MOCK_MODE=true`  
✅ **Predictable Testing** - Always use `111111`  
✅ **Faster Iteration** - No waiting for real SMS  
✅ **No Costs** - No SMS charges during development  
✅ **Easier Debugging** - See all SMS in console logs  

### For Testing

✅ **Automated Testing** - Use `111111` in E2E tests  
✅ **CI/CD Friendly** - No external dependencies  
✅ **Consistent Behavior** - Same OTP every time  
✅ **Easy Verification** - No need to check phone  

---

## Security Considerations

⚠️ **WARNING:** Never enable `SMS_MOCK_MODE` in production!

### Production Checklist

- [ ] Set `SMS_MOCK_MODE=false` (or remove it)
- [ ] Configure real Twilio credentials
- [ ] Use environment-specific `.env` files
- [ ] Verify random OTP generation
- [ ] Test SMS delivery to real phones

### Environment Best Practices

```bash
# Local Development (.env.local)
SMS_MOCK_MODE=true

# Staging (.env.staging)
SMS_MOCK_MODE=false
TWILIO_ACCOUNT_SID=real-staging-sid
TWILIO_AUTH_TOKEN=real-staging-token

# Production (.env.production)
SMS_MOCK_MODE=false
TWILIO_ACCOUNT_SID=real-production-sid
TWILIO_AUTH_TOKEN=real-production-token
```

---

## Troubleshooting

### Mock Mode Not Working

**Problem:** Still trying to send real SMS

**Solution:**
1. Check `.env` file: `SMS_MOCK_MODE=true`
2. Restart the server: `npm run start:dev`
3. Look for startup message: "SMS MOCK MODE ENABLED"

### OTP 111111 Not Accepted

**Problem:** Verification fails with OTP `111111`

**Solution:**
1. Verify mock mode is enabled in logs
2. Check if you're using the correct `verificationId`
3. Make sure verification hasn't expired (10 min limit)
4. Clear Redis if needed: `docker exec clarence-redis redis-cli FLUSHALL`

### Not Seeing Mock SMS Logs

**Problem:** No `[MOCK SMS]` messages in console

**Solution:**
1. Check server logs: `tail -f /tmp/nest-start.log`
2. Verify SMS sending triggered (call send-verification-code API)
3. Check log level configuration

---

## Code Examples

### Frontend Integration

```typescript
// Send verification code
const response = await fetch('http://localhost:3000/api/v1/auth/send-verification-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+14155551234',
    purpose: 'registration'
  })
});

const { verificationId } = await response.json();

// In local dev, always use 111111
const otpCode = process.env.NODE_ENV === 'development' ? '111111' : userInput;

// Verify code
const verifyResponse = await fetch('http://localhost:3000/api/v1/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verificationId,
    code: otpCode
  })
});
```

### Testing

```typescript
// E2E Test with Mock Mode
describe('Registration Flow', () => {
  it('should register user with mock OTP', async () => {
    // Send verification code
    const sendResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/send-verification-code')
      .send({ phone: '+14155551234', purpose: 'registration' });
    
    const { verificationId } = sendResponse.body;
    
    // Verify with hardcoded OTP
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-code')
      .send({ verificationId, code: '111111' });
    
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.verified).toBe(true);
  });
});
```

---

## FAQ

### Q: Can I use a different OTP code?

**A:** Currently, the hardcoded OTP is `111111`. To change it, modify the `generateCode()` method in `auth.service.ts`.

### Q: Does this work for password reset too?

**A:** Yes! Mock mode applies to both registration verification and password reset flows.

### Q: Will this affect production?

**A:** No, as long as you set `SMS_MOCK_MODE=false` (or omit it) in production.

### Q: Can I see the real OTP code?

**A:** Yes, check the server console logs. The mock SMS message is logged with the OTP.

### Q: How do I test with real SMS?

**A:** Set `SMS_MOCK_MODE=false` and configure valid Twilio credentials.

### Q: Does this work in unit tests?

**A:** Yes! The tests mock Twilio completely, so they work regardless of mock mode.

---

## Related Files

### Implementation

- `backend/src/modules/sms/sms.service.ts` - SMS service with mock mode
- `backend/src/modules/auth/auth.service.ts` - OTP generation with mock mode
- `backend/.env` - Configuration file with `SMS_MOCK_MODE` flag

### Documentation

- `backend/README.md` - Main documentation
- `backend/QUICK_START.md` - Quick setup guide
- `backend/api-tests/auth.http` - HTTP request examples

### Testing

- `backend/src/modules/sms/sms.service.spec.ts` - SMS service tests
- `backend/src/modules/auth/auth.service.spec.ts` - Auth service tests
- `backend/test/auth.e2e-spec.ts` - E2E auth tests

---

## Summary

**Mock SMS Mode** is a developer-friendly feature that:

✅ Bypasses Twilio SMS sending  
✅ Uses hardcoded OTP: **`111111`**  
✅ Logs SMS to console  
✅ Requires no setup  
✅ Perfect for local development  

**To enable:** Add `SMS_MOCK_MODE=true` to `.env` and restart the server!

---

**Happy Coding! 🚀**

*Always use OTP `111111` in local development with mock mode enabled.*

