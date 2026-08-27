---
'@tech-pioneer/data-mapper-class-validator': minor
---

Export `IsUrl`, and reject base64 strings whose length is not a multiple of four.

`IsUrl` is how class-validator spells it, and the implementation was already here — only the name was missing, so `import { IsUrl }` failed for anyone migrating. Both spellings now resolve to the same decorator, and the error key was already `isUrl`.

`@IsBase64` accepted `'zz'` and `'abc'`. Its pattern allowed a trailing group of two or three characters with no padding, so any length was permitted. Upstream (validator.js, padding on by default) requires a multiple of four. Verified against upstream across twelve inputs, including the padded, unpadded and malformed forms: no differences remain.

One existing test asserted that `'SGVsbG8gV29ybGQ'` — fifteen characters — is valid base64. Upstream rejects it by default and accepts it only under `IsBase64Options.padding: false`, an option this package does not accept; the test now asserts the rejection.
