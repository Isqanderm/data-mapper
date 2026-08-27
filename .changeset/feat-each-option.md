---
'@tech-pioneer/data-mapper-class-validator': minor
---

Implement `ValidationOptions.each`, which was previously accepted nowhere and silently skipped per-element validation.

`@IsString({ each: true })` and every other decorator now apply their constraint to each element of an array or `Set` instead of to the property value. Behaviour follows class-validator 0.14.4: a failing element produces one error for the property (not one per element), the error's `value` is the whole collection, an empty collection passes, and a value that is neither an array nor a `Set` is left unvalidated.

Default messages for an `each` constraint are prefixed — `each value must be at least 5 characters`. Upstream's prefix is `each value in `, which runs on into the property name upstream puts in every message; this package's messages carry no property name, so the prefix stops at `each value`. A message supplied by the caller is used exactly as written, as upstream does.

Constraint deduplication now takes `each` into account, so `@MinLength(5)` and `@MinLength(5, { each: true })` on one property stay two constraints instead of collapsing into one.
