# Migration Guide: om-data-mapper v4 → v5

v5 splits the old `om-data-mapper` monolith into four packages: a core
mapper/transformer engine plus separate class-transformer and
class-validator compatibility adapters, with `om-data-mapper` itself
becoming a meta-package that re-exports all three. For most users
upgrading the meta-package requires **no code changes** — the same
top-level import keeps working.

## Package layout

| Package                                       | Version | What it is                                                                                  |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `om-data-mapper`                              | 5.0.0   | Meta-package. Re-exports `@tech-pioneer/data-mapper-core` and keeps the v4 compat subpaths. |
| `@tech-pioneer/data-mapper-core`              | 1.0.0   | The mapper/transformer engine (JIT compilation, decorators, core types).                    |
| `@tech-pioneer/data-mapper-class-transformer` | 1.0.0   | `class-transformer`-compatible API, standalone (does not depend on core).                   |
| `@tech-pioneer/data-mapper-class-validator`   | 1.0.0   | `class-validator`-compatible API, with its own validation engine.                           |

The scoped packages (`@tech-pioneer/data-mapper-core`, `@tech-pioneer/data-mapper-class-transformer`,
`@tech-pioneer/data-mapper-class-validator`) can be installed individually if you only
need part of the functionality — this gives you a smaller dependency
footprint than pulling in the `om-data-mapper` meta-package.

## Imports

**Unchanged** — importing from the meta-package keeps working, because it
re-exports `@tech-pioneer/data-mapper-core`:

```typescript
import { Mapper, Map } from 'om-data-mapper';
```

**Still works** — the v4 compat subpaths are kept as aliases on the
meta-package:

```typescript
import { plainToInstance, Type } from 'om-data-mapper/class-transformer-compat';
```

```typescript
import { validate, IsString } from 'om-data-mapper/class-validator-compat';
```

Optionally, migrate those two to the scoped packages directly — same API,
one less indirection:

```typescript
import { plainToInstance, Type } from '@tech-pioneer/data-mapper-class-transformer';
```

```typescript
import { validate, IsString } from '@tech-pioneer/data-mapper-class-validator';
```

## Behavior changes in the class-validator adapter

In v4, several documented `ValidatorOptions` were declared in the types but
never wired into the validation engine — passing them silently did nothing.
In v5 all of the following now actually work: `whitelist`,
`forbidNonWhitelisted`, `skipMissingProperties`, `skipNullProperties`,
`skipUndefinedProperties`, `stopAtFirstError`, `forbidUnknownValues`.

**`whitelist: true` now actually strips unknown properties.** In v4 this
option was a silent no-op; in v5 it mutates the validated object and
deletes properties that have no validation decorators (properties marked
`@Allow()` are kept):

```typescript
class Dto {
  @IsString()
  name: any = 'ok';
  @Allow()
  extraAllowed: any = 1;
}

const dto: any = new Dto();
dto.rogue = 'x';
validateSync(dto, { whitelist: true });
// dto.rogue no longer exists — it was stripped
```

If you passed `whitelist: true` in v4 expecting it to be ignored, your code
now gets a different (trimmed) object back. Since this brings the adapter's
behavior in line with what the option always claimed to do, it's shipped as
a bugfix under this major version — audit any code that relies on the old
no-op.

`forbidUnknownValues` defaults to `false` here, diverging from upstream
`class-validator@0.14`, which defaults to `true`. This default was chosen so
that upgrading does not newly start rejecting objects with unrecognized
shapes; pass `forbidUnknownValues: true` explicitly to opt into the
upstream-matching, stricter behavior. See
[`./compat-class-validator.md`](./compat-class-validator.md) for details.

**NestJS note:** `ValidationPipe`'s default options
(`whitelist`, `forbidNonWhitelisted`, and friends) now take effect for real.
If you use `@tech-pioneer/data-mapper-class-validator` (or the `class-validator-compat`
alias) behind NestJS's `ValidationPipe` with its defaults, upgrading to v5
may start stripping or rejecting properties that previously passed through
untouched — review your DTOs.

v5 also adds APIs that were entirely missing in v4:

- Function-form `message` on validation options, called with
  `ValidationArguments` (`{ value, constraints, targetName, object, property }`):

  ```typescript
  class Dto {
    @IsString({
      message: (args: ValidationArguments) =>
        `${args.property} of ${args.targetName} got ${args.value}`,
    })
    name: any = 42;
  }
  ```

- `registerDecorator`, for writing custom decorators. It must be called
  from inside a TC39 `addInitializer` callback — see
  [`./compat-class-validator.md`](./compat-class-validator.md#migrating-custom-decorators-registerdecorator)
  for the full pattern, since there is no `reflect-metadata`-based decorator
  context to hook into.
- `getMetadataStorage`, as a minimal facade.
- `ValidationError` target/value stripping: `error.target` and
  `error.value` are stripped recursively (including through `children`) so
  errors don't leak the full validated object by default.

## Behavior changes in the class-transformer adapter

`enableImplicitConversion` is now implemented — primitive coercion via
`@Type`:

```typescript
class Dto {
  @Type(() => Number)
  age!: number;
}

const dto = plainToInstance(Dto, { age: '42' }, { enableImplicitConversion: true });
// dto.age === 42 (number)
```

This requires an explicit `@Type(() => Number/String/Boolean/Date)` on the
property — without `reflect-metadata`-derived design-time types under TC39
decorators, there is nothing else to coerce against. See
[`./compat-class-transformer.md`](./compat-class-transformer.md) for the
array-of-primitives caveat.

The following dead `ClassTransformOptions` fields were **removed from the
types**: `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`,
`enableValidation`. They never did anything in v4 — code that passes them
now fails TypeScript compilation. The fix is to delete the option from your
call site; no replacement is needed since none of them had any effect
before.

## Legacy `Mapper.create`

The legacy `Mapper.create({ ... })` class API is not part of v5's public
surface. It was already unreachable in the v4 layout: the core entry point
did `export * from './core/Mapper'` (the legacy class) alongside
`export { Mapper } from './decorators'` (the class decorator), and under ES
module semantics the explicit named export wins. So
`import { Mapper } from 'om-data-mapper'` has always given you the
`@Mapper()` decorator, never the legacy class. v5 drops the dead re-export.

Migrate to the decorator API:

```typescript
// Legacy (never actually reachable through the package entry point)
const mapper = Mapper.create({ fullName: 'name', emailAddress: 'email' });
const result = mapper.execute(source).result;

// v5
@Mapper<Source, Target>()
class UserMapper {
  @Map('name')
  fullName!: string;

  @Map('email')
  emailAddress!: string;
}

const result = plainToInstance(UserMapper, source);
```

## Behavior changes in the core mapper

**Bracket-index syntax in a `@Map()` path no longer resolves.**
`@Map('items[0].name')` used to work by accident: the code generator split
the path on `.` and joined the segments with `?.`, so `items[0]` reached the
generated source as a real index expression. It was never deliberately
supported and was never documented. v5's generator emits each segment as a
JSON-escaped literal key (`?.["items[0]"]`) so that keys can never become
code — which means such a path now yields `undefined` instead of the indexed
value. For array indexing use `@MapFrom` with an explicit function over the
source, `@Map('items')` plus `@Transform` over the resulting array, or a
nested mapper via `@MapWith`:

```typescript
// Before (accidental)
@Map('items[0].name')
firstItemName!: string;

// v5
@MapFrom((src: Source) => src.items?.[0]?.name)
firstItemName!: string;
```

## What is NOT supported

For the full, honest list of what each adapter does and does not implement
— unimplemented `ValidatorOptions`, missing decorators, and API gaps versus
upstream `class-validator`/`class-transformer` — see the compatibility
tables rather than relying on this guide to be exhaustive:

- [`./compat-class-validator.md`](./compat-class-validator.md)
- [`./compat-class-transformer.md`](./compat-class-transformer.md)

Neither adapter claims full parity with upstream; they're a drop-in for
the supported subset described in those tables.

## Checklist

- [ ] Bump `om-data-mapper` (or the scoped packages you use) to the v5
      versions.
- [ ] Optionally switch from the meta-package to the scoped
      `@tech-pioneer/data-mapper-*` packages you actually use, for a smaller
      dependency footprint.
- [ ] Audit any code that passes `whitelist: true` (directly, or via
      NestJS `ValidationPipe` defaults) — it now actually strips unknown
      properties.
- [ ] Replace any `@Map()` path that uses bracket indexing
      (`@Map('items[0].name')`) with `@MapFrom`/`@Transform` or a nested
      mapper — it silently yields `undefined` now.
- [ ] Remove any use of the removed class-transformer options
      (`enableCircularCheck`, `exposeUnsetFields`, `targetMaps`,
      `enableValidation`) — they never did anything, so deleting them is
      safe.
- [ ] Run your test suite.
