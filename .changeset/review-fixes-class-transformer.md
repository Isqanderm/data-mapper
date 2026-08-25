---
'@om-data-mapper/class-transformer': patch
---

`enableImplicitConversion` now coerces array-valued `@Type(() => Number|String|Boolean|Date)` properties per element (previously the whole array was passed to the constructor, yielding `NaN`/joined strings).
