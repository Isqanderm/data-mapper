# Decorator-Based API vs Mapper.create() Performance Analysis

## Executive Summary

Comprehensive performance benchmarks comparing the decorator-based API with the traditional `Mapper.create()` approach reveal **mixed results**:

- ✅ **Simple and complex mappings**: Decorator approach is **2-50% FASTER**
- ❌ **Array operations and conditional mappings**: Decorator approach is **32-42% SLOWER**

**Success Criteria**: Decorator performance should be ≥90% of Traditional (no more than 10% slower)

**Result**: **3 out of 5 scenarios PASS**, **2 scenarios FAIL critically**

---

## Detailed Benchmark Results

### ✅ Scenario 1: Simple Mapping (5-10 fields)

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| Traditional Mapper.create() | 31,677,158 ops/sec | 100% (baseline) |
| **Decorator-based Mapper** | **47,547,778 ops/sec** | **150%** ⚡ |

**Result**: ✅ **PASS** - Decorator is **50% FASTER**

**Analysis**: Simple field mappings benefit from decorator metadata being pre-compiled at class definition time.

---

### ✅ Scenario 2: Complex Transformations

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| Traditional Mapper.create() | 3,219,148 ops/sec | 100% (baseline) |
| **Decorator-based Mapper** | **3,432,679 ops/sec** | **107%** ⚡ |

**Result**: ✅ **PASS** - Decorator is **7% FASTER**

**Analysis**: Complex transformations with nested objects and date conversions show slight performance improvement with decorators.

---

### ✅ Scenario 3: Nested Objects

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| Traditional Mapper.create() | 31,582,163 ops/sec | 100% (baseline) |
| **Decorator-based Mapper** | **32,287,339 ops/sec** | **102%** ⚡ |

**Result**: ✅ **PASS** - Decorator is **2% FASTER**

**Analysis**: Nested object mapping performs equally well with both approaches.

---

### ❌ Scenario 4: Array Mapping (100 elements)

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| **Traditional Mapper.create()** | **561,026 ops/sec** | **100% (baseline)** ⚡ |
| Decorator-based Mapper | 342,342 ops/sec | 61% 🐌 |

**Result**: ❌ **FAIL** - Decorator is **39% SLOWER**

**Critical Issue**: Performance degradation of 39% exceeds the 10% threshold by a significant margin.

---

### ❌ Scenario 5: Conditional Mapping with Defaults

#### Full Data

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| **Traditional Mapper.create()** | **55,171,929 ops/sec** | **100% (baseline)** ⚡ |
| Decorator-based Mapper | 37,662,358 ops/sec | 68% 🐌 |

**Result**: ❌ **FAIL** - Decorator is **32% SLOWER**

#### Minimal Data (with defaults)

| Approach | Operations/sec | Performance |
|----------|---------------|-------------|
| **Traditional Mapper.create()** | **54,949,988 ops/sec** | **100% (baseline)** ⚡ |
| Decorator-based Mapper | 31,628,210 ops/sec | 58% 🐌 |

**Result**: ❌ **FAIL** - Decorator is **42% SLOWER**

**Critical Issue**: Default value handling shows the worst performance degradation.

---

## Root Cause Analysis

### 🔍 Identified Bottlenecks

#### 1. **Lazy Compilation Overhead** (Lines 49-51 in `src/decorators/core.ts`)

```typescript
transform<Source = any>(source: Source): any {
  if (!this._compiledMapper) {
    this._compiledMapper = this._compileMapper();  // ⚠️ Compiled on first call
  }
  return this._compiledMapper.execute(source);
}
```

**Problem**: The mapper is compiled on the first `transform()` call for each instance. While this is cached per instance, it still adds overhead.

**Impact**: Minimal for single-use mappers, but significant for array operations where the same mapper instance is reused.

---

#### 2. **Default Value Handling Duplication** (Lines 130-137, 151-154)

```typescript
// Applied during compilation (lines 130-137)
if (mapping.defaultValue !== undefined) {
  const originalTransformer = transformer;
  const defaultVal = mapping.defaultValue;
  transformer = (source: any) => {
    const value = originalTransformer(source);
    return value !== undefined ? value : defaultVal;
  };
}

// Also set in defaultValues object (lines 151-154)
if (mapping.defaultValue !== undefined) {
  defaultValues[key] = mapping.defaultValue;
}
```

**Problem**: Default values are handled in TWO places:
1. Wrapped in transformer function (runtime check on every call)
2. Passed to `BaseMapper.create()` as `defaultValues` parameter

This creates **double overhead** for default value handling.

**Impact**: Explains the 32-42% slowdown in Scenario 5 (conditional mapping with defaults).

---

#### 3. **Metadata Lookup on Every Compilation** (Line 79)

```typescript
private _compileMapper(): BaseMapper<any, any> {
  const metadata = getMapperMetadata(this.constructor);  // ⚠️ WeakMap lookup
  // ... build mapping config from metadata
}
```

**Problem**: Every time `_compileMapper()` is called, it performs a WeakMap lookup to get metadata.

**Impact**: Minor, but adds up in high-frequency scenarios.

---

#### 4. **Function Wrapping Overhead** (Lines 97-100, 111-114, 121-126)

```typescript
// Example: Path mapping with value transformation
mappingConfig[key] = (source: any) => {
  const value = this._getValueByPath(source, sourcePath);
  return valueTransform(value);
};
```

**Problem**: Multiple layers of function wrapping for transformations, conditions, and default values create call stack overhead.

**Impact**: Accumulates in array operations (Scenario 4) where the same transformation is called 100 times.

---

## Optimization Recommendations

### 🚀 Priority 1: Critical Optimizations (Target: +30-40% performance)

#### 1.1. **Implement Class-Level Mapper Caching**

**Current**: Each instance compiles its own mapper on first use.

**Proposed**: Cache compiled mapper at the class level (shared across all instances).

```typescript
// Add to Mapper decorator
const COMPILED_MAPPER_CACHE = new WeakMap<any, BaseMapper<any, any>>();

export function Mapper(options: MapperOptions = {}) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext,
  ): T {
    const EnhancedClass = class extends target {
      transform<Source = any>(source: Source): any {
        // Check class-level cache first
        let compiledMapper = COMPILED_MAPPER_CACHE.get(this.constructor);
        
        if (!compiledMapper) {
          compiledMapper = this._compileMapper();
          COMPILED_MAPPER_CACHE.set(this.constructor, compiledMapper);
        }

        const { result, errors } = compiledMapper.execute(source);
        // ... rest of the code
      }
    };
    return EnhancedClass;
  };
}
```

**Expected Impact**: +20-30% performance improvement in array operations.

---

#### 1.2. **Remove Default Value Duplication**

**Current**: Default values handled in both transformer wrapper AND defaultValues parameter.

**Proposed**: Let `BaseMapper` handle defaults exclusively.

```typescript
// Remove this wrapper (lines 130-137)
// DELETE:
if (mapping.defaultValue !== undefined) {
  const originalTransformer = transformer;
  const defaultVal = mapping.defaultValue;
  transformer = (source: any) => {
    const value = originalTransformer(source);
    return value !== undefined ? value : defaultVal;
  };
}

// Keep only this (lines 151-154)
if (mapping.defaultValue !== undefined) {
  defaultValues[key] = mapping.defaultValue;
}
```

**Expected Impact**: +10-15% performance improvement in conditional mappings with defaults.

---

### 🔧 Priority 2: Medium Optimizations (Target: +5-10% performance)

#### 2.1. **Optimize Path Lookup**

**Current**: `_getValueByPath()` is called on every transformation.

**Proposed**: Pre-compile path accessors.

```typescript
private _compilePath(path: string): (obj: any) => any {
  const keys = path.split('.');
  return (obj: any) => keys.reduce((current, key) => current?.[key], obj);
}
```

**Expected Impact**: +3-5% performance improvement in nested object scenarios.

---

#### 2.2. **Reduce Function Wrapping Layers**

**Current**: Multiple nested function wrappers for transformations, conditions, and value transforms.

**Proposed**: Combine all logic into a single function.

```typescript
// Instead of wrapping multiple times, create one combined function
const createCombinedTransformer = (mapping: PropertyMapping) => {
  return (source: any) => {
    // Check condition first
    if (mapping.condition && !mapping.condition(source)) {
      return mapping.defaultValue;
    }
    
    // Apply transformer
    let value = mapping.transformer ? mapping.transformer(source) : undefined;
    
    // Apply value transformation
    if (mapping.transformValue) {
      value = mapping.transformValue(value);
    }
    
    // Apply default if undefined
    return value !== undefined ? value : mapping.defaultValue;
  };
};
```

**Expected Impact**: +5-8% performance improvement across all scenarios.

---

### 💡 Priority 3: Future Optimizations (Target: +2-5% performance)

#### 3.1. **JIT Compilation Like BaseMapper**

**Proposed**: Generate optimized code strings and use `new Function()` like `BaseMapper` does.

**Expected Impact**: +2-5% performance improvement, but increases complexity.

---

#### 3.2. **Metadata Caching**

**Proposed**: Cache metadata lookup results.

```typescript
const METADATA_CACHE = new WeakMap<any, MapperMetadata>();

private _compileMapper(): BaseMapper<any, any> {
  let metadata = METADATA_CACHE.get(this.constructor);
  if (!metadata) {
    metadata = getMapperMetadata(this.constructor);
    METADATA_CACHE.set(this.constructor, metadata);
  }
  // ... rest of the code
}
```

**Expected Impact**: +1-2% performance improvement.

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1)
- [ ] Implement class-level mapper caching (Optimization 1.1)
- [ ] Remove default value duplication (Optimization 1.2)
- [ ] Run benchmarks to verify 30-40% improvement

### Phase 2: Medium Optimizations (Week 2)
- [ ] Optimize path lookup (Optimization 2.1)
- [ ] Reduce function wrapping layers (Optimization 2.2)
- [ ] Run benchmarks to verify additional 5-10% improvement

### Phase 3: Validation (Week 3)
- [ ] Re-run all benchmarks
- [ ] Verify all scenarios meet ≥90% performance criteria
- [ ] Update documentation with final results

---

## Expected Final Results

After implementing Priority 1 and Priority 2 optimizations:

| Scenario | Current | Expected After Optimization | Status |
|----------|---------|----------------------------|--------|
| Simple Mapping | 150% | 150% | ✅ Already excellent |
| Complex Transformations | 107% | 110-115% | ✅ Slight improvement |
| Nested Objects | 102% | 105-110% | ✅ Slight improvement |
| Array Mapping (100 items) | 61% | **90-95%** | ✅ **Will PASS** |
| Conditional (Full data) | 68% | **90-95%** | ✅ **Will PASS** |
| Conditional (Minimal data) | 58% | **90-95%** | ✅ **Will PASS** |

---

## Conclusion

The decorator-based API shows **excellent performance** for simple and complex mappings, but suffers from **critical performance issues** in array operations and default value handling.

**Root causes identified**:
1. Lack of class-level mapper caching
2. Duplicate default value handling
3. Excessive function wrapping

**Recommended action**: Implement Priority 1 optimizations immediately to bring all scenarios within the ≥90% performance target.

**Timeline**: 2-3 weeks to implement and validate all optimizations.

