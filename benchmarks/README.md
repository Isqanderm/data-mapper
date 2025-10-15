# om-data-mapper Benchmarks

This directory contains comprehensive performance benchmarks for om-data-mapper.

## 📁 Directory Structure

```
benchmarks/
├── core/                      # Core functionality benchmarks
│   ├── simple.bench.ts        # Simple mapping
│   ├── complex.bench.ts       # Complex transformations
│   ├── nested.bench.ts        # Nested objects
│   ├── array.bench.ts         # Array mapping
│   └── shared-mappers.ts      # Shared mapper definitions
├── comparisons/               # Library comparison benchmarks
│   ├── class-transformer-comparison/  # vs class-transformer
│   ├── validation-comparison/         # Validation performance
│   └── library-comparison/            # Multi-library comparison
├── package.json               # Benchmark dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Run Core Benchmarks

Core benchmarks test the fundamental performance of om-data-mapper's mapping engine:

```bash
# From project root
npm run bench:core

# Or run specific benchmarks
cd benchmarks
npx vitest bench core/simple.bench.ts
npx vitest bench core/complex.bench.ts
```

### Run Comparison Benchmarks

Comparison benchmarks test om-data-mapper against other libraries:

```bash
# class-transformer comparison
cd benchmarks
npx ts-node comparisons/class-transformer-comparison/class-transformer-comparison.bench.ts

# Validation comparison
npx ts-node --project comparisons/validation-comparison/tsconfig.json \
  comparisons/validation-comparison/validation-comparison.bench.ts
```

## 📊 Available Benchmarks

### Core Benchmarks

Located in `core/`:

1. **simple.bench.ts** - Simple property mapping
   - Direct field mapping
   - ~30M ops/sec
   - Tests basic mapper performance

2. **complex.bench.ts** - Complex transformations
   - Nested objects, arrays, custom functions
   - ~13M ops/sec
   - Tests advanced mapping features

3. **nested.bench.ts** - Deep nested access
   - Multi-level object traversal
   - ~2.4M ops/sec
   - Tests nested property access

4. **array.bench.ts** - Array transformations
   - Mapping 100 items
   - ~1M ops/sec
   - Tests bulk transformation performance

5. **shared-mappers.ts** - Shared mapper definitions
   - Reusable mapper classes for benchmarks
   - Decorator-based mappers

### Comparison Benchmarks

Located in `comparisons/`:

#### 1. class-transformer-comparison/
Compares om-data-mapper's class-transformer compatibility layer with the original library.

- **6 comprehensive scenarios**
- **Average: 4.77x faster** than class-transformer
- Tests: Simple, Nested, Arrays, Custom Logic, Exclude/Expose, Large Objects
- See [comparisons/class-transformer-comparison/](./comparisons/class-transformer-comparison/) for details

#### 2. validation-comparison/
Compares om-data-mapper's JIT-compiled validation with class-validator.

- **10 comprehensive scenarios**
- **Average: 20,000-60,000% faster** than class-validator
- Tests: Simple validation, Optional fields, Arrays, Complex DTOs, Large objects
- See [comparisons/validation-comparison/README.md](./comparisons/validation-comparison/README.md) for details

#### 3. library-comparison/
Multi-library comparison benchmark.

- Compares against multiple mapping libraries
- Provides comprehensive performance analysis
- See [comparisons/library-comparison/](./comparisons/library-comparison/) for details

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

## Benchmark Tools

### Benchmark.js (Comparison Benchmarks)

Used for library comparisons to provide accurate, statistically significant results.

**Advantages:**
- ✅ Industry standard for JavaScript benchmarking
- ✅ Minimal overhead - measures true performance
- ✅ Statistical analysis and confidence intervals
- ✅ Automatic calibration and warm-up
- ✅ Cross-platform consistency

**Use Cases:**
- 📊 Library comparisons
- 📈 Performance documentation
- 🎯 Absolute performance numbers
- 🔬 Deep performance analysis

### Vitest Bench (Core Benchmarks)

Used for core functionality benchmarks and CI/CD integration.

**Advantages:**
- ✅ Integrated with test suite
- ✅ Automated CI/CD tracking
- ✅ Historical performance data
- ✅ Easy to run alongside tests

**Use Cases:**
- 🔄 Continuous performance monitoring
- 📉 Regression detection
- 🎯 Development workflow integration

### Comparison

| Aspect | Benchmark.js | Vitest Bench |
|--------|--------------|--------------|
| **Location** | `comparisons/` | `core/` |
| **Performance** | 946M ops/sec | 30M ops/sec |
| **Overhead** | Minimal | Framework overhead |
| **Use Case** | Library comparisons | Core performance tracking |
| **Automation** | Manual | Automated |

**Both are valuable:**
- Benchmark.js shows theoretical maximum performance for comparisons
- Vitest Bench tracks real-world performance over time in CI/CD

## Adding New Benchmarks

### Core Benchmarks (Vitest)

1. Create a new `.bench.ts` file in `core/`:
   ```typescript
   import { bench, describe } from 'vitest';
   import { Mapper } from '../../src/core/Mapper';

   describe('My Benchmark', () => {
     bench('Test name', () => {
       // Your benchmark code
     });
   });
   ```

2. Run the benchmark:
   ```bash
   npx vitest bench core/your-file.bench.ts
   ```

### Comparison Benchmarks (Benchmark.js)

1. Create a new directory in `comparisons/`:
   ```bash
   mkdir comparisons/my-comparison
   ```

2. Create a `.bench.ts` file:
   ```typescript
   import { Suite } from 'benchmark';
   import 'reflect-metadata';

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
     .run({ async: false });
   ```

3. Add a README.md documenting the comparison

4. Run the benchmark:
   ```bash
   npx ts-node comparisons/my-comparison/my-comparison.bench.ts
   ```

## Best Practices

### General
1. **Warm-up**: Both tools automatically handle warm-up cycles
2. **Sample size**: Let the tools determine optimal sample size
3. **Consistency**: Run benchmarks multiple times to verify results
4. **Environment**: Close other applications for accurate results
5. **Comparison**: Always include a baseline implementation

### Core Benchmarks
- Use Vitest bench for tracking performance over time
- Run in CI/CD to catch regressions early
- Keep benchmarks focused and simple

### Comparison Benchmarks
- Use Benchmark.js for accurate library comparisons
- Document test scenarios clearly
- Include both valid and invalid data tests
- Provide comprehensive README files

## Troubleshooting

### TypeScript Errors

```bash
# Make sure dependencies are installed
cd benchmarks
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

### Inconsistent Results

- Close other applications
- Run multiple times and average
- Check CPU throttling settings
- Ensure stable power supply (laptops)
- Disable CPU frequency scaling

### Module Not Found

Make sure you're in the correct directory:
```bash
cd benchmarks
npx ts-node comparisons/validation-comparison/validation-comparison.bench.ts
```

### Decorator Errors

Some benchmarks use experimental decorators (class-validator) while others use TC39 Stage 3 decorators (om-data-mapper). Check the tsconfig.json in each directory.

## Performance Results Summary

### Core Performance
- **Simple mapping**: ~30M ops/sec
- **Complex transformations**: ~13M ops/sec
- **Nested objects**: ~2.4M ops/sec
- **Array mapping (100 items)**: ~1M ops/sec

### vs class-transformer
- **Average**: 4.77x faster
- **Best**: 43.6x faster (complex nested)
- **Consistent**: Faster across all scenarios

### vs class-validator
- **Average**: 20,000-60,000% faster
- **Simple validation**: 39,950% faster
- **Array validation**: 35,756% faster
- **JIT compilation**: Massive performance advantage

## Resources

- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [Vitest Bench Documentation](https://vitest.dev/guide/features.html#benchmarking)
- [class-transformer Comparison](./comparisons/class-transformer-comparison/)
- [Validation Comparison](./comparisons/validation-comparison/)

---

**Note:** These benchmarks demonstrate om-data-mapper's exceptional performance across all use cases. The library is designed for high-throughput applications where performance is critical.

