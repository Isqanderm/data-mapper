---
'@tech-pioneer/data-mapper-class-validator': major
---

**Breaking:** a constraint now fails when the value is not of the type it measures.

The generated checks were written as "if the type fits and the value is bad, report an error", so a value of the wrong type fell out of the condition and was reported as valid. `@IsEmail()` passed on the number `5`, `@Min(5)` passed on the string `'a'`, `@ArrayMinSize(2)` passed on `'ab'`, and — most consequentially — every one of them passed on `undefined` and `null`. Upstream's predicates return false for a value they cannot measure, which is an error.

61 of the 84 generated checks changed. Behaviour was compared against class-validator 0.14.4 across 46 decorators and six value shapes each: 321 of 322 comparisons now agree (the remaining difference is an unrelated `@IsBase64` regex that is more permissive than upstream's).

**What this means for existing code.** A decorated property with no value is now an error, exactly as upstream treats it. Code that relied on the old silence needs one of the escape hatches upstream provides for the same situation: `@IsOptional()` on the property, or the `skipUndefinedProperties` / `skipNullProperties` / `skipMissingProperties` validator options. All of them are already implemented here and are covered by tests.

`@IsLatitude` and `@IsLongitude` keep accepting both a number and a numeric string, as upstream does; anything else is now an error.
