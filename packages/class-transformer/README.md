# @om-data-mapper/class-transformer

class-transformer compatibility adapter for om-data-mapper: Expose/Exclude/Type/Transform
decorators and plainToInstance on TC39 decorator metadata.

This package is a standalone compat adapter for the supported subset of `class-transformer`'s
API — it is not a fork or a wrapper around the upstream package, and it does not depend on
`@om-data-mapper/core`. Metadata is registered once at class definition via TC39 decorators;
transformation walks that metadata at call time — there is no per-call decorator re-evaluation
and no `reflect-metadata` dependency. It has zero runtime dependencies and ships dual CJS and ESM
builds. It is a **drop-in replacement for the supported subset** of `class-transformer`, not a
claim of full parity — see the compatibility table linked below before migrating.

## Install

```bash
npm install @om-data-mapper/class-transformer
```

## Quick start

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

## API

Decorators: `Expose`, `Exclude`, `Type`, `Transform`, `TransformClassToPlain`,
`TransformClassToClass`, `TransformPlainToClass`.

Functions: `plainToClass` / `plainToInstance` (alias), `plainToClassFromExist`, `classToPlain` /
`instanceToPlain` (alias), `classToClass` / `instanceToInstance` (alias), `serialize`,
`deserialize`, `deserializeArray`.

`ClassTransformOptions.enableImplicitConversion` is supported: it coerces a property's value
using an explicit `@Type(() => Number/String/Boolean/Date)`, since there is no
`reflect-metadata`-derived design-time type to infer from under TC39 decorators. Several
`ClassTransformOptions` from upstream are dead in this engine and have been removed rather than
left as silent no-ops: `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`,
`enableValidation`. These can simply be deleted from call sites — no replacement is needed since
none of them had any effect before. See the
[v4 → v5 migration guide](https://github.com/Isqanderm/data-mapper/blob/main/docs/migration-v4-to-v5.md)
for the full list.

## Links

- [Project README](https://github.com/Isqanderm/data-mapper/blob/main/README.md)
- [class-transformer compatibility table](https://github.com/Isqanderm/data-mapper/blob/main/docs/compat-class-transformer.md)
- [Migrating from class-transformer](https://github.com/Isqanderm/data-mapper/blob/main/docs/migration-class-transformer.md)
- [Transformer usage guide](https://github.com/Isqanderm/data-mapper/blob/main/docs/transformer-usage.md)

## License

MIT
