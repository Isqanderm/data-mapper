# om-data-mapper v4.1.0 Release Announcement

## 🎉 om-data-mapper v4.1.0 is now available!

We're excited to announce the release of **om-data-mapper v4.1.0** - a quality-focused release that validates our exceptional performance claims with comprehensive testing infrastructure.

---

## 📝 Quick Summary

Version 4.1.0 adds **68 new tests** across 5 advanced testing categories, proving that our JIT-compiled validation system is **production-ready** with:

- ✅ **518 tests** with **100% pass rate**
- ✅ **95.08% statement coverage**, **77.58% branch coverage**
- ✅ **70-909x faster** than baseline performance targets
- ✅ **No memory leaks** detected in stress tests
- ✅ **~2,000 property-based checks** with random data

---

## 🎯 Key Achievements

### 1. Property-Based Testing (25 tests, ~2,000 checks)
Using **fast-check** library to test validators with thousands of randomly generated inputs, catching edge cases that traditional tests miss.

### 2. Integration Tests (5 real-world scenarios)
Complete validation pipeline tests including user registration, API requests, forms, and nested object transformations.

### 3. Benchmark Regression Tests (7 tests)
Performance validation with 10% tolerance ensuring no degradation over time:
- Simple validation: **217x faster** 🚀
- Complex validation: **909x faster** 🚀
- Nested arrays: **600x faster** 🚀

### 4. Memory Leak Tests (6 stress tests)
3,000-10,000 iterations proving **zero memory leaks** in production scenarios.

### 5. Branch Coverage Tests (25 tests)
Targeted tests improving code coverage to **77.58%** branches.

---

## 📦 Installation

```bash
npm install om-data-mapper@4.1.0
```

Or update your `package.json`:

```json
{
  "dependencies": {
    "om-data-mapper": "^4.1.0"
  }
}
```

---

## 💡 Usage Example

```typescript
import { IsString, MinLength, IsNumber, Min, validate } from 'om-data-mapper/class-validator-compat';

class CreateUserDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsNumber()
  @Min(0)
  age!: number;
}

const user = new CreateUserDto();
user.name = 'Jo';  // Too short
user.age = -5;     // Too small

const errors = await validate(user);
// Validation errors returned
```

---

## 🔗 Links

- **GitHub Release**: https://github.com/Isqanderm/data-mapper/releases/tag/v4.1.0
- **Full Changelog**: https://github.com/Isqanderm/data-mapper/blob/main/CHANGELOG.md#410---2025-10-16
- **Documentation**: https://github.com/Isqanderm/data-mapper/blob/main/docs/validation-usage.md
- **Pull Request**: https://github.com/Isqanderm/data-mapper/pull/23

---

## 🙏 Thank You!

Thank you for using om-data-mapper! This release demonstrates our commitment to quality and production-ready code.

For questions, issues, or feature requests, please visit our [GitHub repository](https://github.com/Isqanderm/data-mapper).

---

# Twitter/X Announcement (Short Version)

🎉 om-data-mapper v4.1.0 is out!

✅ 518 tests (100% pass rate)
✅ 95% statement coverage
✅ 70-909x faster than baseline
✅ Zero memory leaks
✅ ~2,000 property-based checks

Production-ready validation with JIT compilation! 🚀

📦 npm install om-data-mapper@4.1.0

🔗 https://github.com/Isqanderm/data-mapper/releases/tag/v4.1.0

#TypeScript #JavaScript #Validation #Performance #OpenSource

---

# GitHub Discussions Post

## 🎉 om-data-mapper v4.1.0 Released - Comprehensive Testing Infrastructure

Hi everyone!

I'm thrilled to announce the release of **om-data-mapper v4.1.0**! This is a quality-focused release that validates our exceptional performance claims with comprehensive testing infrastructure.

### What's New

This release adds **68 new tests** across 5 advanced testing categories:

1. **Property-Based Testing** (25 tests, ~2,000 checks) - Using fast-check to catch edge cases
2. **Integration Tests** (5 real-world scenarios) - Complete validation pipeline tests
3. **Benchmark Regression Tests** (7 tests) - Performance validation (70-909x faster!)
4. **Memory Leak Tests** (6 stress tests) - Proving zero memory leaks
5. **Branch Coverage Tests** (25 tests) - Improving coverage to 77.58%

### Key Metrics

- ✅ **518 tests** with **100% pass rate**
- ✅ **95.08% statement coverage**, **77.58% branch coverage**
- ✅ **70-909x faster** than baseline performance targets
- ✅ **No memory leaks** detected in stress tests
- ✅ **~2,000 property-based checks** with random data

### Installation

```bash
npm install om-data-mapper@4.1.0
```

### Links

- **GitHub Release**: https://github.com/Isqanderm/data-mapper/releases/tag/v4.1.0
- **Full Changelog**: https://github.com/Isqanderm/data-mapper/blob/main/CHANGELOG.md#410---2025-10-16
- **Documentation**: https://github.com/Isqanderm/data-mapper/blob/main/docs/validation-usage.md

### Migration

No migration needed! This is a backward-compatible release. Simply update to v4.1.0 and all existing code will continue to work.

### What's Next?

This release demonstrates our commitment to quality and production-ready code. Future releases will continue to maintain this high standard while adding new features.

Thank you for using om-data-mapper! 🚀

---

# README Badge Update

If you want to add a badge to your README.md, you can use:

## Version Badge

```markdown
[![npm version](https://img.shields.io/npm/v/om-data-mapper.svg)](https://www.npmjs.com/package/om-data-mapper)
```

## Test Coverage Badge

```markdown
[![Coverage](https://img.shields.io/badge/coverage-95.08%25-brightgreen.svg)](https://github.com/Isqanderm/data-mapper)
```

## Performance Badge

```markdown
[![Performance](https://img.shields.io/badge/performance-70--909x%20faster-brightgreen.svg)](https://github.com/Isqanderm/data-mapper/blob/main/benchmarks/README.md)
```

## Tests Badge

```markdown
[![Tests](https://img.shields.io/badge/tests-518%20passing-brightgreen.svg)](https://github.com/Isqanderm/data-mapper)
```

---

# Dev.to / Medium Article Outline

## Title
**om-data-mapper v4.1.0: Proving Performance Claims with Comprehensive Testing**

## Sections

### Introduction
- Brief overview of om-data-mapper
- Why testing matters for performance claims
- What's new in v4.1.0

### Property-Based Testing
- What is property-based testing?
- Why we chose fast-check
- Examples of edge cases caught
- Code examples

### Performance Validation
- Benchmark regression tests
- How we ensure no performance degradation
- Results: 70-909x faster than baseline
- Comparison charts

### Memory Safety
- Why memory leaks matter
- Our stress testing approach
- Results: Zero leaks detected
- Best practices for memory management

### Integration Testing
- Real-world scenarios
- Why integration tests matter
- Examples from our test suite

### Conclusion
- Quality-focused development
- Production-ready validation
- What's next for om-data-mapper

### Call to Action
- Try om-data-mapper v4.1.0
- Contribute to the project
- Share your feedback

---

# Reddit Post (r/typescript, r/javascript, r/node)

## Title
**om-data-mapper v4.1.0: High-performance validation with comprehensive testing (70-909x faster, zero memory leaks)**

## Body

Hey everyone!

I just released **om-data-mapper v4.1.0** - a quality-focused release that proves our performance claims with comprehensive testing.

**Key highlights:**

- ✅ 518 tests with 100% pass rate
- ✅ 95.08% statement coverage, 77.58% branch coverage
- ✅ 70-909x faster than baseline performance targets
- ✅ Zero memory leaks detected in stress tests
- ✅ ~2,000 property-based checks with random data

**What's new:**

This release adds 68 new tests across 5 categories:

1. **Property-based testing** (25 tests) - Using fast-check to catch edge cases
2. **Integration tests** (5 scenarios) - Real-world validation pipelines
3. **Benchmark regression tests** (7 tests) - Ensuring no performance degradation
4. **Memory leak tests** (6 stress tests) - 3,000-10,000 iterations
5. **Branch coverage tests** (25 tests) - Improving code coverage

**Why this matters:**

om-data-mapper provides a high-performance alternative to class-validator with JIT compilation. This release proves that our performance claims are real and the code is production-ready.

**Installation:**

```bash
npm install om-data-mapper@4.1.0
```

**Links:**

- GitHub: https://github.com/Isqanderm/data-mapper
- Release: https://github.com/Isqanderm/data-mapper/releases/tag/v4.1.0
- Docs: https://github.com/Isqanderm/data-mapper/blob/main/docs/validation-usage.md

Would love to hear your feedback!

---

**End of Announcement Document**

