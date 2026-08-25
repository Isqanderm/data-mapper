---
'@om-data-mapper/core': patch
'om-data-mapper': patch
---

Remove the dead `export * from './core/Mapper'` re-export: the decorator API's `Mapper` already shadowed the legacy class under ES module semantics, so `Mapper.create` was never reachable from the published surface. The ESM post-install simulation now exercises only imports that resolve through the real exports maps.

Documented one behavior change in `docs/migration-v4-to-v5.md`: bracket-index syntax inside a `@Map()` path (`@Map('items[0].name')`) worked by accident in v4 and no longer resolves now that every path segment is emitted as an escaped literal key. Use `@MapFrom`/`@Transform` or a nested mapper for array indexing.
