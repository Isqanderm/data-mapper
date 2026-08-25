# om-data-mapper Examples

This directory is a private workspace package (`examples`) that contains practical,
**type-checked** examples of om-data-mapper's mapping and validation APIs. Every example
imports the published package names (`om-data-mapper`, `@om-data-mapper/class-validator`)
against the built workspace packages, so it reflects the real, current API.

## 📁 Directory Structure

### 01-basic/

Basic examples for getting started with om-data-mapper.

- **simple-mapping/** - Simple property mapping
  - Direct field mapping
  - Basic transformations
- **nested-mapping/** - Working with nested objects
  - Deep property access
  - Nested object transformations
- **array-mapping/** - Mapping from multiple related inputs
  - Combining two source objects (an employee and a job catalog) via a tuple source

### 02-advanced/

Advanced examples showcasing powerful features.

- **complex-transformations/** - Nested mapper composition with `@MapWith`
- **error-handling/** - Error handling patterns
  - Validation
  - Unsafe mode (`@Mapper({ unsafe: true })`) so a throwing transformer propagates
- **composition/** - Nested mappers and reusable mapping configurations
  - A standalone `AddressMapper` composed into the outer mapper via `@MapWith`
  - Combining `@MapWith` composition with `@MapFrom` (e.g. array flattening)

There is also `ergonomic-api.ts` (a tour of the decorator + helper-function API) and
`validation-complete-example.ts` (a complete `@om-data-mapper/class-validator` walkthrough:
nested validation, validation groups, and sync/async custom validators).

## 🚀 Setup

From the repo root:

```bash
pnpm install
pnpm -r build          # build the workspace packages these examples import
```

## ✅ Type-checking (verified)

This is the workflow this package provides, verified locally with:

```bash
pnpm --filter examples run typecheck
```

This runs `tsc --noEmit` against every `*.ts` file in this directory using the built
`@om-data-mapper/core` / `@om-data-mapper/class-validator` / `om-data-mapper` type
declarations, so it fails if an example ever drifts from the real API.

## ▶️ Running an example

This package has no `tsx`/`ts-node` dependency, so there is no `pnpm --filter examples
exec tsx <file>` shortcut. To actually execute an example, compile it with `tsc` (matching
this package's `"type": "module"`) and run the emitted JavaScript with Node. Run both
commands from the repo root; `pnpm --filter examples exec` changes into `examples/` before
running `tsc`, so the source path and `--outDir` are given relative to `examples/`, while
`node` is invoked from the repo root against the `examples/`-relative output path so it can
still resolve `examples/node_modules`:

```bash
pnpm --filter examples exec tsc \
  --target ES2022 --module esnext --moduleResolution bundler \
  --useDefineForClassFields --esModuleInterop --skipLibCheck \
  --outDir .tmp-build \
  01-basic/simple-mapping/index.ts

node examples/.tmp-build/index.js
```

Swap in whichever example file you want to run (the `--outDir`/`node` path must match the
file you compiled). Delete `examples/.tmp-build/` afterwards — it's a scratch directory, not
checked in. Every example file was compiled and run this way while writing this package.

## 🔗 Related Documentation

- [API Documentation](../docs/README.md)
- [How to run the benchmark suite](../benchmarks/README.md)
- [Contributing Guide](../CONTRIBUTING.md)
