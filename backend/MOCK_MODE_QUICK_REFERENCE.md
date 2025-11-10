# 🔧 SMS Mock Mode - Quick Reference

## Enable Mock Mode

```bash
# Add to .env file
SMS_MOCK_MODE=true
```

```bash
# Restart server
npm run start:dev
```

---

## Hardcoded OTP

```
111111
```

**Use this code for ALL verification flows when mock mode is enabled.**

---

## What Gets Mocked

✅ Registration verification codes  
✅ Password reset codes  
✅ SMS sending (logged to console instead)  

---

## Quick Test

```bash
# 1. Send code
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14155551234","purpose":"registration"}'

# 2. Verify with 111111
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"verificationId":"<ID_FROM_STEP_1>","code":"111111"}'
```

---

## Server Logs

**Startup:**
```
[WARN] 🔧 SMS MOCK MODE ENABLED - All SMS will be logged instead of sent. Use OTP: 111111
```

**SMS Sent:**
```
[LOG] 📱 [MOCK SMS] To: +14155551234
[LOG] 📱 [MOCK SMS] Message: Your Clarence verification code is: 111111. Valid for 10 minutes.
[LOG] 📱 [MOCK SMS] Use hardcoded OTP: 111111
```

---

## Disable for Production

```bash
# .env file
SMS_MOCK_MODE=false
# or remove the line
```

⚠️ **IMPORTANT:** Never use mock mode in production!

---

## Full Documentation

See `SMS_MOCK_MODE.md` for complete details.

