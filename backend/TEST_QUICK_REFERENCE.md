# Test Quick Reference

Quick commands and examples for testing the Clarence AI Backend.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start services
docker-compose up -d

# 3. Run tests
npm test
```

---

## 📋 Common Test Commands

### Run All Tests
```bash
npm test                    # All unit tests
npm run test:e2e           # All E2E tests
npm run test:all           # Unit + E2E
npm run test:cov           # With coverage report
```

### Run Specific Tests
```bash
# Run specific file
npm test -- auth.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Run only unit tests (exclude E2E)
npm run test:unit
```

### Development Mode
```bash
npm run test:watch         # Auto-reload on changes
npm run test:debug         # Debug mode
```

---

## 📊 Test Coverage

### View Coverage Report
```bash
npm run test:cov

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage by Module
- **Auth**: 94%+ (30+ tests)
- **Document Parsing**: 91%+ (11 tests)
- **Users**: 93%+ (10 tests)
- **Redis**: 88%+ (10 tests)
- **SMS**: 76%+ (3 tests)
- **File Storage**: 74%+ (3 tests)

---

## 🧪 Test What You Changed

### After Changing Auth Code
```bash
npm test -- auth.service.spec.ts
npm run test:e2e -- auth.e2e-spec.ts
```

### After Changing Document Parsing
```bash
npm test -- document-parsing
npm run test:e2e -- document-parsing.e2e-spec.ts
```

### After Changing Database Schema
```bash
npm test -- users.service.spec.ts
npm run test:e2e
```

---

## 🔍 Debugging Failed Tests

### View Detailed Output
```bash
npm test -- --verbose
```

### Debug Single Test
```bash
# Set breakpoint in test file, then:
npm run test:debug -- your-test.spec.ts
```

### Check What Failed
```bash
# Failed tests show:
# - Test name
# - Expected vs Received
# - Stack trace with line numbers
```

---

## 🐛 Common Issues & Fixes

### "Connection refused" Error
```bash
# Database not running
docker-compose ps
docker-compose up -d
```

### "Port already in use"
```bash
# Kill process on port
lsof -ti:5432 | xargs kill    # PostgreSQL
lsof -ti:6379 | xargs kill    # Redis
```

### Tests Hanging
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

### Flaky Tests
```bash
# Run multiple times
npm test -- --repeat=5
```

### Clear Test Database
```bash
dropdb clarence_test
createdb clarence_test
npm run migration:run
```

---

## ✅ Pre-Commit Checklist

Before committing code:

```bash
# 1. Run all tests
npm run test:all

# 2. Check coverage
npm run test:cov

# 3. Lint code
npm run lint

# 4. Format code
npm run format

# All tests passing? ✅ Ready to commit!
```

---

## 📝 Test Examples

### Unit Test Example
```typescript
it('should create user', async () => {
  const user = await service.create('+14155551234', 'Pass123!');
  expect(user).toHaveProperty('id');
  expect(user.phone).toBe('+14155551234');
});
```

### E2E Test Example
```typescript
it('should register user', () => {
  return request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ 
      verificationToken: 'token',
      password: 'Pass123!' 
    })
    .expect(201)
    .expect(res => {
      expect(res.body).toHaveProperty('tokens');
    });
});
```

---

## 🎯 Test What Matters

### Must Test
- ✅ API endpoints (E2E)
- ✅ Business logic (unit)
- ✅ Error handling (unit + E2E)
- ✅ Validation (unit + E2E)
- ✅ Authentication (E2E)
- ✅ Database operations (unit)

### Nice to Test
- ✅ Edge cases
- ✅ Boundary conditions
- ✅ Race conditions
- ✅ Performance

### Don't Test
- ❌ Third-party libraries
- ❌ Framework internals
- ❌ Generated code
- ❌ Trivial getters/setters

---

## 📈 Improving Coverage

### Find Untested Code
```bash
npm run test:cov
# Look for red lines in coverage report
```

### Add Tests for New Code
```typescript
// 1. Create test file
touch src/modules/your-module/your-service.spec.ts

// 2. Write tests
describe('YourService', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});

// 3. Run tests
npm test -- your-service.spec.ts
```

---

## 🔐 Testing Auth Flow

### Complete Flow (E2E)
```bash
# Test entire registration → login flow
npm run test:e2e -- auth.e2e-spec.ts

# Takes ~5-10 seconds
# Tests 20+ scenarios
```

### Quick Unit Test
```bash
# Test just service logic
npm test -- auth.service.spec.ts

# Takes ~1-2 seconds
# Tests 30+ scenarios
```

---

## 📤 Testing Document Upload

### Test PDF Parsing
```bash
npm run test:e2e -- document-parsing.e2e-spec.ts
```

### Mock vs Real
- **Unit tests**: Mock S3, Mock OpenAI → Fast
- **E2E tests**: Real upload, Mock OpenAI → Realistic

---

## 🎓 Best Practices

### ✅ DO
- Run tests before committing
- Test both success and error cases
- Keep tests independent
- Use descriptive test names
- Clean up test data

### ❌ DON'T
- Skip failing tests
- Commit without running tests
- Make tests depend on each other
- Use hardcoded delays
- Test implementation details

---

## 🚦 CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: |
    npm test
    npm run test:e2e
    npm run test:cov
```

### Pre-Push Hook
```bash
# .git/hooks/pre-push
#!/bin/bash
npm run test:all
```

---

## 📚 More Info

- **Full Guide**: [TESTING.md](TESTING.md)
- **Test Summary**: [TEST_SUMMARY.md](TEST_SUMMARY.md)
- **Main README**: [README.md](README.md)

---

## 💡 Quick Tips

1. **Run tests often** - Catch issues early
2. **Use watch mode** - Auto-run on changes
3. **Read error messages** - They're descriptive!
4. **Check coverage** - Find gaps
5. **Mock external services** - Tests stay fast

---

## 📞 Need Help?

```bash
# View all test commands
npm run

# View Jest help
npm test -- --help

# View test files
find . -name "*.spec.ts"
find test -name "*.e2e-spec.ts"
```

---

**Happy Testing! 🧪**

Run `npm test` to get started!

