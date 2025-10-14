# om-data-mapper vs class-transformer: Comprehensive Comparison

This document provides a detailed comparison between **om-data-mapper** and **class-transformer**, demonstrating why om-data-mapper is the superior choice for object transformation in TypeScript/JavaScript projects.

## Table of Contents

- [Performance Comparison](#performance-comparison)
- [Feature Comparison](#feature-comparison)
- [API Comparison](#api-comparison)
- [Bundle Size & Dependencies](#bundle-size--dependencies)
- [Migration Guide](#migration-guide)
- [Conclusion](#conclusion)

---

## Performance Comparison

### Benchmark Results

We conducted comprehensive benchmarks comparing om-data-mapper with class-transformer across 5 different scenarios:

| Scenario | class-transformer | om-data-mapper | Performance Gain |
|----------|-------------------|----------------|------------------|
| **Simple Transformation** (7 properties) | 326,645 ops/sec | 4,334,132 ops/sec | **🚀 1,227% faster** |
| **Complex Nested Transformation** | 153,772 ops/sec | 6,720,380 ops/sec | **🚀 4,270% faster** |
| **Array Transformation** (100 items) | 5,200 ops/sec | 69,137 ops/sec | **🚀 1,230% faster** |
| **Custom Transformation Logic** | 332,618 ops/sec | 4,781,003 ops/sec | **🚀 1,337% faster** |
| **Exclude/Expose Mix** | 263,348 ops/sec | 1,780,032 ops/sec | **🚀 576% faster** |

### Summary

- ✨ **om-data-mapper won 5/5 scenarios**
- ⚡ **Average performance improvement: 1,728%** (17.28x faster)
- 🏆 **Up to 42.7x faster** in complex nested transformations

### Why is om-data-mapper so much faster?

1. **JIT (Just-In-Time) Compilation**: om-data-mapper generates optimized transformation code at runtime using `new Function()`, eliminating the overhead of reflection and metadata lookups.

2. **TC39 Stage 3 Decorators**: Modern decorator implementation that's more efficient than legacy decorators.

3. **Optimized Code Paths**: Direct property access and minimal overhead for common transformation patterns.

4. **Smart Caching**: Compiled transformation functions are cached and reused.

---

## Feature Comparison

| Feature | class-transformer | om-data-mapper | Notes |
|---------|-------------------|----------------|-------|
| **Basic Transformation** | ✅ | ✅ | Both support plainToClass/plainToInstance |
| **Nested Objects** | ✅ | ✅ | Both support @Type decorator |
| **Custom Transformations** | ✅ | ✅ | Both support @Transform decorator |
| **Exclude/Expose** | ✅ | ✅ | Both support property filtering |
| **Array Transformation** | ✅ | ✅ | Both support array mapping |
| **Groups** | ✅ | ✅ | Both support transformation groups |
| **Versioning** | ✅ | ✅ | Both support version-based filtering |
| **Performance** | ⚠️ Slow | ✅ **17.28x faster** | om-data-mapper uses JIT compilation |
| **Decorator Standard** | ⚠️ Legacy | ✅ **TC39 Stage 3** | om-data-mapper uses modern standard |
| **TypeScript Support** | ✅ | ✅ **Better** | om-data-mapper has ergonomic API |
| **Bundle Size** | ⚠️ Larger | ✅ **Smaller** | om-data-mapper is more lightweight |
| **Dependencies** | ⚠️ reflect-metadata | ✅ **Zero dependencies** | om-data-mapper has no runtime deps |
| **Ergonomic API** | ❌ | ✅ **Yes** | om-data-mapper has helper functions |
| **Drop-in Replacement** | N/A | ✅ **Yes** | om-data-mapper provides compatibility layer |

---

## API Comparison

### Basic Usage

**class-transformer:**
```typescript
import 'reflect-metadata';
import { plainToClass, Expose } from 'class-transformer';

class User {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

const user = plainToClass(User, { id: 1, name: 'John' });
```

**om-data-mapper (Compatibility API):**
```typescript
import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';

class User {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

const user = plainToClass(User, { id: 1, name: 'John' });
// ✅ Same API, but 12.27x faster!
```

**om-data-mapper (Ergonomic API - Recommended):**
```typescript
import { Mapper, Map, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('id')
  id!: number;

  @Map('name')
  name!: string;
}

const user = plainToInstance<UserSource, UserDTO>(UserMapper, source);
// ✅ Clean API with full type safety!
```

### Nested Objects

**class-transformer:**
```typescript
import { Type } from 'class-transformer';

class Address {
  @Expose()
  street: string;
}

class User {
  @Expose()
  @Type(() => Address)
  address: Address;
}
```

**om-data-mapper:**
```typescript
import { Type } from 'om-data-mapper/class-transformer-compat';

class Address {
  @Expose()
  street: string;
}

class User {
  @Expose()
  @Type(() => Address)
  address: Address;
}
// ✅ Same API, 42.7x faster for nested objects!
```

### Custom Transformations

**class-transformer:**
```typescript
import { Transform } from 'class-transformer';

class User {
  @Transform(({ value }) => value.toUpperCase())
  name: string;
}
```

**om-data-mapper:**
```typescript
import { Transform } from 'om-data-mapper/class-transformer-compat';

class User {
  @Transform(({ value }) => value.toUpperCase())
  name: string;
}
// ✅ Same API, 13.37x faster!
```

---

## Bundle Size & Dependencies

### class-transformer

- **Bundle Size**: ~50KB (minified)
- **Dependencies**: 
  - `reflect-metadata` (required)
- **Total Size**: ~100KB+ with dependencies

### om-data-mapper

- **Bundle Size**: ~30KB (minified)
- **Dependencies**: **Zero runtime dependencies** ✨
- **Total Size**: ~30KB

**Result**: om-data-mapper is **~70% smaller** when including dependencies!

---

## Migration Guide

### Step 1: Install om-data-mapper

```bash
npm install om-data-mapper
# or
yarn add om-data-mapper
# or
pnpm add om-data-mapper
```

### Step 2: Update Imports

**Before:**
```typescript
import 'reflect-metadata';
import { 
  plainToClass, 
  classToPlain,
  Expose,
  Exclude,
  Type,
  Transform
} from 'class-transformer';
```

**After:**
```typescript
import { 
  plainToClass, 
  classToPlain,
  Expose,
  Exclude,
  Type,
  Transform
} from 'om-data-mapper/class-transformer-compat';
```

### Step 3: That's It!

No code changes needed! Your existing code will work exactly the same, but **17.28x faster** on average.

### Optional: Migrate to Ergonomic API

For new code, consider using the ergonomic API for better TypeScript support:

```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('id')
  id!: number;

  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;
}

const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
```

---

## Conclusion

### Why Choose om-data-mapper?

1. **🚀 17.28x Faster**: Dramatically better performance across all scenarios
2. **✨ Zero Dependencies**: No need for reflect-metadata or other runtime dependencies
3. **📦 70% Smaller**: Smaller bundle size for faster page loads
4. **🎯 Drop-in Replacement**: Compatible with class-transformer API
5. **🔧 Modern Standard**: Uses TC39 Stage 3 decorators
6. **💡 Ergonomic API**: Better developer experience with helper functions
7. **🛡️ Type Safe**: Full TypeScript support with compile-time type checking
8. **⚡ JIT Compilation**: Generates optimized code automatically

### When to Use om-data-mapper

- ✅ **Always** - It's faster, smaller, and has zero dependencies
- ✅ **High-performance applications** - When transformation speed matters
- ✅ **Large-scale applications** - When bundle size matters
- ✅ **New projects** - Start with the best tool from day one
- ✅ **Existing projects** - Easy migration with compatibility layer

### Benchmark Reproduction

To run the benchmarks yourself:

```bash
npm run bench:compat
```

This will compile both libraries and run comprehensive performance tests.

---

## Additional Resources

- [Ergonomic API Guide](./ERGONOMIC_API.md)
- [class-transformer Compatibility Guide](./CLASS_TRANSFORMER_COMPATIBILITY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [GitHub Repository](https://github.com/Isqanderm/data-mapper)

---

**Made with ❤️ by the om-data-mapper team**

