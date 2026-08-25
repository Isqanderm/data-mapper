---
'@om-data-mapper/class-validator': patch
---

Review fixes: `stopAtFirstError` no longer drops all errors when a validator is named after an `Object.prototype` member; null-prototype inputs return the no-metadata result instead of throwing; constraint metadata no longer grows on every instantiation for `@Matches`/`@Validate`/`@ValidateBy`; `registerDecorator` enforces every registration (second unnamed inline validators and re-registered classes with new constraints are no longer silently dropped); class-based custom validators report errors under their registered name (upstream-compatible) instead of `custom`; validation metadata is keyed via `Symbol.for` so duplicate package copies interoperate.
