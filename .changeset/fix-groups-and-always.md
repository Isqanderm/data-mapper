---
'@tech-pioneer/data-mapper-class-validator': major
---

**Breaking:** group filtering now follows class-validator 0.14.4, and `always` works.

The filter was inverted in both directions. A constraint carrying `groups` ran _only_ when the caller passed a matching group, so `validate(dto)` with no options silently skipped it — the opposite of upstream, where no filter means no filtering. And a constraint with no groups ran even under a filter that selected other groups, where upstream skips it.

`always` was declared on every decorator and in `ValidatorOptions`, stored in metadata, and never read by the compiler — so the escape hatch upstream provides for exactly this situation did nothing. It is now honoured, per decorator and as a default for the whole call through `ValidatorOptions.always`.

Measured against upstream (checking which constraint actually ran, since with `forbidUnknownValues` a filtered-away object reports an error of its own that is easy to mistake for the constraint running):

| validate options | constraint in group `g1` | ungrouped | `g1` + always |
| ---------------- | ------------------------ | --------- | ------------- |
| none             | runs                     | runs      | runs          |
| `groups: []`     | runs                     | runs      | runs          |
| `groups: ['g1']` | runs                     | skipped   | runs          |
| `groups: ['x']`  | skipped                  | skipped   | runs          |

`@IsOptional({ groups })` used the same inverted rule and is fixed with it: the property counts as optional when no filter is set or when its group is selected. `optionalAlways` (`@IsOptional({ always: true })`), stored and never read, now works too.

`strictGroups` remains unimplemented and is still marked so in the compat table.
