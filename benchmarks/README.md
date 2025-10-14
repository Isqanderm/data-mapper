# om-data-mapper Benchmarks

This directory contains comprehensive performance benchmarks for om-data-mapper.

## 📁 Directory Structure

```
benchmarks/
├── suites/                    # Benchmark test suites
│   ├── core/                  # Core functionality benchmarks
│   │   ├── simple.bench.ts    # Simple mapping (Vitest)
│   │   ├── complex.bench.ts   # Complex transformations (Vitest)
│   │   ├── nested.bench.ts    # Nested objects (Vitest)
│   │   └── array.bench.ts     # Array mapping (Vitest)
│   └── compat/                # Compatibility benchmarks
│       └── class-transformer-comparison.js  # vs class-transformer (Benchmark.js)
├── simple/                    # Legacy Benchmark.js tests
├── complex/                   # Legacy Benchmark.js tests
├── compare/                   # Library comparison tests
├── PERFORMANCE_COMPARISON.md  # Detailed performance analysis
└── README.md                  # This file
```

## 🚀 Quick Start

### Run Core Benchmarks (Vitest)

```bash
# From project root
npm run bench:core

# Or run all benchmarks
npm run bench
```

### Run Compatibility Benchmarks (Benchmark.js)

```bash
# From project root
npm run bench:compat

# Or directly
node benchmarks/suites/compat/class-transformer-comparison.js
```

## 📊 Available Benchmarks

### Core Benchmarks (Vitest)

Located in `suites/core/`:

1. **simple.bench.ts** - Simple property mapping
   - Direct field mapping
   - ~30M ops/sec

2. **complex.bench.ts** - Complex transformations
   - Nested objects, arrays, custom functions
   - ~13M ops/sec

3. **nested.bench.ts** - Deep nested access
   - Multi-level object traversal
   - ~2.4M ops/sec

4. **array.bench.ts** - Array transformations
   - Mapping 100 items
   - ~1M ops/sec

### Compatibility Benchmarks (Benchmark.js)

Located in `suites/compat/`:

1. **class-transformer-comparison.js** - vs class-transformer
   - 6 comprehensive scenarios
   - Average: **4.77x faster** than class-transformer
   - See [PERFORMANCE_COMPARISON.md](./PERFORMANCE_COMPARISON.md) for details

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

