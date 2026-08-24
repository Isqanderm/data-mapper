# om-data-mapper v5 — Monorepo Split & Revival Design

**Date:** 2026-08-24
**Status:** Approved

## Goal

Revive the project to a state where it can be honestly promoted:
split the monolith into a core mapper package plus adapter packages,
fix the credibility-critical defects (silently dead `ValidatorOptions`,
invalid benchmarks, self-contradicting README), and re-establish an
active release pipeline.

## Background (audit findings, 2026-08-24)

Healthy: 518 passing tests (~95% coverage incl. property-based and
memory-leak tests), clean build (CJS+ESM), clean lint, 0 prod
vulnerabilities, coherent JIT architecture (Symbol metadata → codegen →
`new Function` → cache), substantive bilingual docs (~8.2k lines).

Broken:

1. **class-validator compat fails silently.** `whitelist`,
   `forbidNonWhitelisted`, `skipMissingProperties`,
   `skipNullProperties`, `skipUndefinedProperties`, `stopAtFirstError`,
   `forbidUnknownValues` are declared in `types.ts` but implemented
   nowhere — only `groups` is wired into the compiler. NestJS
   `ValidationPipe` defaults hit exactly these options. Also missing:
   function-form `message`, `registerDecorator`, `getMetadataStorage`,
   `ValidationError.target/value`, ~20 decorators.
2. **Flagship validation benchmark measures a no-op**
   (`benchmarks/comparisons/validation-comparison/` feeds
   class-validator-decorated classes to om's engine, which finds no
   metadata and returns `[]`). `RESULTS.md` contains "(estimated)"
   fabricated rows. Headline "20,000–60,000% faster" is invalid.
3. **Benchmarks are not reproducible**: `bench`, `bench:core`,
   `bench:compat`, `bench:compat:build` all reference non-existent
   paths; `benchmark.yml` masks failures with `|| echo`.
4. **README (1,431 lines) self-contradicts**: "17.28x average" vs table
   averaging 20.2x; "vs Vanilla" table shows vanilla winning but is
   labelled as an om advantage; "98% coverage" vs configured 70–80%
   thresholds; class-validator (largest module) never mentioned; broken
   link to `docs/COVERAGE_PROTECTION.md`; CHANGELOG stale at 4.1.0.
5. **Root-level AI-generated cruft** (~1,100 lines):
   `ANNOUNCEMENT_v4.1.0.md`, `RELEASE_NOTES_v4.1.0.md`,
   `INTEGRATION_SUMMARY.md`, `DOCUMENTATION_IMPROVEMENTS.md`; committed
   `.idea/`, `.augment/`, benchmark build artifacts; stale
   `benchmarks/package.json` (v2.0.3).

## Decisions (approved by owner)

| Decision    | Choice                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm naming  | `om-data-mapper` becomes a **meta-package** re-exporting everything; core lives at `@om-data-mapper/core`                                                                     |
| Tooling     | **pnpm workspaces + changesets**; semantic-release removed                                                                                                                    |
| Package set | **4 packages**: core, class-transformer, class-validator (engine included), meta. NestJS adapter deferred                                                                     |
| Order       | **Structure first**, then compat honesty, then benchmarks, then docs, then release                                                                                            |
| Compat gaps | **Implement the key parts** (all 7 ValidatorOptions, message functions, registerDecorator/getMetadataStorage, ValidationError.target/value); honest compat table for the rest |

## Architecture

```
packages/
  core/                @om-data-mapper/core          # src/core + src/decorators
  class-transformer/   @om-data-mapper/class-transformer  # depends on core
  class-validator/     @om-data-mapper/class-validator    # own validation engine
  om-data-mapper/      om-data-mapper                # meta: re-exports all three
```

- Meta-package keeps the v4 subpath exports
  (`om-data-mapper/class-transformer-compat`,
  `om-data-mapper/class-validator-compat`) as aliases — existing user
  code keeps working.
- Versions: meta ships **5.0.0**; scoped packages start at **1.0.0**;
  independent versioning via changesets.
- Build: per-package `tsc` dual build (CJS + ESM + fix-esm-imports
  script). No bundler introduced.
- Tests: vitest workspace; existing suites move into their packages;
  `test/*.mjs` ESM smoke tests move into the packages they exercise.
  The confusing `test/` vs `tests/` split disappears.
- CI: rewrite `ci.yml` from scratch (pnpm, build, lint, test matrix
  Node 20/22/24, Codecov with default PR comments — the 520-line inline
  coverage script is deleted). `release.yml` → changesets action.
  CodeQL unchanged. `benchmark.yml` fixed and un-masked.

## Phases

- **Phase 0 — cleanup:** delete the 4 root cruft files, `.idea/`,
  `.augment/`, committed `build-*` artifacts, legacy
  `benchmarks/package.json`.
- **Phase 1 — monorepo:** move code without behavior change; all 518
  tests green in the new structure; no publish. Register the
  `@om-data-mapper` npm scope/org first.
- **Phase 2 — compat honesty:** implement the 7 ValidatorOptions in the
  compiler, function-form `message`, `registerDecorator` +
  `getMetadataStorage`, `ValidationError.target/value`. In
  class-transformer: implement `enableImplicitConversion`; remove the
  remaining dead options from the types. Compat tables in docs. TDD.
- **Phase 3 — benchmarks:** rewrite the validation comparison to use
  om's own decorators; delete fabricated `RESULTS.md`; repair the 4
  broken npm scripts; un-mask CI failures. Goal: one reproducible
  `pnpm bench` with honest numbers.
- **Phase 4 — docs:** per-package READMEs; root README ~300 lines with
  consistent numbers and a class-validator section; troubleshooting
  moved to `docs/`; v4→v5 migration guide; sync `docs-ru/`.
- **Phase 5 — release & revival:** publish all 4 packages; merge
  dependabot PRs; decide PR #21 (candidate for a future
  `@om-data-mapper/nestjs`); then promotion.

## Risks

- **Test migration (Phase 1)** is the riskiest move: control = total
  test count before/after must match (518) and coverage must not drop.
- **Behavior change in Phase 2** (`whitelist` starts actually
  stripping fields) may break users who relied on the no-op — recorded
  in the changelog as a bugfix shipped under a major (5.0.0).
- **npm scope** `@om-data-mapper` must be registered before Phase 1
  completes; verify availability early.
