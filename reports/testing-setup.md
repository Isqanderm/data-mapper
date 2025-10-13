# Testing Setup Guide

## Overview

The repository uses **two testing frameworks** in parallel:

1. **Vitest** (Primary) - Modern, fast testing framework for new tests
2. **Jest** (Legacy) - Maintained for backward compatibility with existing tests

## Test Structure

```
data-mapper/
├── __test__/              # Jest tests (legacy)
│   ├── data-mapper.test.ts
│   └── utils.test.ts
├── tests/                 # Vitest tests (new)
│   └── smoke.test.ts
└── src/                   # Source code
    ├── Mapper.ts
    ├── utils.ts
    └── index.ts
```

## Running Tests

### Primary Test Command (Vitest)

```bash
npm test
```

This runs Vitest with coverage reporting. Used by CI/CD pipeline.

**Output:**
- Runs tests in `tests/` directory
- Generates coverage report with v8 provider
- Coverage thresholds: 50% lines, 50% functions, 30% branches, 50% statements

### Jest Tests (Legacy)

```bash
npm run test:jest
```

This runs Jest tests for backward compatibility.

**Output:**
- Runs tests in `__test__/` directory
- Generates coverage report with v8 provider
- Higher coverage (~97%) due to comprehensive existing tests

### Run All Tests

```bash
npm run test:all
```

This runs both Jest and Vitest tests sequentially.

### Watch Mode

**Vitest watch mode:**
```bash
npm run test:watch
```

**Jest watch mode:**
```bash
npm run test:watch:jest
```

## Configuration

### Vitest Configuration

**File:** `vitest.config.mts`

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 30,
        statements: 50,
      },
    },
  },
});
```

**Key Features:**
- ✅ Node.js environment
- ✅ Global test functions (describe, it, expect)
- ✅ Only runs tests in `tests/` directory
- ✅ v8 coverage provider
- ✅ Coverage thresholds enforced

### Jest Configuration

**File:** `jest.config.ts`

```typescript
const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: [
    '**/__test__/**/*.[jt]s?(x)',
    '**/__tests__/**/*.[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/', // Ignore Vitest tests
  ],
};
```

**Key Features:**
- ✅ Only runs tests in `__test__/` and `__tests__/` directories
- ✅ Ignores `tests/` directory (Vitest tests)
- ✅ v8 coverage provider
- ✅ Automatic mock clearing

## Why Two Testing Frameworks?

### Vitest (Primary)

**Advantages:**
- ⚡ Faster execution (uses Vite)
- 🔥 Hot module replacement in watch mode
- 📦 Better ESM support
- 🎯 Modern API compatible with Jest
- 🚀 Better TypeScript support

**Use for:**
- New tests
- Integration tests
- Smoke tests
- Quick validation tests

### Jest (Legacy)

**Advantages:**
- 📚 Comprehensive existing test suite
- 🔒 Stable and well-tested
- 📖 Extensive documentation
- 🌍 Large community

**Use for:**
- Maintaining existing tests
- Backward compatibility
- Complex mocking scenarios

## Writing Tests

### Vitest Test Example

**File:** `tests/example.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Mapper } from '../src';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const mapper = Mapper.create({
      name: 'firstName',
    });

    // Act
    const { result } = mapper.execute({ firstName: 'John' });

    // Assert
    expect(result).toEqual({ name: 'John' });
  });
});
```

### Jest Test Example

**File:** `__test__/example.test.ts`

```typescript
import { Mapper } from '../src';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const mapper = Mapper.create({
      name: 'firstName',
    });

    // Act
    const { result } = mapper.execute({ firstName: 'John' });

    // Assert
    expect(result).toEqual({ name: 'John' });
  });
});
```

**Note:** Jest tests don't need to import `describe`, `it`, `expect` - they're global.

## Coverage Reports

### Viewing Coverage

After running tests with coverage:

```bash
# View in terminal
npm test

# View HTML report
open coverage/index.html
```

### Coverage Files

- `coverage/lcov.info` - LCOV format (used by Codecov)
- `coverage/index.html` - HTML report
- `coverage/lcov-report/` - Detailed HTML reports

### Coverage Thresholds

**Vitest thresholds:**
- Lines: 50%
- Functions: 50%
- Branches: 30%
- Statements: 50%

**To increase thresholds**, edit `vitest.config.mts`:

```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80,
}
```

## CI/CD Integration

### GitHub Actions

The CI workflow runs Vitest tests:

```yaml
- run: npm test
```

This ensures:
- ✅ All tests pass
- ✅ Coverage thresholds are met
- ✅ Coverage report is uploaded to Codecov

### Pre-publish Hook

The `prepublishOnly` script runs tests before publishing:

```json
"prepublishOnly": "npm run clean && npm run test && npm run build"
```

This ensures:
- ✅ Tests pass before publishing to npm
- ✅ Build succeeds
- ✅ No broken code is published

## Troubleshooting

### Error: "Vitest cannot be imported in a CommonJS module"

**Symptom:**
```
Vitest cannot be imported in a CommonJS module using require()
```

**Cause:** Jest is trying to run Vitest tests.

**Solution:** Already fixed! Jest now ignores `tests/` directory.

### Error: "Cannot find module 'vitest'"

**Symptom:**
```
Cannot find module 'vitest'
```

**Solution:**
```bash
npm install
```

### Tests not running

**Check:**
1. Test files are in correct directories:
   - Vitest: `tests/**/*.test.ts`
   - Jest: `__test__/**/*.test.ts`
2. Test files have correct naming: `*.test.ts` or `*.spec.ts`
3. Dependencies are installed: `npm install`

### Coverage not generated

**Check:**
1. Run with coverage flag: `npm test` (Vitest) or `npm run test:jest` (Jest)
2. Check `coverage/` directory exists
3. Verify coverage configuration in `vitest.config.mts` or `jest.config.ts`

## Best Practices

### 1. Use Vitest for New Tests

Write new tests using Vitest for better performance and modern features.

### 2. Maintain Jest Tests

Keep existing Jest tests for backward compatibility. Don't migrate unless necessary.

### 3. Follow AAA Pattern

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = { /* ... */ };
  
  // Act - Execute the code
  const result = someFunction(input);
  
  // Assert - Verify the result
  expect(result).toBe(expected);
});
```

### 4. Write Descriptive Test Names

```typescript
// ❌ Bad
it('test 1', () => { /* ... */ });

// ✅ Good
it('should map firstName to name property', () => { /* ... */ });
```

### 5. Test Edge Cases

```typescript
describe('Mapper', () => {
  it('should handle undefined values', () => { /* ... */ });
  it('should handle null values', () => { /* ... */ });
  it('should handle empty objects', () => { /* ... */ });
  it('should handle nested objects', () => { /* ... */ });
});
```

### 6. Keep Tests Isolated

Each test should be independent and not rely on other tests.

```typescript
// ❌ Bad - Tests depend on each other
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); });

// ✅ Good - Tests are isolated
it('test 1', () => {
  const state = 'value';
  expect(state).toBe('value');
});
```

## Migration Guide (Jest → Vitest)

If you want to migrate a Jest test to Vitest:

1. **Move the file:**
   ```bash
   mv __test__/example.test.ts tests/example.test.ts
   ```

2. **Add imports:**
   ```typescript
   import { describe, it, expect } from 'vitest';
   ```

3. **Update mocks (if any):**
   ```typescript
   // Jest
   jest.mock('./module');
   
   // Vitest
   vi.mock('./module');
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Summary

**Test Commands:**
- `npm test` - Run Vitest tests with coverage (primary)
- `npm run test:jest` - Run Jest tests with coverage (legacy)
- `npm run test:all` - Run both Jest and Vitest tests
- `npm run test:watch` - Vitest watch mode
- `npm run test:watch:jest` - Jest watch mode

**Test Directories:**
- `tests/` - Vitest tests (new)
- `__test__/` - Jest tests (legacy)

**Coverage:**
- Vitest: 50% thresholds
- Jest: ~97% coverage (existing tests)
- Reports: `coverage/` directory

**CI/CD:**
- Uses Vitest for automated testing
- Uploads coverage to Codecov
- Runs on every push and PR

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

