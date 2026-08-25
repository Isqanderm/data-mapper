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
decorators (not the legacy `experimentalDecorators` flag). Each decorated mapper or validator
class is JIT-compiled into a plain function the first time it's used, so the decorator metadata
is read once instead of on every call. The three scoped packages have zero runtime dependencies,
and every package ships dual CJS and ESM builds.

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

Mapping and validation logic is generated once per class (JIT) and reused on every subsequent
call, avoiding repeated reflection over decorator metadata at call time. Beyond that, this
README makes no performance claims — benchmarks are reproducible locally with `pnpm bench`; see
[`benchmarks/README.md`](./benchmarks/README.md) for how to run and read them. This project
intentionally publishes no benchmark numbers it cannot regenerate in CI.

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
