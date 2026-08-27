# @tech-pioneer/data-mapper-class-validator

class-validator compatibility adapter for om-data-mapper: JIT-compiled validation engine and
decorators.

This package implements its own JIT validation engine — it is not a wrapper around the upstream
`class-validator` package. Each decorated class is compiled into a validation function the first
time it's used. It ships around 90 validation decorators, has zero runtime dependencies, and
ships dual CJS and ESM builds. It is a **drop-in replacement for the supported subset** of
`class-validator`, not a claim of full parity — see the compatibility table linked below before
migrating.

## Install

```bash
npm install @tech-pioneer/data-mapper-class-validator
```

## Quick start

```ts
import { IsString, MinLength, validate } from '@tech-pioneer/data-mapper-class-validator';

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

## API

Validation entry points: `validate`, `validateSync`, `validateMany`, `validateManySync`,
`validateOrReject`, `validateOrRejectSync`.

Around 90 decorators, e.g. `IsString`, `IsNumber`, `IsEmail`, `IsUUID`, `Min`, `Max`, `MinLength`,
`MaxLength`, `IsIn`, `IsOptional`, `ValidateNested`, `ValidateIf` — see the compatibility table
for the full list.

All 7 implemented `ValidatorOptions` are wired into the engine: `whitelist`,
`forbidNonWhitelisted`, `skipMissingProperties`, `skipNullProperties`, `skipUndefinedProperties`,
`stopAtFirstError`, `forbidUnknownValues`. Note: `forbidUnknownValues` defaults to `false` here,
unlike upstream `class-validator` (>=0.14), which defaults it to `true` — this is a deliberate
divergence, not a bug.

Custom decorators are supported via `registerDecorator` (called from inside a TC39
`addInitializer`, since there is no legacy `reflect-metadata` decorator context to hook into) and
`getMetadataStorage`. See the compatibility table for a full worked example.

## Links

- [Project README](https://github.com/Isqanderm/data-mapper/blob/main/README.md)
- [class-validator compatibility table](https://github.com/Isqanderm/data-mapper/blob/main/docs/compat-class-validator.md)
- [Validation usage guide](https://github.com/Isqanderm/data-mapper/blob/main/docs/validation-usage.md)

## License

MIT
