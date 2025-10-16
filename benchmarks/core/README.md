# Core Performance Benchmarks

This directory contains core performance benchmarks for om-data-mapper's fundamental mapping operations.

## 📊 Benchmarks

### simple.bench.ts
Tests basic property mapping performance.

**Scenarios:**
- Direct field mapping
- Simple transformations
- Baseline vanilla JavaScript comparison

**Expected Performance:** ~30M ops/sec

### complex.bench.ts
Tests complex transformation scenarios.

**Scenarios:**
- Nested object mapping
- Array transformations
- Custom transformation functions
- Multiple mapping strategies

**Expected Performance:** ~13M ops/sec

### nested.bench.ts
Tests deep nested property access.

**Scenarios:**
- Multi-level object traversal
- Deep property extraction
- Nested path resolution

**Expected Performance:** ~2.4M ops/sec

### array.bench.ts
Tests bulk array transformation performance.

**Scenarios:**
- Mapping 100 items
- Batch transformations
- Array processing efficiency

**Expected Performance:** ~1M ops/sec

### shared-mappers.ts
Shared mapper definitions used across benchmarks.

**Contains:**
- Decorator-based mapper classes
- Reusable type definitions
- Common test scenarios

## 🚀 Running Benchmarks

### Run All Core Benchmarks

```bash
# From project root
npm run bench:core

# Or from benchmarks directory
npx vitest bench core/
```

### Run Specific Benchmark

```bash
npx vitest bench core/simple.bench.ts
npx vitest bench core/complex.bench.ts
npx vitest bench core/nested.bench.ts
npx vitest bench core/array.bench.ts
```

### Watch Mode

```bash
npx vitest bench core/ --watch
```

## 📈 Understanding Results

### Output Format

```
✓ core/simple.bench.ts (4) 2345ms
  ✓ Simple Mapping Benchmark (2) 2344ms
    name                                hz     min     max    mean     p75     p99    p995    p999     rme  samples
  · OmDataMapper - Simple mapping  30,123,456  0.0001  0.0002  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.5%   100000
  · Vanilla - Simple mapping       28,456,789  0.0001  0.0002  0.0001  0.0001  0.0002  0.0002  0.0002  ±0.6%   100000
```

**Metrics:**
- **hz**: Operations per second (higher is better)
- **min/max**: Minimum and maximum execution time
- **mean**: Average execution time
- **p75/p99/p995/p999**: Percentile execution times
- **rme**: Relative margin of error (lower is better)
- **samples**: Number of test iterations

## 🎯 Performance Targets

| Benchmark | Target | Actual | Status |
|-----------|--------|--------|--------|
| Simple    | 25M ops/sec | ~30M ops/sec | ✅ Exceeds |
| Complex   | 10M ops/sec | ~13M ops/sec | ✅ Exceeds |
| Nested    | 2M ops/sec  | ~2.4M ops/sec | ✅ Exceeds |
| Array     | 800K ops/sec | ~1M ops/sec | ✅ Exceeds |

## 🔧 Adding New Benchmarks

1. Create a new `.bench.ts` file in this directory
2. Import Vitest bench utilities:
   ```typescript
   import { bench, describe } from 'vitest';
   import { Mapper } from '../../src/core/Mapper';
   ```

3. Define your benchmark:
   ```typescript
   describe('My Benchmark', () => {
     const mapper = Mapper.create({ /* ... */ });
     const data = { /* ... */ };

     bench('My test', () => {
       mapper.execute(data);
     });
   });
   ```

4. Run it:
   ```bash
   npx vitest bench core/my-benchmark.bench.ts
   ```

## 📚 Best Practices

1. **Keep benchmarks focused**: Test one thing at a time
2. **Use realistic data**: Test with production-like data sizes
3. **Include baselines**: Always compare against vanilla JavaScript
4. **Document expectations**: Note expected performance ranges
5. **Run multiple times**: Verify consistency across runs

## 🐛 Troubleshooting

### Benchmark Not Running

Make sure Vitest is installed:
```bash
npm install
```

### Inconsistent Results

- Close other applications
- Disable CPU frequency scaling
- Run multiple times and average
- Check for background processes

### Import Errors

Make sure you're importing from the correct paths:
```typescript
import { Mapper } from '../../src/core/Mapper';
```

## 📊 CI/CD Integration

These benchmarks run automatically in CI/CD:

- **On Pull Requests**: Results are compared against main branch
- **On Main Branch**: Results are stored for historical tracking
- **Performance Alerts**: Automatic alerts on regressions

## 🔗 Related

- [Comparison Benchmarks](../comparisons/) - Library comparisons
- [Main README](../README.md) - Benchmark overview
- [Vitest Bench Docs](https://vitest.dev/guide/features.html#benchmarking)

