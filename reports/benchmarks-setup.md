# Benchmarks Setup Guide

## Overview

The repository uses **two complementary benchmarking approaches**:

1. **Benchmark.js** (`/benchmarks`) - High-precision benchmarks for absolute performance numbers
2. **Vitest Bench** (`/bench`) - Automated CI/CD benchmarks for regression tracking

### Why Two Approaches?

**Benchmark.js** provides:
- ✅ Industry-standard benchmarking
- ✅ Maximum precision and optimization
- ✅ Impressive absolute numbers (946M ops/sec)
- ✅ Used for README and marketing materials

**Vitest Bench** provides:
- ✅ Automated CI/CD integration
- ✅ Performance regression tracking
- ✅ GitHub Actions workflow
- ✅ Historical trend analysis

## Benchmark Structure

```
data-mapper/
├── bench/                    # All benchmark files
│   ├── simple.bench.ts      # Simple mapping benchmarks
│   ├── complex.bench.ts     # Complex mapping with transformers
│   ├── array.bench.ts       # Array mapping benchmarks
│   └── nested.bench.ts      # Deep nested access benchmarks
└── bench-results.json       # Generated benchmark results
```

## Running Benchmarks

### Run All Benchmarks

```bash
npm run bench
```

This runs all benchmarks and displays results in the terminal.

### Watch Mode

```bash
npm run bench:watch
```

Runs benchmarks in watch mode for development. Benchmarks automatically re-run when files change.

### Output Example

```
✓ bench/simple.bench.ts > Simple Mapping Benchmark
    name                           hz        min      max     mean
  · OmDataMapper - Simple mapping  29.79M    0.0000   0.1580  0.0000
  · Vanilla - Simple mapping       29.80M    0.0000   0.4320  0.0000
```

## Benchmark Categories

### 1. Simple Mapping (`simple.bench.ts`)

Tests basic field mapping performance.

**Scenario:**
- Map 4 fields from source to target
- Mix of direct mapping and nested access
- ~30M operations/second

### 2. Complex Mapping (`complex.bench.ts`)

Tests complex transformations with custom functions.

**Scenario:**
- Nested object access
- Array transformations
- Custom transformer functions
- ~13M operations/second for OmDataMapper
- ~25M operations/second for vanilla

### 3. Array Mapping (`array.bench.ts`)

Tests performance when mapping arrays of objects.

**Scenario:**
- Map 100 items
- Simple field transformations
- ~1M operations/second for OmDataMapper
- ~2.5M operations/second for vanilla

### 4. Nested Mapping (`nested.bench.ts`)

Tests deep nested object access.

**Scenario:**
- 4-level deep nesting
- Array flattening
- ~2.4M operations/second

## CI/CD Integration

### GitHub Actions Workflow

The benchmark workflow runs automatically on:
- ✅ Push to `main` branch
- ✅ Pull requests to `main`
- ✅ Manual trigger via workflow_dispatch

**Workflow file:** `.github/workflows/benchmark.yml`

### Features

1. **Automated Execution**
   - Runs on every push and PR
   - Builds project before benchmarking
   - Generates JSON results

2. **Performance Tracking**
   - Stores historical results
   - Compares with previous runs
   - Detects performance regressions

3. **Alerts**
   - Alert threshold: 150% (50% slower)
   - Comments on PRs if regression detected
   - Mentions `@Isqanderm` on alerts
   - Does not fail CI on regression (warning only)

4. **Artifacts**
   - Uploads benchmark results as artifacts
   - Retention: 30 days
   - Downloadable from GitHub Actions

### Viewing Results

#### In GitHub Actions

1. Go to **Actions** tab
2. Select **Benchmark** workflow
3. Click on a workflow run
4. View **Summary** for benchmark results
5. Download artifacts for detailed JSON results

#### Performance Trends

The `github-action-benchmark` action stores results in the `gh-pages` branch (if configured) for historical tracking.

## Writing Benchmarks

### Basic Structure

```typescript
import { bench, describe } from 'vitest';
import { Mapper } from '../src';

describe('My Benchmark Suite', () => {
  bench('Test name', () => {
    // Code to benchmark
  });
});
```

### Best Practices

#### 1. Use Descriptive Names

```typescript
// ❌ Bad
bench('test 1', () => { /* ... */ });

// ✅ Good
bench('OmDataMapper - Simple mapping with 4 fields', () => { /* ... */ });
```

#### 2. Prepare Data Outside Benchmark

```typescript
// ❌ Bad - Data creation is benchmarked
bench('Map data', () => {
  const data = { id: 1, name: 'John' };
  mapper.execute(data);
});

// ✅ Good - Only mapping is benchmarked
const data = { id: 1, name: 'John' };
bench('Map data', () => {
  mapper.execute(data);
});
```

#### 3. Compare with Baseline

Always include a vanilla/baseline implementation for comparison:

```typescript
bench('OmDataMapper - Feature X', () => {
  mapper.execute(data);
});

bench('Vanilla - Feature X', () => {
  vanillaImplementation(data);
});
```

#### 4. Group Related Benchmarks

```typescript
describe('Array Operations', () => {
  bench('Map 10 items', () => { /* ... */ });
  bench('Map 100 items', () => { /* ... */ });
  bench('Map 1000 items', () => { /* ... */ });
});
```

## Configuration

### Vitest Config

**File:** `vitest.config.mts`

```typescript
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'bench/**/*.bench.ts'],
    benchmark: {
      outputFile: './bench-results.json',
    },
  },
});
```

### Benchmark Options

You can customize benchmark behavior:

```typescript
bench('My test', () => {
  // code
}, {
  time: 5000,      // Run for 5 seconds
  iterations: 100, // Run 100 iterations
  warmup: true,    // Enable warmup runs
});
```

## Interpreting Results

### Metrics Explained

- **hz** (Hertz): Operations per second - higher is better
- **min**: Minimum execution time
- **max**: Maximum execution time
- **mean**: Average execution time
- **p75/p99/p995/p999**: Percentile values
- **rme**: Relative margin of error (lower is better)
- **samples**: Number of samples collected

### Performance Comparison

The summary shows relative performance:

```
Vanilla - Simple mapping
  1.00x faster than OmDataMapper - Simple mapping
```

This means:
- **1.00x**: Nearly identical performance
- **2.00x**: Twice as fast
- **0.50x**: Half as fast (2x slower)

### What's Acceptable?

- **0.8x - 1.2x**: Excellent - competitive with vanilla
- **0.5x - 0.8x**: Good - acceptable overhead for features
- **0.3x - 0.5x**: Fair - consider optimization
- **< 0.3x**: Poor - needs optimization

## Troubleshooting

### Benchmarks not running

**Check:**
1. Files are in `bench/` directory
2. Files have `.bench.ts` extension
3. Dependencies are installed: `npm install`
4. Project is built: `npm run build`

### Inconsistent results

**Solutions:**
1. Close other applications
2. Run multiple times and average
3. Increase benchmark time:
   ```typescript
   bench('test', () => { /* ... */ }, { time: 10000 })
   ```

### CI benchmarks failing

**Check:**
1. GitHub token has correct permissions
2. Workflow has `contents: write` permission
3. Benchmark results file is generated
4. JSON output is valid

## Benchmark.js (High-Precision)

### Location

`/benchmarks` directory contains Benchmark.js tests.

### Running Benchmark.js Tests

```bash
# Navigate to benchmarks directory
cd benchmarks

# Install dependencies (first time only)
npm install

# Build the project
npm run build

# Run simple benchmark
node build/benchmarks/simple/Mapper.performance-benchmark.js

# Run complex benchmark
node build/benchmarks/complex/Mapper.performance-benchmark.complex.js

# Run unsafe mode benchmark
node build/benchmarks/simple/Mapper.performance-benchmark.unsafe.js
```

### Results Comparison

| Benchmark Type | Benchmark.js | Vitest Bench | Difference |
|----------------|--------------|--------------|------------|
| **Simple Mapping** | 946M ops/sec | 30M ops/sec | 31.5x faster |
| **Complex Mapping** | 21M ops/sec | 13M ops/sec | 1.6x faster |

**Why the difference?**
- Benchmark.js has minimal overhead and maximum V8 optimization
- Vitest Bench includes framework overhead and transformation layers
- **Both are correct** - they measure different aspects of performance
- **Relative performance** (OmDataMapper vs Vanilla) is similar in both

### When to Use Which?

**Use Benchmark.js for:**
- 📊 README and documentation
- 📈 Marketing materials
- 🎯 Absolute performance numbers
- 🔬 Deep performance analysis

**Use Vitest Bench for:**
- 🔄 CI/CD automation
- 📉 Regression tracking
- 🤖 Automated alerts
- 📊 Historical trends

## Summary

### Vitest Bench (Automated)

**Commands:**
- `npm run bench` - Run all benchmarks
- `npm run bench:watch` - Run benchmarks in watch mode

**Benchmark Files:**
- `bench/simple.bench.ts` - Simple mapping (2 benchmarks)
- `bench/complex.bench.ts` - Complex transformations (2 benchmarks)
- `bench/array.bench.ts` - Array operations (2 benchmarks)
- `bench/nested.bench.ts` - Deep nesting (2 benchmarks)

**CI/CD:**
- Runs on every push and PR
- Tracks performance over time
- Alerts on 50%+ regression
- Stores results for 30 days

### Benchmark.js (High-Precision)

**Location:** `/benchmarks` directory

**Commands:**
```bash
cd benchmarks
npm install
npm run build
node build/benchmarks/simple/Mapper.performance-benchmark.js
```

**Results:**
- Simple Mapping: 946M ops/sec (1.03x vs vanilla)
- Complex Mapping: 21M ops/sec (1.89x vs vanilla)

**Key Features:**
- ⚡ Maximum performance measurement
- 🎯 Industry-standard benchmarking
- 📊 Precise statistical analysis
- 🔬 Minimal overhead

---

**Last Updated:** 2025-10-13
**Maintained By:** Repository Administrators

