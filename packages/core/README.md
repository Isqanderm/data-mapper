# @tech-pioneer/data-mapper-core

High-performance TypeScript/JavaScript data mapper with JIT compilation. TC39 decorators, zero
dependencies.

Each `@Mapper`-decorated class is compiled into a plain mapping function the first time it's
used, so decorator metadata is read once instead of on every call. This package has zero runtime
dependencies and ships dual CJS and ESM builds.

## TC39 decorators

`@tech-pioneer/data-mapper-core` uses TC39 Stage 3 decorators, not the legacy `experimentalDecorators`
flag. You do not need `"experimentalDecorators": true` in `tsconfig.json` — the package works
with the standard decorator proposal and requires `"useDefineForClassFields": true` (the default
under modern `target`s).

## Install

```bash
npm install @tech-pioneer/data-mapper-core
```

## Quick start

```ts
import { Mapper, Map, MapFrom, plainToInstance } from '@tech-pioneer/data-mapper-core';

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

## API

Decorators:

- `Mapper` — mark a class as a mapper and register it for JIT compilation
- `Map` — map a property from a source key, with dot-notation support
- `MapFrom` — compute a property from a function over the source object
- `Default` — set a default value when the mapped value is `undefined`
- `Transform` — post-process a mapped value
- `MapWith` — delegate a property to a nested mapper class
- `Ignore` — exclude a property from mapping

Helper functions:

- `createMapper` / `getMapper` — get a reusable mapper function for a class
- `plainToInstance` / `plainToClass` — map a single plain object
- `plainToInstanceArray` / `plainToClassArray` — map an array of plain objects
- `tryPlainToInstance` / `tryPlainToInstanceArray` — map with collected errors instead of throwing

## Links

- [Project README](https://github.com/Isqanderm/data-mapper/blob/main/README.md)
- [Documentation index](https://github.com/Isqanderm/data-mapper/blob/main/docs/README.md)
- [Examples](https://github.com/Isqanderm/data-mapper/tree/main/examples)
- [v4 → v5 migration guide](https://github.com/Isqanderm/data-mapper/blob/main/docs/migration-v4-to-v5.md)

## License

MIT
