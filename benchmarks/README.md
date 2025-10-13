# Benchmark.js Performance Tests

This directory contains high-precision performance benchmarks using [Benchmark.js](https://benchmarkjs.com/).

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run benchmarks
node build/benchmarks/simple/Mapper.performance-benchmark.js
node build/benchmarks/complex/Mapper.performance-benchmark.complex.js
```

## Available Benchmarks

### Simple Mapping
**File:** `simple/Mapper.performance-benchmark.ts`

Tests basic field mapping with nested access:
```typescript
{ id, name, details: { age, address } } → { userId, fullName, age, location }
```

**Results:**
- OmDataMapper: ~946M ops/sec
- Vanilla: ~977M ops/sec
- **Performance: 1.03x** (nearly identical)

### Complex Mapping
**File:** `complex/Mapper.performance-benchmark.complex.ts`

Tests complex transformations with nested objects, arrays, and custom functions.

**Results:**
- OmDataMapper: ~21M ops/sec
- Vanilla: ~39M ops/sec
- **Performance: 1.89x**

### Unsafe Mode
**File:** `simple/Mapper.performance-benchmark.unsafe.ts`

Tests performance with `useUnsafe: true` (no try/catch overhead).

### Comparison Benchmarks
**File:** `compare/compare-benchmark.ts`

Compares OmDataMapper with other popular mapping libraries:
- class-transformer
- @cookbook/mapper-js
- automapper-ts
- object-mapper
- morphism

## Understanding Results

### Output Format

```
Mapper#execute x 945,768,114 ops/sec ±1.02% (100 runs sampled)
Vanilla mapper x 977,313,179 ops/sec ±2.51% (96 runs sampled)
```

**Metrics:**
- **ops/sec**: Operations per second (higher is better)
- **±%**: Relative margin of error (lower is better)
- **runs sampled**: Number of test iterations

### JSON Output

Each benchmark also outputs JSON for programmatic analysis:
```json
[
  {
    "name": "Mapper#execute",
    "hz": 945768113.85,
    "rme": 1.02,
    "sampleCount": 100
  }
]
```

## Why Benchmark.js?

**Advantages:**
- ✅ Industry standard for JavaScript benchmarking
- ✅ Minimal overhead - measures true performance
- ✅ Statistical analysis and confidence intervals
- ✅ Automatic calibration and warm-up
- ✅ Cross-platform consistency

**Use Cases:**
- 📊 README and documentation
- 📈 Performance comparisons
- 🎯 Absolute performance numbers
- 🔬 Deep performance analysis

## Comparison with Vitest Bench

| Aspect | Benchmark.js | Vitest Bench |
|--------|--------------|--------------|
| **Location** | `/benchmarks` | `/bench` |
| **Performance** | 946M ops/sec | 30M ops/sec |
| **Overhead** | Minimal | Framework overhead |
| **Use Case** | Absolute numbers | CI/CD tracking |
| **Automation** | Manual | Automated |

**Both are valuable:**
- Benchmark.js shows theoretical maximum performance
- Vitest Bench tracks real-world performance over time

## Adding New Benchmarks

1. Create a new `.ts` file in the appropriate directory
2. Import Benchmark.js and your code:
   ```typescript
   import { Suite } from 'benchmark';
   import { Mapper } from '../../src';
   ```

3. Create test data and mappers:
   ```typescript
   const sourceData = { /* ... */ };
   const mapper = Mapper.create({ /* ... */ });
   ```

4. Set up the benchmark suite:
   ```typescript
   const suite = new Suite();
   
   suite
     .add('Test name', function () {
       mapper.execute(sourceData);
     })
     .on('cycle', function (event: any) {
       console.log(String(event.target));
     })
     .run({ async: true });
   ```

5. Build and run:
   ```bash
   npm run build
   node build/benchmarks/your-file.js
   ```

## Best Practices

1. **Warm-up**: Benchmark.js automatically handles warm-up
2. **Sample size**: Let Benchmark.js determine optimal sample size
3. **Consistency**: Run benchmarks multiple times to verify results
4. **Environment**: Close other applications for accurate results
5. **Comparison**: Always include a vanilla/baseline implementation

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Inconsistent Results

- Close other applications
- Run multiple times and average
- Check CPU throttling settings
- Ensure stable power supply (laptops)

### Module Not Found

Make sure you're running from the `benchmarks` directory:
```bash
cd benchmarks
node build/benchmarks/simple/Mapper.performance-benchmark.js
```

## Resources

- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [Main Benchmark Setup Guide](../reports/benchmarks-setup.md)
- [Vitest Bench Documentation](../bench/)

---

**Note:** These benchmarks are for development and documentation purposes. For automated CI/CD performance tracking, see the `/bench` directory with Vitest Bench integration.

