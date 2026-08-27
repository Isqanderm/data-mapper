---
'@tech-pioneer/data-mapper-class-validator': minor
---

Add the 21 decorators upstream ships that this package did not: `IsAscii`, `IsBase32`, `IsBase58`, `IsBooleanString`, `IsByteLength`, `IsFirebasePushId`, `IsFullWidth`, `IsHSL`, `IsHalfWidth`, `IsHash`, `IsHexadecimal`, `IsISRC`, `IsISSN`, `IsMilitaryTime`, `IsMultibyte`, `IsNumberString`, `IsOctal`, `IsRgbColor`, `IsSurrogatePair`, `IsTaxId` and `IsVariableWidth`.

Every one reports under the key upstream reports, follows the package's type rules (a value that is not a string fails rather than passing), and supports `each`, `groups`, `always` and a custom message like the rest. Comparing runtime exports, no decorator upstream exports is missing here any more.

Behaviour was measured against class-validator 0.14.4 rather than assumed, which is how these landed the way they did:

- `IsFirebasePushId` reports under `IsFirebasePushId` — capitalised, unlike every other key.
- `IsRgbColor` rejects `rgb(0, 0, 0)`: spaces between components are not allowed.
- `IsByteLength` measures UTF-8 bytes, not characters, so `'é'` counts as two.
- `IsBase58` accepts `abc`; `IsAscii` rejects the empty string; `IsNumberString` rejects exponent notation.
- `IsISSN` verifies the mod-11 check digit, so `0378-5954` fails where `0378-5955` passes.

Two limitations, both marked in the compat table: `IsTaxId` recognises only the `en-US` format (upstream takes a locale), and `IsHash` takes the algorithm name but none of the further options.
