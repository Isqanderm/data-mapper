# 🛡️ Coverage Protection - Quick Reference

## TL;DR

**Your PR must maintain or improve code coverage to be merged.**

## Quick Commands

```bash
# Check coverage locally
npm test

# View coverage report
open coverage/index.html

# Watch mode while developing
npm run test:watch
```

## What You'll See in Your PR

### ✅ Passing Check
```
✅ Code Coverage Check
Status: PASSED - Coverage Maintained

Coverage maintained or improved. Ready for review!
```

### ❌ Failing Check
```
❌ Code Coverage Check
Status: FAILED - Coverage Decreased

Action Required: Add tests to cover new/modified code.
This check is blocking the PR from being merged.
```

## How to Fix Coverage Issues

### Step 1: Run Tests Locally
```bash
npm test
```

### Step 2: Open Coverage Report
```bash
open coverage/index.html
```

### Step 3: Find Uncovered Code
Look for:
- 🔴 **Red lines**: Not covered at all
- 🟡 **Yellow lines**: Partially covered (branches)
- 🟢 **Green lines**: Fully covered

### Step 4: Write Tests
```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/my-feature';

describe('myFunction', () => {
  it('should handle valid input', () => {
    expect(myFunction('test')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('default');
  });

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Step 5: Verify Coverage Improved
```bash
npm test
# Check that coverage percentages increased
```

### Step 6: Push Changes
```bash
git add .
git commit -m "test: add tests for new feature"
git push
```

## Coverage Metrics Explained

| Metric | What It Measures | Example |
|--------|------------------|---------|
| **Lines** | Executable lines run by tests | `const x = 1;` |
| **Statements** | Individual statements executed | `return x + 1;` |
| **Functions** | Functions called by tests | `function foo() {}` |
| **Branches** | Conditional paths tested | `if (x) {} else {}` |

## Common Scenarios

### Adding New Code
✅ **Do**: Write tests for all new functions/classes
❌ **Don't**: Add code without corresponding tests

### Fixing Bugs
✅ **Do**: Add a test that reproduces the bug first
❌ **Don't**: Fix without adding a regression test

### Refactoring
✅ **Do**: Ensure existing tests still pass
❌ **Don't**: Remove tests during refactoring

### Removing Dead Code
✅ **Do**: Coverage should improve automatically
❌ **Don't**: Worry - removing untested code is good!

## Tips for Good Coverage

### 1. Test Happy Paths
```typescript
it('should process valid data', () => {
  const result = processData({ valid: true });
  expect(result).toBeDefined();
});
```

### 2. Test Edge Cases
```typescript
it('should handle empty input', () => {
  expect(processData({})).toEqual({});
});

it('should handle null', () => {
  expect(processData(null)).toBeNull();
});
```

### 3. Test Error Conditions
```typescript
it('should throw on invalid input', () => {
  expect(() => processData('invalid')).toThrow();
});
```

### 4. Test All Branches
```typescript
// If you have: if (condition) { A } else { B }
// Test both:
it('should execute A when condition is true', () => {
  // test A
});

it('should execute B when condition is false', () => {
  // test B
});
```

## Troubleshooting

### "Coverage summary not found"
**Problem**: Tests didn't generate coverage report
**Solution**: Run `npm test` (not `npm run test:watch`)

### "Coverage decreased but I added tests"
**Problem**: New code added more than tests covered
**Solution**: Add more tests to cover all new code paths

### "Tests pass locally but fail in CI"
**Problem**: Different environment or missing files
**Solution**: Ensure all test files are committed

### "Coverage report shows wrong files"
**Problem**: Stale coverage data
**Solution**: Delete `coverage/` folder and run `npm test` again

## Need Help?

1. 📖 Read the [Full Coverage Guide](../docs/COVERAGE_PROTECTION.md)
2. 📝 Check [Contributing Guidelines](../CONTRIBUTING.md)
3. 💬 Ask in your PR comments
4. 🐛 Open an issue if you think there's a bug

## Remember

- Coverage is a **quality tool**, not a goal
- Write **meaningful tests** that verify behavior
- Focus on **critical paths** and **edge cases**
- **100% coverage ≠ bug-free code**
- Good tests make refactoring easier

---

**Coverage Protection Status**: ✅ Active
**Policy**: Zero-tolerance for coverage drops
**Enforcement**: Automatic PR blocking

