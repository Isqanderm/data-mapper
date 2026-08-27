---
'@tech-pioneer/data-mapper-class-validator': major
---

**Breaking:** default messages now name the property they are about.

`@MinLength(3)` on `username` produced `must be at least 3 characters`. Anything showing `error.constraints` to a person — a form, an API response, a log line — had to pair the sentence back up with `error.property` by hand to say which field it meant. Upstream writes `username must be longer than or equal to 3 characters`; messages now carry the same subject: `username must be at least 3 characters`.

Under `each` the property follows upstream's prefix: `each value in tags must be at least 5 characters` (it previously stopped at `each value`, because there was no property name for the preposition to lead into).

A message supplied by the caller — string or function — is untouched.

Five defaults opened with their own noun and would have read as `lat latitude must be…` once prefixed, so they were reworded:

| decorator      | before                                            | now                                     |
| -------------- | ------------------------------------------------- | --------------------------------------- |
| `@IsLatitude`  | `latitude must be a number between -90 and 90`    | `must be a number between -90 and 90`   |
| `@IsLongitude` | `longitude must be a number between -180 and 180` | `must be a number between -180 and 180` |
| `@ArrayUnique` | `all elements must be unique`                     | `must contain only unique values`       |
| `@MinDate`     | `minimal allowed date is …`                       | `must not be before …`                  |
| `@MaxDate`     | `maximal allowed date is …`                       | `must not be after …`                   |

The wording of the sentences still differs from upstream's in most cases — only the subject is matched. Three of the six messages compared came out identical to upstream anyway (`must be an email`, `should not be empty`, `must contain at least N elements`).
