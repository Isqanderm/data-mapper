---
'@tech-pioneer/data-mapper-class-validator': major
---

**Breaking:** error keys and the `validateOrReject` rejection value now match class-validator 0.14.4.

Consumers read `error.constraints.isUrl` and `catch (errors) { errors.map(…) }`. Both were spelled differently here, so code migrated from upstream read `undefined` and carried on — the failure surfaced later, somewhere else.

Fourteen of 48 measured decorators reported a key upstream does not use. Ten were acronym casing: `isURL` → `isUrl`, `isUUID` → `isUuid`, `isJSON` → `isJson`, `isIP` → `isIp`, `isFQDN` → `isFqdn`, `isISO8601` → `isIso8601`, `isJWT` → `isJwt`, `isMACAddress` → `isMacAddress`, `isISIN` → `isIsin`, `isISBN` → `isIsbn`.

Four reported another constraint's key entirely:

- `@Length` emitted a `minLength` and a `maxLength` constraint. It is now one `isLength` constraint, reported under that key, and `max` is optional as upstream has it.
- `@IsDateString` delegated to `@IsISO8601` and inherited its key. It now reports `isDateString`.
- `@IsPositive` was implemented as `min: 0.000001` and reported `min`; `@IsNegative` as `max: -0.000001` reporting `max`. Both now test the sign directly and report `isPositive` / `isNegative`. This also fixes the range: `5e-7` is a positive number and was being rejected.

`validateOrReject` now rejects with the `ValidationError[]` itself instead of a `ValidationFailedError` wrapper, so the upstream idiom works. `validateOrRejectSync` — not an upstream API — throws the array too, so the two do not disagree. The `ValidationFailedError` class is still exported but no longer thrown by either.

All 48 decorators measured against upstream now report identical keys.
