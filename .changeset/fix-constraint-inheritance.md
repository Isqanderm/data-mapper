---
'@tech-pioneer/data-mapper-class-validator': patch
---

A subclass now validates the constraints it declares, not just the ones it inherits.

Validation metadata lives on the constructor, and the lookup that created it did not check for an _own_ property. A subclass reaches its parent's metadata through the static prototype chain, so `class Child extends Parent` wrote its constraints into `Parent`'s map — and since compiled validators are cached by `metadata.target`, `Child` was then served `Parent`'s validator. Its own constraints never ran and no error was reported for them.

Whether this happened depended on instantiation order: if the subclass was constructed first it created the map and worked, if the parent was constructed first the subclass silently validated only inherited fields. A base DTO with shared fields — the ordinary NestJS arrangement — hits the broken order.

Each class now gets its own metadata. Nothing is merged from the parent, because TC39 field initializers run for the whole hierarchy when a subclass is constructed, so inherited constraints are already registered against the subclass.
