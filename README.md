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

`om-data-mapper` is a flexible and powerful tool for object mapping in JavaScript and TypeScript, supporting simple mapping, deep mapping, and mapping through composition.

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

Get started with `om-data-mapper` in just a few lines:

```typescript
import { Mapper } from 'om-data-mapper';

// Define your source and target types
type User = {
  firstName: string;
  lastName: string;
  age: number;
};

type UserDTO = {
  fullName: string;
  isAdult: boolean;
};

// Create a mapper
const userMapper = Mapper.create<User, UserDTO>({
  fullName: (user) => `${user.firstName} ${user.lastName}`,
  isAdult: (user) => user.age >= 18,
});

// Execute the mapping
const user: User = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
};

const { result, errors } = userMapper.execute(user);
console.log(result); // { fullName: 'John Doe', isAdult: true }
```

## Performance

Performance of om-data-mapper is almost identical to a native, hand-written “vanilla” mapper—demonstrating near-native speeds even in “safe” mode. Enabling Unsafe Mode (useUnsafe: true) removes all try/catch overhead and pushes performance even higher.

[![Benchmark Chart](https://raw.githubusercontent.com/Isqanderm/data-mapper/659ae4ac86f3a44bc16475867ad26efaa8dd6177/benchmarks/benckmarks.png)](https://raw.githubusercontent.com/Isqanderm/data-mapper/659ae4ac86f3a44bc16475867ad26efaa8dd6177/benchmarks/benckmarks.png)

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
