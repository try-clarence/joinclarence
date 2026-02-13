# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Clarence Insurance Platform repository.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Main continuous integration pipeline that runs on every push and pull request.

**Backend Jobs:**
- ✅ Lint Check
- ✅ Security Audit
- ✅ Unit Tests (96 tests)
- ✅ E2E Tests (12 quote-to-policy-flow tests)
- ✅ Build Check

**Carrier API Simulator Jobs:**
- ✅ Lint Check
- ✅ Security Audit
- ✅ Unit Tests
- ✅ E2E Tests
- ✅ Build Check

**Integration Test:**
- ✅ Full integration test with backend + carrier simulator
- ✅ Tests complete quote-to-policy flow

**Duration:** ~10-15 minutes

### 2. CodeQL Security Scan (`codeql.yml`)

Advanced security analysis using GitHub's CodeQL engine for both backend and carrier-api-simulator.

**Runs:**
- On push to main
- On pull requests
- Scheduled weekly (Mondays)

**Scans:**
- Backend codebase
- Carrier API Simulator codebase

## Project Structure

```
joinclarence_2/
├── backend/              # Clarence backend API
│   ├── src/
│   ├── test/
│   └── package.json
├── carrier-api-simulator/  # Mock carrier API for testing
│   ├── src/
│   ├── test/
│   └── package.json
└── .github/workflows/    # CI/CD workflows
```

## Workflow Dependencies

The workflows test both projects independently and then run integration tests:

1. **Backend tests** run with PostgreSQL service
2. **Carrier simulator tests** run standalone
3. **Integration tests** start carrier simulator and run backend E2E tests against it

## Environment Variables

### Backend E2E Tests
- `DATABASE_HOST`: localhost (PostgreSQL service)
- `DATABASE_PORT`: 5432
- `DATABASE_USERNAME`: postgres
- `DATABASE_PASSWORD`: postgres
- `DATABASE_NAME`: clarence_db
- `CARRIER_API_BASE_URL`: http://localhost:3001/api/v1
- `CARRIER_API_KEY`: test_clarence_key_123
- `JWT_SECRET`: test_jwt_secret_key_for_ci
- `SMS_MOCK_MODE`: true

## Local Testing

Before pushing, run:

```bash
# Backend
cd backend
npm run lint && npm run test:unit && npm run test:e2e && npm run build

# Carrier Simulator
cd carrier-api-simulator
npm run lint && npm test && npm run test:e2e && npm run build
```

## Status

All workflows are active and passing ✅

## Support

For issues with CI/CD:
1. Check workflow logs in Actions tab
2. Review individual project documentation:
   - Backend: `backend/TESTING_GUIDE.md`
   - Carrier Simulator: `carrier-api-simulator/CICD.md`
3. Open an issue with `ci/cd` label

