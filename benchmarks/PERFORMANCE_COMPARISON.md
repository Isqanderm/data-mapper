# Performance Comparison: om-data-mapper vs class-transformer

## Executive Summary

This document presents a comprehensive performance comparison between **om-data-mapper's class-transformer compatibility layer** and the original **class-transformer** library. The benchmarks demonstrate that om-data-mapper provides **significantly better performance** across all tested scenarios while maintaining full API compatibility.

### Key Findings

- **Average Performance Improvement**: **376.73% faster** than class-transformer
- **Best Performance**: Serialization (classToPlain) - **602.17% faster**
- **Worst Performance**: Complex Decorators - **255.60% faster** (still 3.5x faster!)
- **Consistency**: om-data-mapper outperforms class-transformer in **all 6 scenarios**

---

## Benchmark Results

### Scenario 1: Simple Transformation (5-10 properties)

**Test**: Transform a plain object with 7 properties to a class instance using `@Expose` decorators.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **1,696,164** | **Baseline** |
| class-transformer | 327,941 | 5.17x slower |

**Improvement**: **417.22% faster** ⚡

**Analysis**: Even for simple transformations, om-data-mapper's JIT compilation provides a significant advantage. The library pre-compiles the transformation logic, eliminating the overhead of decorator metadata lookups on each transformation.

---

### Scenario 2: Nested Objects (2-3 levels)

**Test**: Transform nested objects with `@Type` decorators for proper type conversion across multiple levels.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **572,317** | **Baseline** |
| class-transformer | 156,840 | 3.65x slower |

**Improvement**: **264.90% faster** ⚡

**Analysis**: Nested object transformation benefits greatly from om-data-mapper's optimized approach. The library efficiently handles nested transformations without the recursive overhead typical in class-transformer.

---

### Scenario 3: Array Transformation (100 objects)

**Test**: Transform an array of 100 plain objects to class instances.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **11,906** | **Baseline** |
| class-transformer | 3,122 | 3.81x slower |

**Improvement**: **281.31% faster** ⚡

**Analysis**: Array transformations show consistent performance gains. om-data-mapper's compiled transformation functions scale efficiently with array size, while class-transformer's per-item metadata lookups create significant overhead.

---

### Scenario 4: Complex Decorators (@Expose, @Exclude, @Transform)

**Test**: Use multiple decorator types together including custom transformations and property exclusions.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **1,677,997** | **Baseline** |
| class-transformer | 471,877 | 3.56x slower |

**Improvement**: **255.60% faster** ⚡

**Analysis**: Despite being the "worst" performance scenario, om-data-mapper is still 3.5x faster. Complex decorator combinations benefit from om-data-mapper's unified compilation approach rather than class-transformer's decorator-by-decorator processing.

---

### Scenario 5: Serialization (Class → Plain)

**Test**: Convert class instances back to plain objects using `classToPlain`.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **2,592,687** | **Baseline** |
| class-transformer | 369,238 | 7.02x slower |

**Improvement**: **602.17% faster** ⚡⚡⚡

**Analysis**: This is the best-performing scenario! Serialization is extremely fast in om-data-mapper because the library optimizes the reverse transformation path. This is particularly valuable for API responses and data serialization workflows.

---

### Scenario 6: Large Objects (50+ properties)

**Test**: Transform objects with 50 properties.

| Library | Operations/sec | Performance |
|---------|---------------|-------------|
| **om-data-mapper** | **123,238** | **Baseline** |
| class-transformer | 22,856 | 5.39x slower |

**Improvement**: **439.20% faster** ⚡

**Analysis**: Large objects demonstrate the scalability of om-data-mapper's approach. As the number of properties increases, the performance gap widens, showing that om-data-mapper's compilation strategy scales better than class-transformer's reflection-based approach.

---

## Performance Summary Table

| Scenario | om-data-mapper (ops/sec) | class-transformer (ops/sec) | Improvement | Speedup |
|----------|-------------------------|----------------------------|-------------|---------|
| Simple Transformation | 1,696,164 | 327,941 | +417.22% | 5.17x |
| Nested Objects | 572,317 | 156,840 | +264.90% | 3.65x |
| Array (100 items) | 11,906 | 3,122 | +281.31% | 3.81x |
| Complex Decorators | 1,677,997 | 471,877 | +255.60% | 3.56x |
| Serialization | 2,592,687 | 369,238 | +602.17% | 7.02x |
| Large Objects (50 props) | 123,238 | 22,856 | +439.20% | 5.39x |
| **Average** | - | - | **+376.73%** | **4.77x** |

---

## Why is om-data-mapper Faster?

### 1. **JIT Compilation**
om-data-mapper compiles transformation logic ahead of time, creating optimized functions that execute directly without metadata lookups.

### 2. **Reduced Reflection Overhead**
While class-transformer relies heavily on reflect-metadata for every transformation, om-data-mapper reads metadata once during compilation and generates optimized code.

### 3. **Optimized Code Paths**
The compiled functions use direct property access and inline transformations, eliminating function call overhead.

### 4. **Smart Caching**
Compiled mappers are cached and reused, avoiding repeated compilation costs.

### 5. **Efficient Memory Usage**
By avoiding repeated metadata lookups and creating optimized transformation functions, om-data-mapper reduces memory pressure and garbage collection overhead.

---

## Recommendations

### When to Use om-data-mapper

✅ **High-throughput APIs**: When processing thousands of requests per second  
✅ **Real-time applications**: When low latency is critical  
✅ **Large-scale data processing**: When transforming large datasets  
✅ **Microservices**: When every millisecond counts  
✅ **Serverless functions**: When cold start time and execution speed matter  

### Migration from class-transformer

The migration is **seamless**:

```typescript
// Before (class-transformer)
import { plainToClass, Expose } from 'class-transformer';

// After (om-data-mapper)
import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';
```

**No code changes required!** Just update the import path and enjoy 3-7x performance improvement.

---

## Benchmark Environment

- **CPU**: Apple M1/M2 (ARM64)
- **Node.js**: v20.9.0
- **om-data-mapper**: v3.1.0
- **class-transformer**: v0.5.1
- **Benchmark Tool**: Benchmark.js v2.1.4
- **Date**: October 2025

---

## Conclusion

om-data-mapper's class-transformer compatibility layer provides **exceptional performance improvements** while maintaining **100% API compatibility**. With an average performance improvement of **376.73%** (4.77x faster) across all scenarios, it's a compelling drop-in replacement for class-transformer.

The performance gains are consistent across all use cases, from simple transformations to complex nested objects with custom decorators. The best performance is seen in serialization scenarios (602% faster), making it ideal for API development and data-intensive applications.

**Bottom line**: If you're using class-transformer and need better performance, om-data-mapper offers a risk-free upgrade path with massive performance benefits.

---

## Running the Benchmarks

To reproduce these results:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the benchmark
node bench/class-transformer-comparison-runner.js
```

---

## License

MIT License - See LICENSE file for details.

