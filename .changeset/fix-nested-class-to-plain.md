---
'@tech-pioneer/data-mapper-class-transformer': patch
---

`classToPlain` / `instanceToPlain` / `serialize` now descend into nested values, so a nested `@Exclude()` actually runs.

Previously the class->plain direction did not recurse: a nested class instance was copied into the output untouched, carrying every field its own decorators were supposed to remove. A `@Exclude()`d field one level down — the canonical `password` case — reached the serialized output, while the same decorator on a top-level property worked. Nested `@Expose({ name })` renames were dropped for the same reason.

Recursion is not gated on `@Type`: in the class->plain direction the class is known from the value itself, matching class-transformer 0.5.1, which recurses whether or not the property carries a `@Type`. `Date` values are passed through rather than expanded, and plain object literals are copied key-for-key, both verified against upstream.

Note that recursion makes a self-referential object graph throw `RangeError: Maximum call stack size exceeded`, exactly as upstream does without `enableCircularCheck` (an option this package does not implement).
