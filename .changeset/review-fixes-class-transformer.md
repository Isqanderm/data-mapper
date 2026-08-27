---
'@tech-pioneer/data-mapper-class-transformer': patch
---

`enableImplicitConversion` now coerces array-valued `@Type(() => Number|String|Boolean|Date)` properties per element (previously the whole array was passed to the constructor, yielding `NaN`/joined strings).

`@TransformClassToPlain`, `@TransformClassToClass`, and `@TransformPlainToClass` now use static imports instead of a runtime `require('./functions')`, which threw `ReferenceError: require is not defined` for ESM consumers.
