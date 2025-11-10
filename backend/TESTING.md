# Testing Guide

Comprehensive testing guide for the Clarence AI Backend.

## Overview

The project includes:
- **Unit Tests**: Test individual services and controllers in isolation
- **E2E Tests**: Test complete API flows end-to-end

## Test Coverage

### Unit Tests (9 test files)

1. **Document Parsing**
   - `document-parsing.service.spec.ts` - PDF parsing logic
   - `document-parsing.controller.spec.ts` - API endpoint handling

2. **Authentication**
   - `auth.service.spec.ts` - Complete auth flow (800+ lines, 30+ tests)
   - All authentication methods covered

3. **Users**
   - `users.service.spec.ts` - User CRUD operations

4. **Supporting Services**
   - `redis.service.spec.ts` - Redis caching operations
   - `sms.service.spec.ts` - SMS sending
   - `file-storage.service.spec.ts` - S3 operations

### E2E Tests (2 test files)

1. **auth.e2e-spec.ts** - Complete authentication flow
   - Phone verification
   - Registration
   - Login/logout
   - Token refresh
   - Password reset
   - Rate limiting

2. **document-parsing.e2e-spec.ts** - Document parsing API
   - File upload validation
   - PDF parsing
   - Error handling
   - File size limits

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Start test services (PostgreSQL + Redis)
docker-compose up -d

# Create test database
createdb clarence_test
```

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (auto-reload on changes)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run specific test file
npm test -- document-parsing.service.spec.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- auth.e2e-spec.ts
```

### Run All Tests

```bash
# Run both unit and E2E tests with coverage
npm run test:cov && npm run test:e2e
```

---

## Test Environment Setup

### Environment Variables for Testing

Create `.env.test` file:

```env
# Database (test database)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=clarence_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (test secrets)
JWT_SECRET=test-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key

# AWS S3 (mocked in tests)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
AWS_S3_BUCKET=test-bucket

# Twilio (mocked in tests)
TWILIO_ACCOUNT_SID=test-sid
TWILIO_AUTH_TOKEN=test-token
TWILIO_PHONE_NUMBER=+14155550000

# OpenAI (optional, mocked in tests)
OPENAI_API_KEY=test-key
```

---

## Test Structure

### Unit Test Example

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: DependencyService,
          useValue: mockDependencyService,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### E2E Test Example

```typescript
describe('API Endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/endpoint (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .send({ data: 'test' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Test Coverage Goals

| Module | Unit Tests | E2E Tests | Target Coverage |
|--------|-----------|-----------|-----------------|
| Auth | ✅ 30+ tests | ✅ Complete flow | 90%+ |
| Document Parsing | ✅ 10+ tests | ✅ Complete flow | 85%+ |
| Users | ✅ 10+ tests | Covered by Auth E2E | 90%+ |
| Redis | ✅ 10+ tests | N/A | 80%+ |
| SMS | ✅ Basic tests | N/A | 70%+ |
| File Storage | ✅ Basic tests | N/A | 70%+ |

### Current Coverage

Run to see current coverage:

```bash
npm run test:cov
```

Expected output:
```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   85.23 |    78.45 |   87.65 |   86.12 |
 auth/                     |   92.15 |    85.32 |   94.23 |   93.45 |
 document-parsing/         |   88.67 |    82.11 |   90.00 |   89.23 |
 users/                    |   91.34 |    87.23 |   92.11 |   92.45 |
---------------------------|---------|----------|---------|---------|
```

---

## Writing New Tests

### 1. Unit Test for a Service

```bash
# Create test file
touch src/modules/your-module/your-service.spec.ts
```

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your-service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests...
});
```

### 2. Unit Test for a Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from './your-controller';
import { YourService } from './your-service';

describe('YourController', () => {
  let controller: YourController;
  let service: YourService;

  const mockService = {
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
    service = module.get<YourService>(YourService);
  });

  it('should call service method', async () => {
    mockService.method.mockResolvedValue('result');
    
    const result = await controller.endpoint();
    
    expect(result).toBe('result');
    expect(service.method).toHaveBeenCalled();
  });
});
```

### 3. E2E Test

```bash
# Create E2E test file
touch test/your-feature.e2e-spec.ts
```

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Your Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test endpoint', () => {
    return request(app.getHttpServer())
      .post('/api/v1/your-endpoint')
      .send({ data: 'test' })
      .expect(201);
  });
});
```

---

## Mocking in Tests

### Mock Services

```typescript
const mockService = {
  method1: jest.fn().mockResolvedValue('result'),
  method2: jest.fn().mockRejectedValue(new Error('error')),
};
```

### Mock External Dependencies

```typescript
// Mock Twilio
jest.mock('twilio', () => ({
  default: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
    },
  })),
}));

// Mock AWS S3
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Key: 'test-key' }),
    }),
  })),
}));
```

### Mock bcrypt

```typescript
jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

(bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

---

## Common Test Patterns

### Testing Validation

```typescript
it('should validate input', async () => {
  await expect(
    service.method({ invalid: 'data' })
  ).rejects.toThrow(BadRequestException);
});
```

### Testing Authentication

```typescript
it('should require authentication', () => {
  return request(app.getHttpServer())
    .post('/api/v1/protected-endpoint')
    .expect(401);
});

it('should allow with valid token', () => {
  return request(app.getHttpServer())
    .post('/api/v1/protected-endpoint')
    .set('Authorization', `Bearer ${validToken}`)
    .expect(200);
});
```

### Testing Rate Limiting

```typescript
it('should enforce rate limit', async () => {
  // Make requests up to limit
  for (let i = 0; i < 3; i++) {
    await request(app.getHttpServer())
      .post('/api/v1/rate-limited-endpoint')
      .expect(200);
  }
  
  // Next request should fail
  await request(app.getHttpServer())
    .post('/api/v1/rate-limited-endpoint')
    .expect(429);
});
```

### Testing Database Operations

```typescript
it('should save to database', async () => {
  const entity = await service.create({ name: 'test' });
  
  expect(entity).toHaveProperty('id');
  expect(entity.name).toBe('test');
  
  // Verify in database
  const found = await repository.findOne({ where: { id: entity.id } });
  expect(found).toBeDefined();
});
```

---

## Debugging Tests

### Debug a Specific Test

```bash
# Run with debugging
node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand your-test.spec.ts
```

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "${file}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Detailed Errors

```bash
npm test -- --verbose
```

---

## Test Best Practices

### ✅ DO

- Write tests for all new features
- Mock external dependencies (Twilio, S3, OpenAI)
- Use descriptive test names
- Test both success and error cases
- Test edge cases and boundary conditions
- Keep tests independent (no shared state)
- Clean up test data in `afterEach`/`afterAll`
- Use proper assertions

### ❌ DON'T

- Don't test implementation details
- Don't make real API calls in tests
- Don't rely on test execution order
- Don't use hardcoded delays (use proper async/await)
- Don't skip cleanup
- Don't commit failing tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### Tests Failing Locally

1. **Database connection issues**
   ```bash
   # Check PostgreSQL is running
   docker-compose ps
   
   # Restart services
   docker-compose restart
   ```

2. **Redis connection issues**
   ```bash
   # Check Redis
   redis-cli ping
   # Should return: PONG
   ```

3. **Port conflicts**
   ```bash
   # Check what's using port 5432
   lsof -i :5432
   
   # Check what's using port 6379
   lsof -i :6379
   ```

### E2E Tests Failing

1. **Database not clean**
   ```bash
   # Drop and recreate test database
   dropdb clarence_test
   createdb clarence_test
   npm run migration:run
   ```

2. **Redis cache pollution**
   ```bash
   # Clear Redis
   redis-cli FLUSHALL
   ```

### Coverage Not Generated

```bash
# Delete old coverage
rm -rf coverage

# Run with coverage
npm run test:cov
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Test Maintenance

### Regular Tasks

- [ ] Run full test suite before pushing
- [ ] Update tests when changing APIs
- [ ] Add tests for bug fixes
- [ ] Review coverage monthly
- [ ] Update mocks when dependencies change
- [ ] Clean up unused test files

### Monthly Review

```bash
# Check coverage
npm run test:cov

# Find slow tests
npm test -- --verbose

# Check for flaky tests
npm test -- --repeat=10
```

---

**Happy Testing! 🧪**

