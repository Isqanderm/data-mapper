[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Isqanderm/data-mapper)

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

`om-data-mapper` is a high-performance, type-safe object mapping library for TypeScript and JavaScript. It features a modern **Decorator API** with JIT compilation that delivers **up to 42.7x better performance** than class-transformer, while providing a clean, declarative syntax and zero runtime dependencies.

## 🚀 Performance

**17.28x faster than class-transformer on average!**

| Scenario | class-transformer | om-data-mapper | Performance Gain |
|----------|-------------------|----------------|------------------|
| Simple Transformation | 326K ops/sec | 4.3M ops/sec | **12.3x faster** |
| Complex Nested | 154K ops/sec | 6.7M ops/sec | **42.7x faster** |
| Array (100 items) | 5.2K ops/sec | 69K ops/sec | **12.3x faster** |
| Custom Logic | 333K ops/sec | 4.8M ops/sec | **13.4x faster** |

[📊 See full comparison](./docs/COMPARISON.md)

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

[📖 Full migration guide](./docs/COMPARISON.md#migration-guide)

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

## Performance

om-data-mapper delivers **exceptional performance** through JIT compilation and modern decorator implementation.

### vs class-transformer

**17.28x faster on average!** See [full comparison](./docs/COMPARISON.md).

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
- 📚 **Documentation**: See [Benchmark Setup Guide](./docs/BENCHMARK_SETUP.md) for details

**Run benchmarks locally:**
```bash
# Run class-transformer comparison
npm run bench:compat

# Run core benchmarks
npm run bench:core

# Run all benchmarks
npm run bench
```

## Features

---

`om-data-mapper` offers the following features:

### Simple Mapping

Simple mapping allows you to easily transform one object into another by copying or transforming its properties.

```ts
const mapper = UserMapper.create<User, TargeetUser>({
  name: 'firstName',
  fullName: (user) => `${user.firstName} ${user.lastName}`,
});

const target = mapper.execute(sourceObject);
```

### Deep Mapping

Deep mapping supports the mapping of nested objects and allows the construction of complex data structures.

```ts
const addressMapper = AddressMapper.create<Address, TargetAddress>({
  fullAddress: (address) => `${address.city}, ${address.street}, ${address.appartment}`,
});
const mapper = UserMapper.create<User, TargetUser>({
  name: 'firstName',
  addressStreet: 'address.street',
  addressCity: 'address.city',
});

const target = mapper.execute(sourceObject);
```

### Mapping with Composition

Mapping with composition allows combining multiple mappers to create complex data transformations.

```ts
const addressMapper = AddressMapper.create<Address, TargetAddress>({
  fullAddress: (address) => `${address.city}, ${address.street}, ${address.appartment}`,
});
const mapper = UserMapper.create<User, TargetUser>({
  name: 'firstName',
  address: addressMapper,
});

const target = mapper.execute(sourceObject);
```

### Mapping with nested config

Mapping with composition allows combining multiple mappers to create complex data transformations.

```typescript
const mapper = UserMapper.create<User, TargetUser>({
  name: 'firstName',
  address: {
    city: 'address.city',
    street: 'address.street',
  },
});

const target = mapper.execute(sourceObject);
```

### Array Selectors

`om-data-mapper` supports array selectors for iterating over arrays and selecting specific elements by index.

[] - Iterates over an array.

[0] - Selects the element at the specified index.

Example: Iterating Over an Array

```typescript
const mapper = DataMapper.create<Source, Target>({
  items: 'array.[]',
});

const source = {
  array: [1, 2, 3],
};

const target = mapper.execute(source);
// target.items will be [1, 2, 3]
```

Example: Selecting an Element by Index

```typescript
const mapper = DataMapper.create<Source, Target>({
  firstItem: 'array.[0]',
});

const source = {
  array: [1, 2, 3],
};

const target = mapper.execute(source);
// target.firstItem will be 1
```

## Multiple Parameters

You can define mappers that accept a tuple of source values, enabling lookups or cross-data transformations. Use $0, $1, etc., to refer to each element:

```typescript
import { Mapper } from 'om-data-mapper';

type Employee = {
  name: string;
  email: string;
  age: number;
  jobId: number;
};

type JobType = {
  id: number;
  name: string;
};

type EmployeeDTO = {
  fullName: string;
  emailAddress: string;
  isAdult: boolean;
  job: JobType;
  jobName: string;
};

const employeeMapper = Mapper.create<[Employee, JobType[]], EmployeeDTO>({
  fullName: '$0.name',
  emailAddress: '$0.email',
  isAdult: ([emp]) => emp.age >= 18,
  job: ([emp, jobs]) => jobs.find((j) => j.id === emp.jobId)!,
  jobName: '$1.[0].name',
});

const jobs: JobType[] = [
  { id: 1, name: 'Electronic' },
  { id: 2, name: 'Janitor' },
  { id: 3, name: 'Driver' },
];

const employee: Employee = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  jobId: 1,
};

const dto = employeeMapper.execute([employee, jobs]);

console.log(dto);
/*
{
  fullName: 'John Doe',
  emailAddress: 'john.doe@example.com',
  isAdult: true,
  job: { id: 1, name: 'Electronic' },
  jobName: 'Electronic'
}
*/
```

## UnSafe Mode

You can can pass config to mapper `{ useUnsafe: true }` then all try/catch will be removed from compile mapper function

```typescript
Mapper.create(mappingConfig, defaultValues, { useUnsafe: true });
```

this will greatly improve performance, but errors inside the conversion will not be intercepted.

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

### Documentation

- [Class-Transformer Compatibility Guide](./docs/CLASS_TRANSFORMER_COMPATIBILITY.md) - Complete API reference
- [TC39 Decorators Migration Guide](./docs/TC39_DECORATORS_MIGRATION.md) - Migration from legacy decorators

---

## API Documentation

For more detailed examples and advanced usage patterns, check out the [examples directory](./example) in this repository:

- [Simple Mapping](./example/simple) - Basic property mapping
- [Deep Mapping](./example/deep) - Nested object mapping
- [Complex Mapping](./example/complex) - Advanced transformations
- [Array Mapping](./example/array) - Working with arrays
- [Nested Config](./example/nested) - Nested configuration patterns
- [Error Handling](./example/error) - Error handling examples

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up the development environment
- Running tests and linting
- Submitting pull requests
- Code of conduct

## Security

If you discover a security vulnerability, please follow our [Security Policy](./SECURITY.md) for responsible disclosure.

## License

`om-data-mapper` is distributed under the MIT license. See the [LICENSE](./LICENSE) file in the root directory of the project for more information.
