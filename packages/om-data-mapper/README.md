# om-data-mapper

High-performance TypeScript/JavaScript data mapper and validator with JIT compilation.
Meta-package: re-exports `@tech-pioneer/data-mapper-core` and the class-transformer / class-validator
compatibility adapters.

Install this one package to get everything — the mapper, and both compatibility adapters — in a
single dependency.

## Install

```bash
npm install om-data-mapper
```

## Quick start

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

## What it re-exports

```
om-data-mapper (5.x)
├── @tech-pioneer/data-mapper-core (1.x)               — re-exported at the package root
├── @tech-pioneer/data-mapper-class-transformer (1.x)  — re-exported at ./class-transformer-compat
└── @tech-pioneer/data-mapper-class-validator (1.x)    — re-exported at ./class-validator-compat
```

`om-data-mapper` is versioned independently (5.x) from the three scoped packages it re-exports
(1.x each) — install the meta-package if you don't want to track four version numbers, or install
the scoped packages directly for a smaller dependency footprint.

## v4 subpath aliases

The two v4 compat subpaths still work as import aliases, so you can migrate from
`class-transformer`/`class-validator` directly by changing only the import path:

```ts
import { plainToClass, Type } from 'om-data-mapper/class-transformer-compat';
```

```ts
import { validate, IsString } from 'om-data-mapper/class-validator-compat';
```

If you're already on `om-data-mapper` and coming from v4, see the migration guide linked below —
these subpaths, and the top-level `om-data-mapper` import, are unchanged in v5.

## Links

- [Project README](https://github.com/Isqanderm/data-mapper/blob/main/README.md)
- [v4 → v5 migration guide](https://github.com/Isqanderm/data-mapper/blob/main/docs/migration-v4-to-v5.md)
- [class-transformer compatibility table](https://github.com/Isqanderm/data-mapper/blob/main/docs/compat-class-transformer.md)
- [class-validator compatibility table](https://github.com/Isqanderm/data-mapper/blob/main/docs/compat-class-validator.md)

## License

MIT
