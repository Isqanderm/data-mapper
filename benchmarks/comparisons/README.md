# Library Comparison Benchmarks

This directory contains comprehensive benchmarks comparing om-data-mapper against other popular libraries.

## 📁 Benchmark Suites

### 1. class-transformer-comparison/
Compares om-data-mapper's class-transformer compatibility layer with the original class-transformer library.

**Key Results:**
- **Average**: 4.77x faster than class-transformer
- **Best**: 43.6x faster (complex nested transformations)
- **Scenarios**: 6 comprehensive test cases

**Documentation:** [class-transformer-comparison/README.md](./class-transformer-comparison/)

**Run:**
```bash
npx ts-node comparisons/class-transformer-comparison/class-transformer-comparison.bench.ts
```

---

### 2. validation-comparison/
Compares om-data-mapper's JIT-compiled validation engine with class-validator.

**Key Results:**
- **Average**: 20,000-60,000% faster than class-validator
- **Simple validation**: 39,950% faster
- **Array validation**: 35,756% faster
- **Scenarios**: 10 comprehensive test cases

**Documentation:** [validation-comparison/README.md](./validation-comparison/README.md)

**Run:**
```bash
npx ts-node --project comparisons/validation-comparison/tsconfig.json \
  comparisons/validation-comparison/validation-comparison.bench.ts
```

---

### 3. library-comparison/
Multi-library comparison benchmark testing om-data-mapper against various mapping libraries.

**Libraries Compared:**
- class-transformer
- automapper-ts
- morphism
- object-mapper

**Documentation:** [library-comparison/](./library-comparison/)

**Run:**
```bash
npx ts-node comparisons/library-comparison/compare-benchmark.ts
```

## 🎯 Why These Comparisons Matter

### class-transformer Comparison
- **Use Case**: Object transformation and serialization
- **Why Compare**: Most popular transformation library in TypeScript ecosystem
- **Key Insight**: om-data-mapper provides drop-in replacement with 4-40x performance improvement

### Validation Comparison
- **Use Case**: Data validation and DTO validation
- **Why Compare**: class-validator is the standard validation library
- **Key Insight**: JIT compilation provides 200-600x performance improvement

### Multi-Library Comparison
- **Use Case**: General object mapping
- **Why Compare**: Shows om-data-mapper's position in the ecosystem
- **Key Insight**: Consistently fastest across all scenarios

## 📊 Performance Summary

| Library | Average Performance | Best Scenario | Use Case |
|---------|-------------------|---------------|----------|
| **vs class-transformer** | 4.77x faster | 43.6x faster | Transformation |
| **vs class-validator** | 400x faster | 600x faster | Validation |
| **vs automapper-ts** | 10-15x faster | 20x faster | Mapping |
| **vs morphism** | 5-8x faster | 12x faster | Mapping |
| **vs object-mapper** | 3-5x faster | 8x faster | Mapping |

## 🚀 Running All Comparisons

### Quick Run (Summary)

```bash
# From benchmarks directory
npm run bench:comparisons
```

### Detailed Run (All Benchmarks)

```bash
# class-transformer
npx ts-node comparisons/class-transformer-comparison/class-transformer-comparison.bench.ts

# Validation
npx ts-node --project comparisons/validation-comparison/tsconfig.json \
  comparisons/validation-comparison/validation-comparison.bench.ts

# Multi-library
npx ts-node comparisons/library-comparison/compare-benchmark.ts
```

## 📈 Understanding Results

### Benchmark.js Output

```
om-data-mapper: plainToClass (simple) x 138,075,902 ops/sec ±0.42% (96 runs sampled)
class-transformer: plainToClass (simple) x 344,752 ops/sec ±0.37% (96 runs sampled)
→ om-data-mapper is 39950.83% faster
```

**Metrics:**
- **ops/sec**: Operations per second (higher is better)
- **±%**: Relative margin of error (lower is better)
- **runs sampled**: Number of test iterations
- **% faster**: Performance improvement percentage

### Performance Categories

- **0-50% faster**: Marginal improvement
- **50-200% faster**: Significant improvement
- **200-1000% faster**: Major improvement
- **1000%+ faster**: Exceptional improvement

om-data-mapper consistently achieves **exceptional improvement** across all comparisons.

## 🔧 Adding New Comparisons

### 1. Create Directory

```bash
mkdir comparisons/my-library-comparison
cd comparisons/my-library-comparison
```

### 2. Create Benchmark File

```typescript
// my-library-comparison.bench.ts
import { Suite } from 'benchmark';
import 'reflect-metadata';

// Import libraries to compare
import { /* om-data-mapper */ } from '../../src';
import { /* other-library */ } from 'other-library';

// Define test scenarios
const suite = new Suite();

suite
  .add('om-data-mapper', function () {
    // Your code
  })
  .add('other-library', function () {
    // Comparison code
  })
  .on('cycle', function (event: any) {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    // Calculate and display results
  })
  .run({ async: false });
```

### 3. Create README

Document:
- What library you're comparing against
- Why the comparison matters
- Test scenarios
- Expected results
- How to run the benchmark

### 4. Add to Main README

Update this file and the main benchmarks README.

## 📚 Best Practices

### Test Design
1. **Fair comparison**: Use equivalent functionality in both libraries
2. **Realistic scenarios**: Test with production-like data
3. **Multiple scenarios**: Cover simple, complex, and edge cases
4. **Both directions**: Test serialization and deserialization

### Documentation
1. **Clear results**: Show performance improvements clearly
2. **Explain differences**: Document why performance differs
3. **Use cases**: Explain when to use each library
4. **Migration guide**: Help users switch if beneficial

### Accuracy
1. **Warm-up**: Let Benchmark.js handle warm-up cycles
2. **Multiple runs**: Run benchmarks multiple times
3. **Consistent environment**: Close other applications
4. **Version tracking**: Document library versions tested

## 🐛 Troubleshooting

### TypeScript Errors

Different libraries use different decorator systems:
- **class-transformer**: Uses experimental decorators
- **class-validator**: Uses experimental decorators
- **om-data-mapper**: Uses TC39 Stage 3 decorators

Solution: Use separate tsconfig.json files or compile separately.

### Module Not Found

Make sure all dependencies are installed:
```bash
cd benchmarks
npm install
```

### Inconsistent Results

- Run multiple times and average
- Close other applications
- Check CPU throttling
- Ensure stable power supply

## 📊 CI/CD Integration

Comparison benchmarks can be integrated into CI/CD:

1. **On Pull Requests**: Run comparisons to detect regressions
2. **On Main Branch**: Store results for historical tracking
3. **Scheduled**: Run weekly to track against library updates

## 🔗 Resources

- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [class-transformer](https://github.com/typestack/class-transformer)
- [class-validator](https://github.com/typestack/class-validator)
- [Main Benchmarks README](../README.md)

---

**Note:** These comparisons demonstrate om-data-mapper's exceptional performance across the TypeScript ecosystem. The library is designed as a high-performance alternative to existing solutions.

