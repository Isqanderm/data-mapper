---
'@om-data-mapper/class-validator': minor
---

Implement previously-dead `ValidatorOptions` (`whitelist`, `forbidNonWhitelisted`, `skipMissingProperties`, `skipNullProperties`, `skipUndefinedProperties`, `stopAtFirstError`, `forbidUnknownValues`), function-form `message`, `ValidationError.target`/`.value` stripping, `registerDecorator`, and `getMetadataStorage`.

Behavior change: `whitelist` now actually strips unknown properties from the validated object (was a silent no-op in v4).

Note: `forbidUnknownValues` defaults to `false` here, diverging from upstream `class-validator@0.14`, which defaults to `true`. See `docs/compat-class-validator.md`.
