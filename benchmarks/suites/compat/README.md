# class-transformer Compatibility Benchmark

This directory contains performance comparison benchmarks between `om-data-mapper` and `class-transformer`.

## 🚀 Quick Start

### Run Comparison Benchmark (Human-Readable)

```bash
npm run bench:compat
```

This will output a formatted comparison table showing performance differences across 5 scenarios.

### Run Comparison Benchmark (JSON Format)

```bash
npm run bench:compat:json
```

This outputs results in JSON format for automated tracking and visualization.

## 📊 Automated Benchmarking

The benchmarks run automatically on every PR via GitHub Actions:

- **On Pull Requests**: Results are posted as a comment with comparison to `main` branch
- **On Main Branch**: Results are stored in GitHub Pages for historical tracking
- **Performance Alerts**: Automatic alerts if performance degrades by >150%

### View Historical Data

After merging to `main`, view performance history at:
https://isqanderm.github.io/data-mapper/dev/bench/

## 📁 Files

- `comparison.js` - Main benchmark script with formatted output
- `comparison-json.js` - JSON output version for CI/CD integration
- `models-ct.ts` - class-transformer model definitions (legacy decorators)
- `models-om.ts` - om-data-mapper model definitions (TC39 Stage 3 decorators)
- `tsconfig.ct.json` - TypeScript config for class-transformer (experimentalDecorators)
- `tsconfig.om.json` - TypeScript config for om-data-mapper (TC39 decorators)

## 🔧 How It Works

### Decorator Incompatibility

`class-transformer` uses **legacy decorators** (`experimentalDecorators: true`), while `om-data-mapper` uses **TC39 Stage 3 decorators**. These are incompatible in the same compilation unit.

**Solution**: We compile models separately:

1. `models-ct.ts` → compiled with `tsconfig.ct.json` → `build-ct/models-ct.js`
2. `models-om.ts` → compiled with `tsconfig.om.json` → `models-om.js`
3. `comparison.js` imports both compiled versions

### Benchmark Scenarios

1. **Simple Object Mapping** - 7 properties, basic types
2. **Complex Nested Objects** - Deep nesting with multiple levels
3. **Array Transformation** - 100 items batch processing
4. **Custom Logic** - Transformations with custom functions
5. **Exclude/Expose Mix** - Field visibility control

## 📈 CI/CD Integration

The GitHub Actions workflow (`.github/workflows/benchmark.yml`) automatically:

1. ✅ Builds the project
2. ✅ Compiles benchmark models
3. ✅ Runs all benchmark suites
4. ✅ Generates JSON results
5. ✅ Posts formatted results to PR
6. ✅ Stores historical data (main branch only)
7. ✅ Alerts on performance regressions

### Example PR Comment

```
🚀 Performance Benchmark Results

📊 om-data-mapper vs class-transformer Comparison

┌─────────────────────────────────────────┬──────────────┬─────────────────┐
│ Scenario                                │ Winner       │ Performance     │
├─────────────────────────────────────────┼──────────────┼─────────────────┤
│ Simple Transformation                   │ om-data-mapper │ +1370.91% faster │
│ Complex Nested Transformation           │ om-data-mapper │ +4362.85% faster │
│ Array Transformation                    │ om-data-mapper │ +1146.48% faster │
│ Custom Transformation                   │ om-data-mapper │ +1360.77% faster │
│ Exclude/Expose                          │ om-data-mapper │ +569.96% faster │
└─────────────────────────────────────────┴──────────────┴─────────────────┘

✨ om-data-mapper won 5/5 scenarios
⚡ Average performance improvement: 1762.19%
```

## 🛠️ Local Development

### Prerequisites

```bash
# Install dependencies
npm install
cd benchmarks && npm install
```

### Build and Run

```bash
# Build main project
npm run build

# Build benchmark models
npm run bench:compat:build

# Run comparison
node benchmarks/suites/compat/comparison.js
```

### Troubleshooting

**Error: Cannot find module**
- Make sure you ran `npm run build` first
- Check that `build-ct/` directory exists after `bench:compat:build`

**TypeScript compilation errors**
- Verify `tsconfig.ct.json` has `experimentalDecorators: true`
- Verify `tsconfig.om.json` does NOT have `experimentalDecorators`

## 📚 Related Documentation

- [Main Comparison Guide](../../../docs/COMPARISON.md)
- [Decorator API Documentation](../../../docs/DECORATOR_API.md)
- [Migration Guide](../../../docs/MIGRATION_GUIDE.md)

