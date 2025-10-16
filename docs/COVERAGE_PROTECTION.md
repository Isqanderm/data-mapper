# Code Coverage Protection

## Overview

This repository has **code coverage protection** enabled to ensure that code quality is maintained or improved with every pull request. Any PR that decreases the overall code coverage percentage will be **automatically blocked from merging**.

## How It Works

### Automated Coverage Checks

When you create a pull request, the CI/CD pipeline automatically:

1. **Runs tests on your PR branch** and collects coverage metrics
2. **Runs tests on the main branch** and collects coverage metrics
3. **Compares the coverage** across four key metrics:
   - **Lines coverage**
   - **Statements coverage**
   - **Functions coverage**
   - **Branches coverage**
4. **Fails the PR** if any metric decreases compared to the main branch
5. **Posts a comment** on your PR with a detailed coverage comparison

### Coverage Metrics

The following coverage metrics are tracked:

| Metric | Description | Current Threshold |
|--------|-------------|-------------------|
| **Lines** | Percentage of executable lines covered by tests | 70% |
| **Statements** | Percentage of statements executed by tests | 70% |
| **Functions** | Percentage of functions called by tests | 80% |
| **Branches** | Percentage of conditional branches tested | 70% |

### Zero Tolerance Policy

The coverage protection is configured with a **0% threshold**, meaning:

- ✅ **Coverage stays the same**: PR passes
- ✅ **Coverage increases**: PR passes
- ❌ **Coverage decreases by any amount**: PR is blocked

## What You'll See

### Successful Coverage Check

When your PR maintains or improves coverage, you'll see:

```
✅ Code Coverage Check
Status: PASSED - Coverage Maintained

Coverage Comparison
| Metric      | Main Branch | This PR | Change    | Status |
|-------------|-------------|---------|-----------|--------|
| Lines       | 85.50%      | 86.20%  | 📈 +0.70% | ✅     |
| Statements  | 84.30%      | 84.30%  | ➡️ +0.00% | ✅     |
| Functions   | 88.00%      | 89.50%  | 📈 +1.50% | ✅     |
| Branches    | 78.20%      | 78.20%  | ➡️ +0.00% | ✅     |

✅ Great Job!
Code coverage has been maintained or improved. This PR is ready for review.
```

### Failed Coverage Check

When your PR decreases coverage, you'll see:

```
❌ Code Coverage Check
Status: FAILED - Coverage Decreased

Coverage Comparison
| Metric      | Main Branch | This PR | Change    | Status |
|-------------|-------------|---------|-----------|--------|
| Lines       | 85.50%      | 84.20%  | 📉 -1.30% | ❌     |
| Statements  | 84.30%      | 83.10%  | 📉 -1.20% | ❌     |
| Functions   | 88.00%      | 88.00%  | ➡️ +0.00% | ✅     |
| Branches    | 78.20%      | 77.50%  | 📉 -0.70% | ❌     |

⚠️ Action Required
This PR decreases code coverage. Please add tests to cover the new/modified code before merging.

This check is blocking the PR from being merged.
```

## How to Fix Coverage Issues

If your PR is blocked due to decreased coverage, follow these steps:

### 1. Identify Uncovered Code

Run tests locally with coverage:

```bash
npm test
```

Open the coverage report in your browser:

```bash
open coverage/index.html
```

The HTML report will show you exactly which lines, functions, and branches are not covered by tests.

### 2. Add Tests

Write tests for the uncovered code. For example:

```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myNewFunction } from '../src/my-feature';

describe('myNewFunction', () => {
  it('should handle valid input', () => {
    const result = myNewFunction('valid');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    const result = myNewFunction('');
    expect(result).toBe('default');
  });

  it('should handle error conditions', () => {
    expect(() => myNewFunction(null)).toThrow();
  });
});
```

### 3. Verify Coverage Locally

Before pushing, verify that coverage has improved:

```bash
npm test
```

Check the output for coverage percentages:

```
Coverage Summary:
  Lines       : 86.20% ( 1234/1432 )
  Statements  : 84.30% ( 1156/1372 )
  Functions   : 89.50% ( 358/400 )
  Branches    : 78.20% ( 234/299 )
```

### 4. Push Your Changes

Once coverage is maintained or improved, push your changes:

```bash
git add .
git commit -m "test: add tests for new feature"
git push
```

The CI will re-run and the coverage check should pass.

## Configuration Files

### GitHub Actions Workflow

Coverage protection is implemented in `.github/workflows/ci.yml`:

- **Job**: `coverage-check`
- **Runs on**: All pull requests
- **Compares**: PR branch vs main branch
- **Blocks**: PR merge if coverage decreases

### Codecov Configuration

Additional coverage tracking via Codecov in `codecov.yml`:

- **Project coverage**: Must not decrease
- **Patch coverage**: New code must be tested
- **Threshold**: 0% (no drops allowed)

### Vitest Configuration

Test coverage settings in `vitest.config.mts`:

- **Provider**: v8
- **Reporters**: text, lcov, json, json-summary, html
- **Minimum thresholds**: Lines 70%, Functions 80%, Branches 70%, Statements 70%

## Best Practices

### Write Tests First (TDD)

Consider writing tests before implementing features:

1. Write a failing test
2. Implement the feature
3. Verify the test passes
4. Check coverage

### Aim for Meaningful Coverage

Don't just aim for 100% coverage. Focus on:

- **Critical paths**: Test the most important functionality
- **Edge cases**: Test boundary conditions
- **Error handling**: Test failure scenarios
- **Integration points**: Test how components work together

### Keep Tests Maintainable

- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Keep tests focused and simple
- Avoid testing implementation details

## Exemptions

In rare cases where coverage cannot be maintained (e.g., removing dead code), you can:

1. **Document the reason** in the PR description
2. **Request a review** from a maintainer
3. **Temporarily disable** the check (requires admin approval)

However, this should be exceptional and well-justified.

## Monitoring Coverage Trends

### Codecov Dashboard

View detailed coverage reports and trends:

- **URL**: https://codecov.io/gh/Isqanderm/data-mapper
- **Badge**: ![codecov](https://codecov.io/gh/Isqanderm/data-mapper/branch/main/graph/badge.svg)

### Local Coverage Reports

Generate and view coverage reports locally:

```bash
# Run tests with coverage
npm test

# Open HTML report
open coverage/index.html

# View JSON summary
cat coverage/coverage-summary.json
```

## Troubleshooting

### Coverage Check Fails But Tests Pass

This means your tests pass, but they don't cover all the code. Add more tests to cover the uncovered lines.

### Coverage Report Not Generated

Ensure you're running tests with coverage:

```bash
npm test  # This runs: vitest run --coverage
```

### False Positive Coverage Decrease

If you believe the coverage check is incorrect:

1. Check the coverage comparison in the PR comment
2. Verify the main branch coverage locally
3. Report the issue to maintainers

## Additional Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [Writing Good Tests](../CONTRIBUTING.md#testing)

---

**Remember**: Code coverage is a tool to help maintain quality, not a goal in itself. Write meaningful tests that verify behavior, not just increase percentages.

