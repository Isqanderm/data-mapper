---
'@tech-pioneer/data-mapper-class-transformer': major
---

**Breaking:** `classToClass` / `instanceToInstance` now produce a deep clone, and `@Transform` runs once instead of twice.

It was a `classToPlain` → `plainToClass` round trip carrying the `'classToClass'` transformation type through both legs. Neither leg recursed, because each descends only for its own direction, so nested instances and arrays came out shared with the source — mutating the clone mutated the original. `@Transform` ran on both legs, so a `value + 1` transform produced `value + 2`.

It is now a single recursive pass. A nested value's class is taken from the value itself rather than from `@Type`, matching upstream, which clones a nested instance back into its own class whether or not the property carries one. `Date` is cloned rather than walked as a plain object, and `Map` / `Set` keep their type instead of collapsing to `{}`.

Verified against class-transformer 0.5.1 across nested cloning, class preservation, arrays, Dates, `@Transform` call count and result, and the value an excluded property ends up with: no differences.

Two behaviours worth stating because they are easy to mistake for bugs, and both match upstream:

- `@Exclude()` does **not** remove a property in this direction, unlike class→plain.
- The target is built with `new`, and an excluded property is never copied onto it, so it holds whatever its field initializer gives it rather than the source's value.
