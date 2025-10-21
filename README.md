# om-data-mapper

[![CI](https://github.com/Isqanderm/data-mapper/workflows/CI/badge.svg)](https://github.com/Isqanderm/data-mapper/actions)
[![CodeQL](https://github.com/Isqanderm/data-mapper/workflows/CodeQL/badge.svg)](https://github.com/Isqanderm/data-mapper/security/code-scanning)
[![codecov](https://codecov.io/gh/Isqanderm/data-mapper/branch/main/graph/badge.svg)](https://codecov.io/gh/Isqanderm/data-mapper)
[![npm version](https://img.shields.io/npm/v/om-data-mapper.svg)](https://www.npmjs.com/package/om-data-mapper)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/om-data-mapper)](https://bundlephobia.com/package/om-data-mapper)
[![Node Version](https://img.shields.io/node/v/om-data-mapper)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/om-data-mapper.svg)](https://www.npmjs.com/package/om-data-mapper)
[![Documentation](https://img.shields.io/badge/docs-English%20%7C%20Russian-blue)](./docs/README.md)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Isqanderm/data-mapper)

High-performance TypeScript/JavaScript data mapper with JIT compilation for ultra-fast object transformations. Features a modern **Decorator API** with JIT compilation that delivers **up to 42.7x better performance** than class-transformer, while providing a clean, declarative syntax and zero runtime dependencies.

---

## 📑 Table of Contents

- [Quick Comparison](#-quick-comparison)
- [Performance](#-performance)
- [Features](#-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Why om-data-mapper?](#why-om-data-mapper)
  - [Performance That Matters](#-performance-that-matters)
  - [Modern, Clean API](#-modern-clean-api)
  - [Key Advantages](#-key-advantages)
  - [Developer Experience](#-developer-experience)
  - [Production Ready](#-production-ready)
- [Migrating from class-transformer](#migrating-from-class-transformer)
- [Performance Benchmarks](#performance-benchmarks)
  - [vs class-transformer](#vs-class-transformer)
  - [vs Vanilla JavaScript](#vs-vanilla-javascript)
  - [Continuous Performance Tracking](#continuous-performance-tracking)
- [Core Features](#core-features)
  - [Simple Property Mapping](#-simple-property-mapping)
  - [Nested Object Mapping](#-nested-object-mapping)
  - [Nested Mapper Composition](#-nested-mapper-composition)
  - [Array Transformations](#-array-transformations)
  - [Advanced Transformations](#-advanced-transformations)
  - [Error Handling](#️-error-handling)
- [class-transformer Compatibility Layer](#class-transformer-compatibility-layer)
- [Real-World Examples](#real-world-examples)
  - [REST API Response Transformation](#rest-api-response-transformation)
  - [Database Entity to DTO](#database-entity-to-dto)
  - [Form Data Validation & Transformation](#form-data-validation--transformation)
- [Documentation](#-documentation)
- [API Quick Reference](#api-quick-reference)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## 🎯 Quick Comparison

**class-transformer:**
```typescript
import 'reflect-metadata';  // Extra dependency
import { plainToClass, Expose, Transform } from 'class-transformer';

class UserDTO {
  @Expose({ name: 'firstName' })
  name: string;

  @Transform(({ value }) => value >= 18)
  @Expose()
  isAdult: boolean;
}

const user = plainToClass(UserDTO, data);  // 326K ops/sec
```

**om-data-mapper:**
```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

@Mapper<Source, UserDTO>()
class UserMapper {
  @Map('firstName')
  name!: string;

  @MapFrom((src: Source) => src.age >= 18)
  isAdult!: boolean;
}

const user = plainToInstance(UserMapper, data);  // 4.3M ops/sec (13.2x faster!)
```

**Key Differences:**
- ✅ **No reflect-metadata** - Zero dependencies
- ✅ **TC39 Stage 3 decorators** - Modern standard, not experimental
- ✅ **17.28x faster** - JIT compilation for optimal performance
- ✅ **Better DX** - Cleaner syntax, full type safety
- ✅ **70% smaller** - Reduced bundle size

## 🚀 Performance

**17.28x faster than class-transformer on average!**

| Scenario | class-transformer | om-data-mapper | Performance Gain |
|----------|-------------------|----------------|------------------|
| Simple Transformation | 326K ops/sec | 4.3M ops/sec | **12.3x faster** |
| Complex Nested | 154K ops/sec | 6.7M ops/sec | **42.7x faster** |
| Array (100 items) | 5.2K ops/sec | 69K ops/sec | **12.3x faster** |
| Custom Logic | 333K ops/sec | 4.8M ops/sec | **13.4x faster** |

📊 See [Transformer Usage Guide](./docs/transformer-usage.md) for detailed performance comparisons

## ✨ Features

- 🚀 **17.28x Faster**: Dramatically better performance than class-transformer
- 🎨 **Modern Decorator API**: Clean, declarative syntax using TC39 Stage 3 decorators
- 🔒 **Type-Safe**: Full TypeScript support with compile-time type checking
- ⚡ **JIT Compilation**: Generates optimized code automatically
- 📦 **Zero Dependencies**: No reflect-metadata or other runtime dependencies
- 🔄 **Drop-in Replacement**: Compatible with class-transformer API
- 🛡️ **Production-Ready**: Battle-tested with comprehensive test coverage
- 💡 **Ergonomic API**: Helper functions for clean, type-safe code

## Installation

Install `om-data-mapper` using npm:

```bash
npm install om-data-mapper
```

Or using yarn:

```bash
yarn add om-data-mapper
```

Or using pnpm:

```bash
pnpm add om-data-mapper
```

## Quick Start

```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

// 1. Define your types
type UserSource = {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
};

type UserDTO = {
  fullName: string;
  email: string;
  isAdult: boolean;
};

// 2. Create a mapper class with decorators
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  @MapFrom((src: UserSource) => src.age >= 18)
  isAdult!: boolean;
}

// 3. Transform your data
const source = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com',
};

const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);

console.log(result);
// { fullName: 'John Doe', email: 'john@example.com', isAdult: true }
```

**That's it!** Full TypeScript type safety, no boilerplate, clean code.

## Why om-data-mapper?

### 🚀 Performance That Matters

**17.28x faster than class-transformer** isn't just a number—it's real-world impact:

- **API Responses**: Transform 1000 objects in **14ms** instead of **242ms**
- **Batch Processing**: Handle millions of records without performance degradation
- **Real-time Systems**: Sub-millisecond transformations for high-throughput applications

### 🎯 Modern, Clean API

**Before (class-transformer):**
```typescript
import 'reflect-metadata';  // ❌ Extra dependency
import { plainToClass, Expose, Transform } from 'class-transformer';

class UserDTO {
  @Expose({ name: 'first_name' })  // ❌ Verbose configuration
  firstName: string;

  @Transform(({ value }) => value.toUpperCase())  // ❌ Wrapper objects
  @Expose()
  name: string;
}

const result = plainToClass(UserDTO, data);  // ❌ Legacy decorators
```

**After (om-data-mapper):**
```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

@Mapper<Source, UserDTO>()  // ✅ TC39 Stage 3 decorators
class UserMapper {
  @Map('first_name')  // ✅ Simple, clear
  firstName!: string;

  @MapFrom((src: Source) => src.name.toUpperCase())  // ✅ Direct access
  name!: string;
}

const result = plainToInstance(UserMapper, data);  // ✅ Type-safe
```

### 💡 Key Advantages

| Feature | class-transformer | om-data-mapper |
|---------|------------------|----------------|
| **Performance** | Baseline | **17.28x faster** |
| **Dependencies** | reflect-metadata required | **Zero dependencies** |
| **Bundle Size** | ~50KB | **~15KB (70% smaller)** |
| **Decorators** | Legacy (experimental) | **TC39 Stage 3 (standard)** |
| **Type Safety** | Runtime only | **Compile-time for transformers** |
| **JIT Compilation** | ❌ | **✅ Optimized code generation** |
| **Null Safety** | Manual | **Automatic optional chaining** |
| **Error Handling** | Throws exceptions | **Structured error reporting** |

### 🎓 Developer Experience

```typescript
// ✅ Type-safe mapper definition
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('firstName')  // String paths - runtime validation
  name!: string;     // TypeScript validates target type

  @MapFrom((src: UserSource) => src.firstName)  // ← Full type checking!
  fullName!: string;  // ← TypeScript knows src type and validates return type
}

// ✅ Type-safe transformers
@MapFrom((src: UserSource) => src.age)  // ← Autocomplete for 'src' properties
age!: number;  // ← TypeScript validates return type matches field type

// ⚠️ Note: String paths in @Map() are validated at runtime, not compile-time
// For compile-time safety, use @MapFrom() with typed functions
```

### 🔒 Production Ready

- ✅ **98% test coverage** - Comprehensive test suite
- ✅ **Battle-tested** - Used in production applications
- ✅ **Continuous benchmarking** - Performance tracked on every commit
- ✅ **TypeScript-first** - Written in TypeScript, for TypeScript
- ✅ **Zero breaking changes** - Drop-in replacement for class-transformer

## Migrating from class-transformer

om-data-mapper provides a **drop-in replacement** for class-transformer with **17.28x better performance** and **zero dependencies**.

### Step 1: Install

```bash
npm install om-data-mapper
```

### Step 2: Update Imports

```typescript
// Before
import 'reflect-metadata';
import { plainToClass, Expose, Type } from 'class-transformer';

// After
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
```

### Step 3: Done!

Your existing code works exactly the same, but **17.28x faster** on average!

**Benefits:**
- ✅ Same API, dramatically better performance
- ✅ No reflect-metadata dependency
- ✅ 70% smaller bundle size
- ✅ TC39 Stage 3 decorators

[📖 Full migration guide](./docs/transformer-usage.md#migration-from-class-transformer)

### Legacy API (Still Supported)

<details>
<summary>Click to see BaseMapper API (not recommended for new projects)</summary>

```typescript
import { Mapper } from 'om-data-mapper';

type User = {
  firstName: string;
  lastName: string;
  age: number;
};

type UserDTO = {
  fullName: string;
  isAdult: boolean;
};

const userMapper = Mapper.create<User, UserDTO>({
  fullName: (user) => `${user.firstName} ${user.lastName}`,
  isAdult: (user) => user.age >= 18,
});

const { result, errors } = userMapper.execute({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
});

console.log(result); // { fullName: 'John Doe', isAdult: true }
```

**Note**: The Decorator API is recommended for new projects due to better performance and developer experience.

</details>

## Performance Benchmarks

om-data-mapper delivers **exceptional performance** through JIT compilation and modern decorator implementation.

### vs class-transformer

**17.28x faster on average!** See [Transformer Usage Guide](./docs/transformer-usage.md) for detailed comparisons.

| Scenario | class-transformer | om-data-mapper | Improvement |
|----------|-------------------|----------------|-------------|
| Simple Transformation | 326K ops/sec | 4.3M ops/sec | **12.3x faster** |
| Complex Nested | 154K ops/sec | 6.7M ops/sec | **42.7x faster** |
| Array (100 items) | 5.2K ops/sec | 69K ops/sec | **12.3x faster** |
| Custom Logic | 333K ops/sec | 4.8M ops/sec | **13.4x faster** |

### vs Vanilla JavaScript

Performance is almost identical to hand-written code:

| Scenario | OmDataMapper | Vanilla | Overhead |
|----------|--------------|---------|----------|
| **Simple Mapping** | 946M ops/sec | 977M ops/sec | **3%** ⚡ |
| **Complex Transformations** | 21M ops/sec | 39M ops/sec | **89%** |

**Key Takeaways:**
- ✅ **17.28x faster** than class-transformer on average
- ✅ **Near-native performance** for simple mappings (3% overhead)
- ✅ **Production-ready**: Millions of operations per second
- ✅ **Zero dependencies**: No reflect-metadata overhead


<details>
<summary>📊 Detailed Benchmark Data</summary>

**Simple Mapping** (4 fields, nested access):
```javascript
// Source → Target mapping
{ id, name, details: { age, address } } → { userId, fullName, age, location }

OmDataMapper: 945,768,114 ops/sec ±1.02% (100 runs)
Vanilla:      977,313,179 ops/sec ±2.51% (96 runs)
```

**Complex Transformations** (nested objects, arrays, custom functions):
```javascript
// Multiple nested levels, array operations, custom transformers
OmDataMapper: 20,662,738 ops/sec ±1.36% (95 runs)
Vanilla:      38,985,378 ops/sec ±1.89% (96 runs)
```

*Benchmarks located in `/benchmarks` directory. Run `npm run bench` to test on your machine.*
</details>

### Continuous Performance Tracking

We use automated benchmarks to track performance regressions:
- 🔄 **Automatic**: Runs on every PR and commit to main
- 📊 **PR Comments**: Results posted automatically to pull requests
- 📈 **Historical Tracking**: Performance trends on [GitHub Pages](https://isqanderm.github.io/data-mapper/dev/bench/)
- 🔔 **Alerts**: Automatic notifications on regressions >150%

**Run benchmarks locally:**
```bash
# Run class-transformer comparison
npm run bench:compat

# Run core benchmarks
npm run bench:core

# Run all benchmarks
npm run bench
```

## Core Features

### 🎯 Simple Property Mapping

Map properties directly or with transformations:

```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

type Source = { firstName: string; lastName: string; age: number };
type Target = { name: string; isAdult: boolean };

@Mapper<Source, Target>()
class UserMapper {
  @Map('firstName')  // Direct mapping
  name!: string;

  @MapFrom((src: Source) => src.age >= 18)  // Custom transformation
  isAdult!: boolean;
}

const result = plainToInstance(UserMapper, { firstName: 'John', lastName: 'Doe', age: 30 });
// { name: 'John', isAdult: true }
```

### 🔗 Nested Object Mapping

Access deeply nested properties with ease:

```typescript
type Source = {
  user: {
    profile: {
      email: string;
      address: { city: string; street: string };
    };
  };
};

type Target = {
  email: string;
  city: string;
  street: string;
};

@Mapper<Source, Target>()
class ProfileMapper {
  @Map('user.profile.email')  // Nested path with automatic null-safety
  email!: string;

  @Map('user.profile.address.city')
  city!: string;

  @Map('user.profile.address.street')
  street!: string;
}
```

### 🔄 Nested Mapper Composition

Combine multiple mappers for complex transformations:

```typescript
type AddressSource = { street: string; city: string };
type AddressDTO = { fullAddress: string };

type UserSource = { name: string; address: AddressSource };
type UserDTO = { userName: string; location: AddressDTO };

@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
  fullAddress!: string;
}

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)  // Compose with another mapper
  @Map('address')
  location!: AddressDTO;
}

const result = plainToInstance(UserMapper, {
  name: 'John',
  address: { street: '123 Main St', city: 'New York' }
});
// { userName: 'John', location: { fullAddress: '123 Main St, New York' } }
```

### 📋 Array Transformations

Transform arrays with built-in support:

```typescript
type Source = {
  users: Array<{ id: number; name: string }>;
};

type Target = {
  userIds: number[];
  userNames: string[];
};

@Mapper<Source, Target>()
class CollectionMapper {
  @MapFrom((src: Source) => src.users.map(u => u.id))
  userIds!: number[];

  @MapFrom((src: Source) => src.users.map(u => u.name))
  userNames!: string[];
}
```

### 🎨 Advanced Transformations

Chain multiple decorators for complex logic:

```typescript
@Mapper<Source, Target>()
class AdvancedMapper {
  @MapFrom((src: Source) => src.value)
  @Transform((val: number | undefined) => val !== undefined ? val * 2 : undefined)
  @Default(0)  // Fallback value
  result!: number;

  @Map('email')
  @Transform((email: string) => email.toLowerCase())
  normalizedEmail!: string;
}
```

### 🛡️ Error Handling

Built-in error handling with `tryTransform`:

```typescript
const mapper = new UserMapper();

// Safe transformation - returns errors instead of throwing
const result = mapper.tryTransform(source);

if (result.errors.length > 0) {
  console.error('Transformation errors:', result.errors);
} else {
  console.log('Success:', result.result);
}
```

## class-transformer Compatibility Layer

🎉 **NEW:** om-data-mapper now includes a **full API compatibility layer** for [class-transformer](https://github.com/typestack/class-transformer) using modern **TC39 Stage 3 decorators**!

### Drop-in Replacement

Simply replace your class-transformer imports:

```typescript
// Before (class-transformer)
import { plainToClass, Expose, Type } from 'class-transformer';

// After (om-data-mapper)
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
```

### Example

```typescript
import { plainToClass, Expose, Type, Transform } from 'om-data-mapper/class-transformer-compat';

class Address {
  @Expose()
  street: string;

  @Expose()
  city: string;
}

class User {
  @Expose()
  id: number;

  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Expose()
  @Type(() => Address)
  address: Address;

  @Exclude()
  password: string;
}

const plain = {
  id: 1,
  name: 'john',
  address: { street: '123 Main St', city: 'New York' },
  password: 'secret'
};

const user = plainToClass(User, plain);
console.log(user.name); // 'JOHN'
console.log(user.address instanceof Address); // true
console.log(user.password); // undefined
```

### Features

- ✅ **Full API Compatibility** - All decorators and functions supported
- ✅ **TC39 Stage 3 Decorators** - Modern, standards-compliant implementation
- ✅ **Better Performance** - Optimized metadata storage and transformation
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Zero Breaking Changes** - Works exactly like class-transformer

---

## Real-World Examples

### REST API Response Transformation

```typescript
// API Response
type ApiUser = {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  created_at: string;
  is_active: boolean;
};

// Frontend Model
type User = {
  id: number;
  fullName: string;
  email: string;
  createdDate: Date;
  active: boolean;
};

@Mapper<ApiUser, User>()
class UserApiMapper {
  @Map('id')
  id!: number;

  @MapFrom((src: ApiUser) => `${src.first_name} ${src.last_name}`)
  fullName!: string;

  @Map('email_address')
  email!: string;

  @MapFrom((src: ApiUser) => new Date(src.created_at))
  createdDate!: Date;

  @Map('is_active')
  active!: boolean;
}

// Usage
const apiResponse = await fetch('/api/users/1').then(r => r.json());
const user = plainToInstance(UserApiMapper, apiResponse);
```

### Database Entity to DTO

```typescript
type UserEntity = {
  id: number;
  username: string;
  passwordHash: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

type UserDTO = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  memberSince: string;
};

@Mapper<UserEntity, UserDTO>()
class UserEntityMapper {
  @Map('id')
  id!: number;

  @Map('username')
  username!: string;

  @Map('email')
  email!: string;

  @MapFrom((src: UserEntity) => `${src.profile.firstName} ${src.profile.lastName}`)
  fullName!: string;

  @MapFrom((src: UserEntity) => src.profile.avatar || '/default-avatar.png')
  avatarUrl!: string;

  @MapFrom((src: UserEntity) => src.createdAt.toISOString())
  memberSince!: string;
}

// Usage in service
class UserService {
  async getUser(id: number): Promise<UserDTO> {
    const entity = await db.users.findById(id);
    return plainToInstance(UserEntityMapper, entity);
  }
}
```

### Form Data Validation & Transformation

```typescript
type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  age: string;  // From input field
  terms: string;  // 'on' or undefined
};

type RegistrationData = {
  email: string;
  password: string;
  age: number;
  agreedToTerms: boolean;
};

@Mapper<FormData, RegistrationData>()
class RegistrationMapper {
  @Map('email')
  @Transform((email: string) => email.toLowerCase().trim())
  email!: string;

  @Map('password')
  password!: string;

  @MapFrom((src: FormData) => parseInt(src.age, 10))
  age!: number;

  @MapFrom((src: FormData) => src.terms === 'on')
  agreedToTerms!: boolean;
}

// Usage
const formData = new FormData(form);
const registration = plainToInstance(RegistrationMapper, Object.fromEntries(formData));
```

## 📚 Documentation

Complete documentation is available in both **English** and **Russian**:

### English Documentation

📖 **[Documentation Index](./docs/README.md)** - Start here for complete guides

**User Guides:**
- [Validation Module - User Guide](./docs/validation-usage.md) - Complete guide to validation decorators and functions
- [Transformer Module - User Guide](./docs/transformer-usage.md) - Complete guide to transformation APIs (Decorator API & class-transformer compatibility)

**Internal Architecture:**
- [Validation JIT Compilation Internals](./docs/validation-jit-internals.md) - Deep dive into validation JIT compilation
- [Transformer JIT Compilation Internals](./docs/transformer-jit-internals.md) - Deep dive into transformer JIT compilation

### Russian Documentation (Русская документация)

📖 **[Индекс документации](./docs-ru/README.md)** - Начните отсюда для полных руководств

**Руководства пользователя:**
- [Модуль валидации - Руководство пользователя](./docs-ru/validation-usage.md) - Полное руководство по декораторам и функциям валидации
- [Модуль трансформации - Руководство пользователя](./docs-ru/transformer-usage.md) - Полное руководство по API трансформации

**Внутренняя архитектура:**
- [Внутреннее устройство JIT-компиляции валидации](./docs-ru/validation-jit-internals.md) - Глубокое погружение в JIT-компиляцию валидации
- [Внутреннее устройство JIT-компиляции трансформации](./docs-ru/transformer-jit-internals.md) - Глубокое погружение в JIT-компиляцию трансформации

---

## API Quick Reference

### Decorators

- **`@Mapper<Source, Target>(options?)`** - Class decorator to define a mapper
- **`@Map(sourcePath)`** - Map from source property (supports nested paths)
- **`@MapFrom(transformer)`** - Custom transformation function
- **`@Transform(transformer)`** - Post-process mapped value
- **`@Default(value)`** - Default value if source is undefined
- **`@MapWith(MapperClass)`** - Use nested mapper for complex objects
- **`@Ignore()`** - Exclude property from mapping

### Helper Functions

- **`plainToInstance<S, T>(MapperClass, source)`** - Transform single object
- **`plainToClass<S, T>(MapperClass, source)`** - Alias for plainToInstance
- **`plainToInstanceArray<S, T>(MapperClass, sources)`** - Transform array of objects
- **`tryPlainToInstance<S, T>(MapperClass, source)`** - Safe transformation with error handling
- **`createMapper<S, T>(MapperClass)`** - Create reusable mapper instance

For complete API documentation, see:
- **[Transformer Usage Guide](./docs/transformer-usage.md)** - Comprehensive guide with examples
- **[API Reference](https://isqanderm.github.io/data-mapper/)** - Auto-generated TypeDoc documentation

> 💡 **Tip**: The API Reference is generated from JSDoc comments in the source code and provides detailed type information, parameter descriptions, and usage examples for all public APIs.

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### TypeScript Decorator Errors

**Problem:** You see errors like `Experimental support for decorators is a feature that is subject to change` or decorators don't work as expected.

**Solution:** Ensure you're using TC39 Stage 3 decorators, not the legacy experimental decorators. Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",                    // Required for TC39 decorators
    "experimentalDecorators": false,       // Must be false (or omitted)
    "emitDecoratorMetadata": false,        // Must be false (or omitted)
    "useDefineForClassFields": true        // Recommended
  }
}
```

**❌ Incorrect Configuration:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,  // Wrong! This enables legacy decorators
    "emitDecoratorMetadata": true    // Not needed for om-data-mapper
  }
}
```

**✅ Correct Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": false  // Or simply omit this line
  }
}
```

---

#### Performance Not as Expected

**Problem:** Transformations are slower than expected or not showing the advertised performance gains.

**Solution 1:** Reuse mapper instances instead of creating new ones for each transformation.

**❌ Inefficient (creates new mapper each time):**
```typescript
function transformUsers(users: UserSource[]) {
  return users.map(user => plainToInstance(UserMapper, user));
}
```

**✅ Efficient (reuses compiled mapper):**
```typescript
import { getMapper } from 'om-data-mapper';

const userMapper = getMapper<UserSource, UserDTO>(UserMapper);

function transformUsers(users: UserSource[]) {
  return users.map(user => userMapper.transform(user));
}
```

**Solution 2:** Use `plainToInstanceArray` for batch transformations:

**❌ Less efficient:**
```typescript
const results = sources.map(source => plainToInstance(MyMapper, source));
```

**✅ More efficient:**
```typescript
const results = plainToInstanceArray(MyMapper, sources);
```

**Solution 3:** Enable unsafe mode for maximum performance (only if you're certain data is valid):

```typescript
@Mapper<Source, Target>({ unsafe: true })
class FastMapper {
  @Map('name')
  name!: string;
}
```

---

#### Migration from class-transformer Issues

**Problem:** Code that worked with class-transformer doesn't work with om-data-mapper.

**Solution 1:** Use the compatibility layer for a drop-in replacement:

```typescript
// Simply change the import path
// Before:
import { plainToClass, Expose, Type } from 'class-transformer';

// After:
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';

// Everything else stays the same!
```

**Solution 2:** Remove `reflect-metadata` import (not needed):

**❌ Not needed with om-data-mapper:**
```typescript
import 'reflect-metadata';  // Remove this line
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

**✅ Correct:**
```typescript
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

---

#### Nested Object Mapping Not Working

**Problem:** Nested objects are not being transformed correctly.

**Solution:** Use `@MapWith` decorator to specify the nested mapper:

**❌ Incorrect (nested object not transformed):**
```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @Map('address')  // This won't transform the nested object
  address!: AddressDTO;
}
```

**✅ Correct (nested object properly transformed):**
```typescript
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)  // Use nested mapper
  @Map('address')
  address!: AddressDTO;
}
```

---

#### Type Inference Issues

**Problem:** TypeScript doesn't infer types correctly or shows type errors.

**Solution:** Explicitly specify type parameters:

**❌ Type inference may fail:**
```typescript
const result = plainToInstance(UserMapper, source);  // Type may be 'any'
```

**✅ Explicit types ensure type safety:**
```typescript
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
```

**Alternative:** Use `createMapper` for better type inference:

```typescript
const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result = mapper.transform(source);  // Fully typed!
```

---

#### Transformation Errors Not Visible

**Problem:** Transformations fail silently without showing errors.

**Solution:** Use `tryPlainToInstance` or `tryTransform` for error visibility:

**❌ Errors are hidden:**
```typescript
const result = plainToInstance(UserMapper, source);
// If transformation fails, you won't know why
```

**✅ Errors are visible:**
```typescript
const { result, errors } = tryPlainToInstance(UserMapper, source);

if (errors.length > 0) {
  console.error('Transformation errors:', errors);
  // Handle errors appropriately
}
```

---

#### Default Values Not Applied

**Problem:** Default values specified with `@Default` decorator are not being applied.

**Solution:** Ensure `@Default` is placed before other decorators:

**❌ Incorrect order:**
```typescript
@Map('name')
@Default('Unknown')  // Won't work - must come before @Map
name!: string;
```

**✅ Correct order:**
```typescript
@Default('Unknown')  // Correct - comes before @Map
@Map('name')
name!: string;
```

---

#### Bundle Size Concerns

**Problem:** Bundle size is larger than expected.

**Solution 1:** Use tree-shaking compatible imports:

**✅ Import only what you need:**
```typescript
import { Mapper, Map, plainToInstance } from 'om-data-mapper';
```

**Solution 2:** Ensure your bundler supports tree-shaking:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

---

#### Runtime Errors in Production

**Problem:** Code works in development but fails in production builds.

**Solution 1:** Ensure decorators are not stripped by your build tool:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",  // Don't downlevel to ES5
    "module": "ESNext"
  }
}
```

**Solution 2:** Check that your bundler preserves class names:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,  // Preserve class names
          keep_fnames: true       // Preserve function names
        }
      })
    ]
  }
};
```

---

### Getting Help

If you're still experiencing issues:

1. **Check the documentation**: [docs/](./docs/) directory contains comprehensive guides
2. **Search existing issues**: [GitHub Issues](https://github.com/Isqanderm/data-mapper/issues)
3. **Ask a question**: [GitHub Discussions](https://github.com/Isqanderm/data-mapper/discussions)
4. **Report a bug**: [Create a new issue](https://github.com/Isqanderm/data-mapper/issues/new)

When reporting issues, please include:
- Your TypeScript version
- Your `tsconfig.json` configuration
- A minimal reproducible example
- Expected vs actual behavior

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up the development environment
- Running tests and linting
- Submitting pull requests
- Code of conduct

### 🛡️ Code Coverage Protection

This repository has **automated code coverage protection** enabled. All pull requests must maintain or improve the current code coverage percentage to be merged.

- ✅ Coverage maintained or improved → PR can be merged
- ❌ Coverage decreased → PR is blocked

See the [Coverage Protection Guide](./docs/COVERAGE_PROTECTION.md) for details on how to ensure your PR passes coverage checks.

## Security

If you discover a security vulnerability, please follow our [Security Policy](./SECURITY.md) for responsible disclosure.

## License

`om-data-mapper` is distributed under the MIT license. See the [LICENSE](./LICENSE) file in the root directory of the project for more information.
