# API Testing with HTTP Files

This directory contains HTTP request files for manually testing the Clarence AI Backend APIs.

## Prerequisites

### Option 1: VS Code REST Client Extension (Recommended)

1. Install the **REST Client** extension in VS Code
   - Extension ID: `humao.rest-client`
   - Or search for "REST Client" in VS Code extensions

2. Open any `.http` file in VS Code

3. Click "Send Request" above any request, or use:
   - **macOS**: `Cmd + Alt + R`
   - **Windows/Linux**: `Ctrl + Alt + R`

### Option 2: IntelliJ IDEA / WebStorm

1. IntelliJ IDEA and WebStorm have built-in HTTP Client support

2. Open any `.http` file

3. Click the green play button next to any request

### Option 3: cURL (Command Line)

You can also convert these to cURL commands. Example:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155551234", "password": "SecurePass123!"}'
```

## Setup

1. **Start the backend server:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start PostgreSQL and Redis:**
   ```bash
   docker-compose up -d
   ```

3. **Verify server is running:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## File Structure

```
api-tests/
├── auth.http                    # Authentication API tests
├── carriers.http                # Carrier & carrier simulator API tests
├── quotes.http                  # Quotes & policies API tests
├── document-parsing.http        # Document parsing API tests
├── test-files/                  # Sample files for testing
│   └── sample-business.pdf      # Sample PDF for upload tests
└── README.md                    # This file
```

## Available Request Files

### 1. `auth.http` - Authentication APIs

**Complete Registration Flow:**
1. Check phone availability
2. Send SMS verification code
3. Verify SMS code
4. Complete registration with password

**Login & Session Management:**
- Login with phone + password
- Refresh access token
- Logout and invalidate tokens

**Password Recovery:**
- Request password reset
- Reset password with SMS code

**Features:**
- ✅ Variables are extracted automatically from responses
- ✅ Includes error test cases
- ✅ Complete end-to-end flow examples
- ✅ All 9 authentication endpoints covered

### 2. `carriers.http` - Carrier Integration & Simulator APIs

**Carrier Simulator Tests (Port 3001):**
- Health checks for all 4 carriers
- Get commercial insurance quotes
- Get personal insurance quotes
- Multi-coverage quote requests
- Policy binding
- Certificate generation

**Clarence Backend Carrier APIs (Port 3000):**
- List all carriers
- Check carrier health
- Get carrier details

**Features:**
- ✅ Direct carrier simulator testing
- ✅ All 4 carriers (Reliable, TechShield, Premier, FastBind)
- ✅ Commercial and personal insurance examples
- ✅ Complete API request formats per schema

### 3. `quotes.http` - Quote & Policy Management APIs

**Quote Request Flow:**
- Create quote request (unauthenticated)
- Select coverages
- Link to user (after registration)
- Submit for carrier quotes
- View quotes from multiple carriers

**Policy Management:**
- Bind policy from quote
- View user policies
- Update policy settings
- Cancel policy

**Features:**
- ✅ Complete quote-to-policy workflow
- ✅ Multi-carrier quote comparison
- ✅ Policy lifecycle management
- ✅ Error case testing

### 4. `document-parsing.http` - Document Parsing API

**Upload & Parse:**
- Upload PDF files
- Extract business information (30+ fields)
- Get confidence scores
- Receive S3 URLs

**Features:**
- ✅ PDF file upload examples
- ✅ Error cases (wrong format, too large, missing file)
- ✅ Expected response format documented

## Usage Examples

### Testing Complete Registration Flow

1. Open `auth.http`

2. Execute requests in sequence:
   ```
   1. Check Phone → Get phone availability
   2. Send Verification Code → Get verificationId
   3. Verify Code → Get verificationToken
   4. Register → Get accessToken & refreshToken
   ```

3. Variables are automatically extracted and can be used in subsequent requests!

### Testing Complete Quote-to-Policy Flow

1. **Authenticate First** (in `auth.http`):
   - Send verification code
   - Register/Login
   - Get accessToken and userId

2. **Create Quote** (in `quotes.http`):
   - Create quote request (#1) → Get quoteRequestId
   - Select coverages (#4)
   - Link to user (#6)

3. **Submit to Carriers** (in `quotes.http`):
   - Submit quote (#7) → Triggers carrier API calls
   - Wait 10 seconds ⏰
   - Get quotes (#9) → See quotes from 4 carriers

4. **Bind Policy** (in `quotes.http`):
   - Bind selected quote (#10)
   - View policy (#11, #12)

### Testing Carrier Simulator Directly

1. Open `carriers.http`

2. Test carrier health:
   ```
   GET /carriers/reliable_insurance/health
   ```

3. Request quote directly from carrier:
   ```
   POST /carriers/reliable_insurance/quote
   (with full business info payload)
   ```

4. Compare response format with Clarence backend

### Testing Document Upload

1. Open `document-parsing.http`

2. **Option A**: Upload actual PDF file
   - Place your PDF in `test-files/sample-business.pdf`
   - Execute the request
   - The file will be uploaded and parsed

2. **Option B**: Use inline test content
   - Execute the "inline content" request
   - Mock data will be returned (since OpenAI is not configured)

### Using Extracted Variables

Variables are automatically extracted from responses:

```http
### Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: {{contentType}}

{
  "phone": "+14155551234",
  "password": "SecurePass123!"
}

###
# Extract token
@accessToken = {{login.response.body.tokens.accessToken}}

### Use the token in next request
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}
```

## Testing Strategy

### 1. Smoke Test (Quick Check)

Test one request from each file to verify APIs are working:

```http
# Check health
GET http://localhost:3000/api/v1/health

# Test auth
POST http://localhost:3000/api/v1/auth/check-phone

# Test document parsing
POST http://localhost:3000/api/v1/document-parsing/parse-decpage
```

### 2. Complete Flow Test

Follow the complete registration flow in `auth.http`:
1. ✅ Check phone
2. ✅ Send code
3. ✅ Verify code
4. ✅ Register
5. ✅ Login
6. ✅ Refresh token
7. ✅ Logout

### 3. Error Testing

Test error scenarios:
- Invalid phone formats
- Wrong passwords
- Expired codes
- Invalid tokens
- File size limits
- Wrong file types

## Tips & Tricks

### 1. Environment Variables

You can modify the base URL for different environments:

```http
@baseUrl = http://localhost:3000/api/v1    # Local
# @baseUrl = https://api-dev.example.com/api/v1    # Dev
# @baseUrl = https://api.example.com/api/v1        # Prod
```

### 2. Save Response to File

In VS Code REST Client:

```http
# @name myRequest
POST {{baseUrl}}/some-endpoint

###
# Response saved automatically
# Click "Save Response" button to save to file
```

### 3. Check Server Logs

When testing, keep an eye on the server console:

```bash
# In backend directory
npm run start:dev

# You'll see:
# [Nest] 12345  - 11/10/2025, 5:00:00 PM   LOG [SmsService] SMS sent to +14155551234
```

### 4. Getting SMS Codes

**Development Mode:**
- SMS codes are logged to the console
- Check your terminal running `npm run start:dev`
- Look for: `Your Clarence verification code is: 123456`

**With Real Twilio:**
- Codes are sent to your phone via SMS
- Check your phone messages

### 5. File Upload Testing

Create a test file:

```bash
# Create test files directory
mkdir -p backend/api-tests/test-files

# Create a simple PDF (or use any real PDF)
echo "Test PDF content" > backend/api-tests/test-files/sample-business.pdf
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:** Start the backend server
```bash
cd backend
npm run start:dev
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Start PostgreSQL
```bash
docker-compose up -d postgres
```

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Start Redis
```bash
docker-compose up -d redis
```

### 401 Unauthorized

**Problem:** Access token expired or invalid

**Solution:** 
1. Login again to get new token
2. Or use refresh token endpoint

### 404 Not Found

**Problem:** API endpoint not found

**Solution:**
1. Check the URL path is correct
2. Verify API prefix: `/api/v1/`
3. Check server is running

### 400 Bad Request

**Problem:** Invalid request data

**Solution:**
1. Check request body format
2. Verify required fields are present
3. Check data types (string vs number)
4. Review validation errors in response

## VS Code REST Client Features

### Send Request
- Click "Send Request" above any `###` separator
- Or use shortcut: `Cmd/Ctrl + Alt + R`

### View Response
- Response appears in split pane
- Formatted JSON with syntax highlighting
- Headers, status code, and timing shown

### Response History
- Click history icon to see previous responses
- Compare different API responses

### Generate Code Snippet
- Right-click on request
- Select "Generate Code Snippet"
- Get cURL, fetch, axios, etc.

## Common Workflows

### Create New User

```http
1. Check phone → verify available
2. Send code → get verificationId
3. Verify code → get verificationToken
4. Register → get tokens
```

### Login Existing User

```http
1. Login → get accessToken & refreshToken
2. Use accessToken for authenticated requests
3. Refresh when needed
```

### Upload Document

```http
1. Prepare PDF file
2. Upload via parse-decpage endpoint
3. Receive extracted business data
```

### Reset Password

```http
1. Forgot password → get resetId
2. Check SMS for code
3. Reset password → success
4. Login with new password
```

## Next Steps

1. **Create Test Account:**
   - Use the registration flow
   - Save your credentials

2. **Test All Endpoints:**
   - Go through each `.http` file
   - Execute all requests
   - Verify responses

3. **Explore Error Cases:**
   - Try invalid inputs
   - Test edge cases
   - Verify error messages

4. **Integration Testing:**
   - Test complete user journeys
   - Verify data persistence
   - Check token expiration

## Resources

- [REST Client Extension Docs](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [HTTP File Format](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html)
- [API Documentation](http://localhost:3000/api/docs) - Swagger UI when server is running

## Support

If you encounter issues:

1. Check server logs
2. Verify all services are running
3. Review error responses
4. Check the API documentation at `/api/docs`

---

**Happy Testing! 🚀**

