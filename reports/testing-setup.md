# Testing Setup Guide

## Overview

The repository uses **Vitest** as the sole testing framework - a modern, fast, and Vite-powered testing solution.

## Test Structure

```
data-mapper/
├── tests/                 # All Vitest tests
│   ├── data-mapper.test.ts  # Main mapper functionality tests (17 tests)
│   ├── utils.test.ts        # Utility functions tests (12 tests)
│   └── smoke.test.ts        # Basic smoke tests (3 tests)
└── src/                   # Source code
    ├── Mapper.ts
    ├── utils.ts
    └── index.ts
```

**Total: 32 tests with 95.1% code coverage**

## Running Tests

### Run All Tests

```bash
npm test
```

This runs all Vitest tests with coverage reporting. Used by CI/CD pipeline.

**Output:**
- Runs all tests in `tests/` directory
- Generates coverage report with v8 provider
- Coverage thresholds: 50% lines, 50% functions, 30% branches, 50% statements
- **Current coverage: 95.1% statements, 71.42% branches, 100% functions**

### Watch Mode

```bash
npm run test:watch
```

Runs Vitest in watch mode for development. Tests automatically re-run when files change.

## Configuration

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
- ✅ Runs all tests in `tests/` directory
- ✅ v8 coverage provider (fast and accurate)
- ✅ Coverage thresholds enforced
- ✅ LCOV reports for Codecov integration

## Why Vitest?

**Advantages:**
- ⚡ **Faster execution** - Uses Vite for lightning-fast test runs
- 🔥 **Hot module replacement** - Instant feedback in watch mode
- 📦 **Better ESM support** - Native ES modules support
- 🎯 **Jest-compatible API** - Easy migration from Jest
- 🚀 **Better TypeScript support** - First-class TypeScript integration
- 🔧 **Unified tooling** - Same config as Vite (if using Vite for build)
- 📊 **Built-in coverage** - No additional setup needed

**Perfect for:**
- Unit tests
- Integration tests
- Smoke tests
- TDD/BDD workflows
- Modern TypeScript projects

## Writing Tests

### Test Example

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

**Note:** Always import `describe`, `it`, `expect` from `vitest` at the top of your test files.

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

**Current thresholds:**
- Lines: 50% (currently at 95.1% ✅)
- Functions: 50% (currently at 100% ✅)
- Branches: 30% (currently at 71.42% ✅)
- Statements: 50% (currently at 95.1% ✅)

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
1. Test files are in `tests/` directory
2. Test files have correct naming: `*.test.ts` or `*.spec.ts`
3. Dependencies are installed: `npm install`
4. Test files import from `vitest`: `import { describe, it, expect } from 'vitest'`

### Coverage not generated

**Check:**
1. Run with coverage: `npm test`
2. Check `coverage/` directory exists
3. Verify coverage configuration in `vitest.config.mts`
4. Ensure source files are in `src/` directory

### Tests fail with TypeScript errors

**Solution:**
1. Ensure TypeScript is installed: `npm install -D typescript`
2. Check `tsconfig.json` is properly configured
3. Verify imports are correct

## Best Practices

### 1. Follow AAA Pattern

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

### 2. Write Descriptive Test Names

```typescript
// ❌ Bad
it('test 1', () => { /* ... */ });

// ✅ Good
it('should map firstName to name property', () => { /* ... */ });
```

### 3. Test Edge Cases

```typescript
describe('Mapper', () => {
  it('should handle undefined values', () => { /* ... */ });
  it('should handle null values', () => { /* ... */ });
  it('should handle empty objects', () => { /* ... */ });
  it('should handle nested objects', () => { /* ... */ });
});
```

### 4. Keep Tests Isolated

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

## Summary

**Test Commands:**
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode

**Test Directory:**
- `tests/` - All Vitest tests (32 tests total)

**Test Files:**
- `tests/data-mapper.test.ts` - Main mapper functionality (17 tests)
- `tests/utils.test.ts` - Utility functions (12 tests)
- `tests/smoke.test.ts` - Basic smoke tests (3 tests)

**Coverage:**
- Current: 95.1% statements, 71.42% branches, 100% functions
- Thresholds: 50% lines, 50% functions, 30% branches, 50% statements
- Reports: `coverage/` directory (lcov.info, HTML reports)

**CI/CD:**
- Uses Vitest for automated testing
- Uploads coverage to Codecov
- Runs on every push and PR
- Fast execution with Vite-powered testing

**Key Features:**
- ⚡ Fast test execution
- 🔥 Hot module replacement in watch mode
- 📊 Built-in coverage reporting
- 🎯 Jest-compatible API
- 🚀 TypeScript first-class support

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

