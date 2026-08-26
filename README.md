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

`om-data-mapper` maps and validates plain objects in TypeScript/JavaScript using TC39 Stage 3
decorators (not the legacy `experimentalDecorators` flag). The core mapper and the
class-validator adapter each JIT-compile a decorated class into a plain function the first time
it's used, so metadata is read once instead of on every call; the class-transformer adapter
instead registers metadata once at class definition and interprets it at call time (no
`reflect-metadata`, no per-call decorator re-evaluation). The three scoped packages have zero
runtime dependencies, and every package ships dual CJS and ESM builds.

## Packages

This is a monorepo of four npm packages:

| Package                                                                       | Version | Description                                                                                               |
| ----------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| [`om-data-mapper`](./packages/om-data-mapper/README.md)                       | 5.x     | Meta-package — re-exports `@om-data-mapper/core` plus the class-transformer and class-validator adapters. |
| [`@om-data-mapper/core`](./packages/core/README.md)                           | 1.x     | The decorator API: `@Mapper`, `@Map`, `@MapFrom`, `@Transform`, `@MapWith`, `@Default`, `@Ignore`.        |
| [`@om-data-mapper/class-transformer`](./packages/class-transformer/README.md) | 1.x     | Compatibility adapter for `class-transformer` — `Expose`/`Exclude`/`Type`/`Transform`, `plainToInstance`. |
| [`@om-data-mapper/class-validator`](./packages/class-validator/README.md)     | 1.x     | Compatibility adapter for `class-validator` — its own JIT validation engine, ~90 decorators.              |

## Installation

```bash
npm install om-data-mapper
```

`om-data-mapper` pulls in all three scoped packages. If you only need one piece, install it
directly:

```bash
npm install @om-data-mapper/core
npm install @om-data-mapper/class-transformer
npm install @om-data-mapper/class-validator
```

## Quick start

### Core mapping

```ts
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

type Employee = { name: string; email: string; age: number };
type EmployeeDTO = { fullName: string; emailAddress: string; isAdult: boolean };

@Mapper<Employee, EmployeeDTO>()
class EmployeeMapper {
  @Map('name')
  fullName!: string;

  @Map('email')
  emailAddress!: string;

  @MapFrom((source: Employee) => source.age >= 18)
  isAdult!: boolean;
}

const employee: Employee = { name: 'John Doe', email: 'john.doe@example.com', age: 30 };
const dto = plainToInstance<Employee, EmployeeDTO>(EmployeeMapper, employee);
// { fullName: 'John Doe', emailAddress: 'john.doe@example.com', isAdult: true }
```

### class-transformer compatibility

```ts
import { plainToClass, Expose, Type } from '@om-data-mapper/class-transformer';

class Address {
  @Expose() street!: string;
  @Expose() city!: string;
}

class User {
  @Expose() name!: string;

  @Expose()
  @Type(() => Address)
  address!: Address;
}

const user = plainToClass(User, {
  name: 'John',
  address: { street: '123 Main St', city: 'New York' },
});
// user.address instanceof Address === true
```

### class-validator compatibility

```ts
import { IsString, MinLength, validate } from '@om-data-mapper/class-validator';

class UserDto {
  @IsString()
  @MinLength(3)
  name!: string;
}

const user = new UserDto();
user.name = 'Jo'; // too short

const errors = await validate(user);
// errors[0].property === 'name'
// errors[0].constraints has a 'minLength' key
```

## Compatibility

The `class-transformer` and `class-validator` adapters are a **drop-in replacement for the
supported subset** of each library's API — not a claim of full parity. Before migrating, check
the generated, API-by-API status tables:

- [class-transformer compatibility](./docs/compat-class-transformer.md)
- [class-validator compatibility](./docs/compat-class-validator.md)

If you're upgrading from `class-transformer`/`class-validator` directly (not from
`om-data-mapper` v4), the `om-data-mapper` meta-package also exposes both adapters as import
aliases so you can migrate by changing an import path:

```ts
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
import { validate } from 'om-data-mapper/class-validator-compat';
```

## Performance

Core mapping and class-validator validation logic are generated once per class (JIT) and reused
on every subsequent call, avoiding repeated reflection over decorator metadata at call time. The
class-transformer adapter instead walks its registered metadata at call time — there is no JIT
step.

Every number below comes from `pnpm bench:compat`, which you can run yourself. Before timing
anything, each comparison asserts at import time that both engines do the same real work on the
same fixtures — same error counts, deep-equal outputs. A guard failure aborts the run, so a
benchmark cannot report a speedup for an engine that quietly did nothing.

### Compared to the upstream packages

| Scenario                                    | om-data-mapper | upstream     | Ratio     |
| ------------------------------------------- | -------------- | ------------ | --------- |
| `validateSync` — simple object, valid       | 3,494,121 op/s | 160,491 op/s | **21.8×** |
| `validateSync` — simple object, invalid     | 3,153,949 op/s | 56,114 op/s  | **56.2×** |
| `validateSync` — optional fields, valid     | 2,514,914 op/s | 176,044 op/s | **14.3×** |
| `validateSync` — optional fields, invalid   | 2,558,698 op/s | 102,069 op/s | **25.1×** |
| `validateSync` — nested object, valid       | 1,514,548 op/s | 140,032 op/s | **10.8×** |
| `validateSync` — nested object, invalid     | 1,075,212 op/s | 71,192 op/s  | **15.1×** |
| `instanceToPlain` — with `@Exclude`         | 1,160,009 op/s | 182,753 op/s | **6.4×**  |
| `plainToInstance` — rename + nested `@Type` | 330,371 op/s   | 164,475 op/s | **2.0×**  |

The margin widens on invalid data, where upstream spends time building error objects that the
generated validator does not.

### Compared to hand-written code

The same suite measures the core mapper against plain JavaScript that does the mapping directly
(`pnpm bench:core`). Hand-written code wins most of it:

| Scenario                          | Winner         | Ratio                |
| --------------------------------- | -------------- | -------------------- |
| Map 100 items                     | Vanilla        | 2.3×                 |
| Complex mapping with transformers | Vanilla        | 1.7×                 |
| Simple mapping                    | Vanilla        | 1.4×                 |
| Deep nested access                | om-data-mapper | 1.05× (within noise) |

JIT compilation pays off against _interpreting decorator metadata on every call_, which is what
the upstream packages do — not against direct property access. If you would otherwise write the
mapping by hand and it is hot, write it by hand.

**Measured on:** Apple M1 Pro (10 cores), macOS 26.5.2, Node 22.21.1, against `class-validator`
0.14.4 and `class-transformer` 0.5.1, 2026-08-26. Several samples carry a wide relative margin of
error (up to ±66%) — that variance does not account for order-of-magnitude gaps, but treat single
digits as indicative rather than precise. Your hardware will differ; rerun the command.

See [`benchmarks/README.md`](./benchmarks/README.md) for how the suite is built and what its
fairness rules are. This project publishes no benchmark number it cannot regenerate on demand.

## Documentation

- [Documentation index](./docs/README.md) — start here
- [Transformer usage guide](./docs/transformer-usage.md)
- [Validation usage guide](./docs/validation-usage.md)
- [class-transformer compatibility table](./docs/compat-class-transformer.md)
- [class-validator compatibility table](./docs/compat-class-validator.md)
- [Migrating from class-transformer](./docs/migration-class-transformer.md)
- [Migrating v4 → v5](./docs/migration-v4-to-v5.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Transformer JIT internals](./docs/transformer-jit-internals.md)
- [Validation JIT internals](./docs/validation-jit-internals.md)
- [Русская документация](./docs-ru/README.md)
- [Examples](./examples/README.md) — runnable, type-checked example programs

## Project status

This is the v5 monorepo split of `om-data-mapper`: 549 tests across 38 files, actively
maintained. See [`CHANGELOG.md`](./CHANGELOG.md) for release history, and
[`docs/migration-v4-to-v5.md`](./docs/migration-v4-to-v5.md) if you're coming from the
pre-monorepo v4 package.

## Contributing

We welcome contributions! See the [Contributing Guide](./CONTRIBUTING.md) for development setup,
testing, and the pull request process.

## Security

If you discover a security vulnerability, please follow our [Security Policy](./SECURITY.md) for
responsible disclosure.

## License

`om-data-mapper` is distributed under the MIT license. See [LICENSE](./LICENSE) for details.
