# Phase 3 — Honest Benchmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One reproducible `pnpm bench` with honest numbers: delete the fabricated results and dead benchmark code, rebuild benchmarks as a private workspace package on `vitest bench`, and un-mask the CI benchmark workflow.

**Architecture:** `benchmarks/` becomes a private pnpm workspace package depending on the built `@om-data-mapper/*` packages plus the real upstream `class-validator`/`class-transformer` as comparison baselines. Every comparison file carries an **honesty guard**: before any measurement, it asserts that both engines produce the expected results on the scenario data (errors found on invalid input, deep-equal outputs on transform) and throws otherwise — the exact failure mode of the v4 no-op benchmark can never silently return. Upstream libraries' legacy decorators are applied **programmatically** (`IsString()(Dto.prototype, 'name')`) so no `experimentalDecorators` tsconfig juggling is needed alongside our TC39 code.

**Tech Stack:** vitest `bench` mode (tinybench under the hood), pnpm workspaces, TC39 decorators for om code, programmatic legacy-decorator application for upstream baselines.

**Spec:** `docs/superpowers/specs/2026-08-24-monorepo-v5-design.md` (Phase 3 section: "rewrite the validation comparison to use om's own decorators; delete fabricated `RESULTS.md`; repair the 4 broken npm scripts; un-mask CI failures. Goal: one reproducible `pnpm bench` with honest numbers.")

## Global Constraints

- Run everything from repo root `/Users/alexandermelnik/tech-pioneer/data-mapper/.claude/worktrees/monorepo-v5` (git worktree — do not cd out).
- Baseline that must not regress: `pnpm test` → 38 files / 549 tests; `pnpm -r build` clean; `pnpm -w exec eslint .` clean; `pnpm exec prettier --check .` clean.
- Benchmarks are dev-only: **no changeset** (nothing published changes).
- Bench files import the **built workspace packages** (`@om-data-mapper/core`, `@om-data-mapper/class-validator`, `@om-data-mapper/class-transformer`) — never `../../packages/*/src`. `pnpm -r build` must run before benching; the root `bench` script enforces the order.
- Honesty guard rule (non-negotiable, applies to every comparison bench file): before `describe`/`bench` registration, run assertions that each measured engine actually does the work on the scenario data (validation: valid input → 0 errors, invalid input → ≥1 error, from BOTH engines; transformation: om output deep-equals upstream output and the expected literal). Throw `new Error('honesty guard: ...')` on violation. A benchmark that measures a no-op must be impossible.
- Upstream legacy decorators are applied programmatically, never via decorator syntax: `IsString({ ... })(CvDto.prototype, 'name')` for class-validator, `Expose()(CtDto.prototype, 'name')` / `Type(() => X)(CtDto.prototype, 'child')` for class-transformer. `import 'reflect-metadata';` first in every upstream-models file.
- om models use normal TC39 decorator syntax (repo default; `useDefineForClassFields: true`, no `experimentalDecorators`).
- Numbers in docs: benchmarks README must NOT contain performance claims or result tables. It explains how to run and how to read the output. (Honest published numbers come later, generated from real runs — Phase 4 wiring.)
- Formatting is a CI gate: `pnpm exec prettier --write <changed files>` before every commit. Commit style: `feat:`/`fix:`/`chore:`/`docs:` per repo history.
- Test commands: full suite `pnpm -w test`; bench (after Task 2) `pnpm bench`, `pnpm bench:core`, `pnpm bench:compat`.

---

### Task 1: Purge dead benchmark artifacts and dead dev-dependencies

**Files:**

- Delete: `benchmarks/comparisons/` (entire dir: fabricated `validation-comparison/RESULTS.md`, the no-op `validation-comparison.bench.ts`, `class-transformer-comparison/`, `library-comparison/` with its uninstalled deps `@cookbook/mapper-js`, `automapper-ts`, `object-mapper`, `morphism`)
- Delete: `benchmarks/suites/` (entire dir: stale prebuilt-JS pipeline requiring non-existent `build/compat/...` paths)
- Delete: `benchmarks/class-validator-comparison.ts`, `benchmarks/benckmarks.png` (typo'd stale image), `benchmarks/README.md` (rewritten in Task 5), `benchmarks/tsconfig.json` (replaced in Task 2), `benchmarks/core/shared-mappers.ts` (imports non-existent `../../src/decorators`; zero importers — verify with `grep -rn 'shared-mappers' benchmarks` before deleting)
- Keep (Task 2 fixes them in place): `benchmarks/core/*.bench.ts`, `benchmarks/core/README.md`
- Modify: `package.json` (root) — remove dev-deps `@types/benchmark`, `chalk`, `ts-node` (all referenced only by the deleted files; verify each with `grep -rn '<name>' packages scripts examples docs --include='*' | grep -v node_modules` before removing; if a hit outside deleted files exists, keep that dep and note it in the report)

**Interfaces:**

- Consumes: nothing.
- Produces: a `benchmarks/` dir containing only `core/*.bench.ts` + `core/README.md`; root devDependencies without the dead entries; lockfile updated via `pnpm install`.

- [ ] **Step 1: Verify the deletions are safe**

Run and record output:

```bash
grep -rn 'shared-mappers' benchmarks
grep -rln 'benckmarks.png\|comparisons/\|suites/compat' README.md docs docs-ru packages examples | grep -v node_modules
grep -rn '@types/benchmark\|"chalk"\|"ts-node"\|require(.chalk.)\|from .chalk.' packages scripts examples eslint.config.mjs tsconfig.json --include='*' -l 2>/dev/null | grep -v node_modules
```

Expected: no importers of shared-mappers; references to deleted paths exist only inside `benchmarks/` itself or in `README.md`/docs (README/docs links are Phase 4 scope — list them in the report, do not fix them here); no live users of the three dev-deps. If `README.md` links `benchmarks/comparisons/...`, note it — Task 5's benchmarks README replaces the target.

- [ ] **Step 2: Delete the artifacts**

```bash
git rm -r benchmarks/comparisons benchmarks/suites
git rm benchmarks/class-validator-comparison.ts benchmarks/benckmarks.png benchmarks/README.md benchmarks/tsconfig.json benchmarks/core/shared-mappers.ts
```

- [ ] **Step 3: Remove dead dev-deps and refresh lockfile**

Edit root `package.json`: drop `@types/benchmark`, `chalk`, `ts-node` from devDependencies (subject to Step 1 verification). Then:

```bash
pnpm install
```

Expected: lockfile updates cleanly.

- [ ] **Step 4: Verify nothing broke**

```bash
pnpm -r build && pnpm -w test && pnpm -w exec eslint .
```

Expected: build clean, 549/549 tests, lint clean (deleting the old files may FIX pre-existing lint ignores; if eslint now errors on something unrelated, report it).

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write package.json
git add -A && git commit -m "chore(benchmarks): delete fabricated results, no-op comparison and dead benchmark pipeline"
```

---

### Task 2: Scaffold the `benchmarks` workspace package; migrate core benches

**Files:**

- Create: `benchmarks/package.json`, `benchmarks/tsconfig.json`, `benchmarks/vitest.config.mts`
- Modify: `pnpm-workspace.yaml` (add `benchmarks`), root `package.json` (add `bench`, `bench:core`, `bench:compat` scripts)
- Modify: `benchmarks/core/simple.bench.ts`, `complex.bench.ts`, `nested.bench.ts`, `array.bench.ts` (fix imports, add guards)
- Keep: `benchmarks/core/README.md` (update its run commands only)

**Interfaces:**

- Consumes: `@om-data-mapper/core` built package. NOTE: the root export of `@om-data-mapper/core` re-exports BOTH a legacy `Mapper` class (`Mapper.create({...})`, from `core/Mapper`) and a decorator named `Mapper` (from `./decorators`) — the explicit named export from `./decorators` wins for the name `Mapper`. Before writing bench code, check `packages/core/src/index.ts:180-210` and determine the correct import for the legacy config-object API (it may need `createMapper`/decorator API instead). Whichever API you use, the honesty guard proves it maps.
- Produces: `pnpm bench` (root) = build all packages then run every `*.bench.ts` under `benchmarks/`; `pnpm bench:core` / `pnpm bench:compat` filter by directory. Bench file convention: `benchmarks/<area>/<name>.bench.ts`, guards at module top level.

- [ ] **Step 1: Scaffold the package**

`benchmarks/package.json`:

```json
{
  "name": "benchmarks",
  "private": true,
  "version": "0.0.0",
  "description": "om-data-mapper benchmark suite (not published)",
  "scripts": {
    "bench": "vitest bench --run",
    "bench:core": "vitest bench --run core",
    "bench:compat": "vitest bench --run compat"
  },
  "devDependencies": {
    "@om-data-mapper/core": "workspace:*",
    "@om-data-mapper/class-transformer": "workspace:*",
    "@om-data-mapper/class-validator": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "reflect-metadata": "^0.2.2",
    "vitest": "^3.2.4"
  }
}
```

`benchmarks/tsconfig.json` (mirror a package tsconfig — copy `packages/core/tsconfig.json` and adjust): TC39 decorators (`"experimentalDecorators": false` or absent, `"useDefineForClassFields": true`), `"noEmit": true`, include `**/*.bench.ts` and model files.

`benchmarks/vitest.config.mts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    benchmark: {
      include: ['**/*.bench.ts'],
    },
  },
});
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'benchmarks'
```

Root `package.json` scripts (after `"test:esm"`):

```json
"bench": "pnpm -r --filter './packages/*' run build && pnpm --filter benchmarks run bench",
"bench:core": "pnpm -r --filter './packages/*' run build && pnpm --filter benchmarks run bench:core",
"bench:compat": "pnpm -r --filter './packages/*' run build && pnpm --filter benchmarks run bench:compat",
```

Then `pnpm install` (links workspace deps, adds class-transformer upstream).

Check that root `vitest.config.mts` (`projects: ['packages/*']`) does NOT pick up the benchmarks package during `pnpm test` — it must not, since the glob only covers `packages/*`. Confirm `pnpm -w test` count stays 549.

- [ ] **Step 2: Migrate the four core bench files**

For each of `simple|complex|nested|array.bench.ts`: replace the broken `import { Mapper } from '../../../src/core/Mapper'` with the correct import from `@om-data-mapper/core` (per the Interfaces note — verify which name resolves to the config-object `Mapper.create` API; adjust call sites if the API surface differs). Keep the existing scenarios and vanilla baselines. Add the honesty guard at module top, e.g. for simple.bench.ts:

```typescript
const omResult = mapper.execute(sourceData);
const vanillaResult = vanillaMapper(sourceData);
if (JSON.stringify(omResult) !== JSON.stringify(vanillaResult)) {
  throw new Error(
    `honesty guard: om mapping output differs from vanilla baseline: ${JSON.stringify(omResult)} vs ${JSON.stringify(vanillaResult)}`,
  );
}
```

(Adapt per file — for arrays compare the mapped array, for nested compare the nested structure. If `mapper.execute` returns extra fields like `undefined`-valued keys, compare field-by-field on the expected keys and say so in a comment.)

Update `benchmarks/core/README.md` run commands to `pnpm bench:core` (from repo root).

- [ ] **Step 3: Run and verify**

```bash
pnpm bench:core
```

Expected: vitest bench executes 4 files, prints ops/sec tables, exit code 0. Sanity: om vs vanilla numbers must be within plausible range (vanilla hand-written is allowed to win — that is the honest outcome; no assertions on speed, only on correctness).

- [ ] **Step 4: Full-suite check**

```bash
pnpm -w test && pnpm -w exec eslint . && pnpm exec prettier --check .
```

Expected: 549/549, lint may need `benchmarks/` glob adjustments in `eslint.config.mjs` — if eslint errors on bench files for TS project-service reasons, add the benchmarks tsconfig to the eslint config the same way packages are configured (report what you did).

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write benchmarks pnpm-workspace.yaml package.json
git add -A && git commit -m "feat(benchmarks): rebuild as workspace package on vitest bench; fix core benches"
```

---

### Task 3: Honest validation comparison (om decorators vs real class-validator)

**Files:**

- Create: `benchmarks/compat/models-validation-om.ts`, `benchmarks/compat/models-validation-cv.ts`, `benchmarks/compat/validation.bench.ts`

**Interfaces:**

- Consumes: `@om-data-mapper/class-validator` exports `IsString, MinLength, MaxLength, IsInt, Min, Max, IsOptional, IsEmail, ValidateNested, validateSync` (verify each against `packages/class-validator/src/index.ts` / decorators before use — swap any missing one for a supported equivalent from the compat table `docs/compat-class-validator.md`); upstream `class-validator` same-named decorators applied programmatically.
- Produces: three benchmark groups (simple/optional/nested), each measuring `omValidateSync(omInstance)` vs `cvValidateSync(cvInstance)` on valid AND invalid data; shared plain-object fixtures exported from the bench file are NOT needed by other tasks.

- [ ] **Step 1: Write the om models** (`models-validation-om.ts`)

```typescript
/**
 * om-data-mapper validation models — TC39 decorators (om's own API).
 * Mirrors models-validation-cv.ts field-for-field; keep both in sync.
 */
import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsEmail,
} from '@om-data-mapper/class-validator';

export class OmSimpleUser {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;
}

export class OmOptionalUser {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  nickname?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;
}
```

Add a nested pair only if `ValidateNested` + a nested class works under om (check `packages/class-validator/src/decorators/nested.ts` and the compat table); if unsupported for this shape, skip the nested scenario and record that in the bench file comment + report.

- [ ] **Step 2: Write the upstream models** (`models-validation-cv.ts`)

```typescript
/**
 * Upstream class-validator models — legacy decorators applied
 * PROGRAMMATICALLY (no experimentalDecorators needed in this repo).
 * Mirrors models-validation-om.ts field-for-field; keep both in sync.
 */
import 'reflect-metadata';
import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CvSimpleUser {
  firstName!: string;
  lastName!: string;
  email!: string;
  age!: number;
}
for (const name of ['firstName', 'lastName'] as const) {
  IsString()(CvSimpleUser.prototype, name);
  MinLength(2)(CvSimpleUser.prototype, name);
  MaxLength(50)(CvSimpleUser.prototype, name);
}
IsEmail()(CvSimpleUser.prototype, 'email');
IsInt()(CvSimpleUser.prototype, 'age');
Min(0)(CvSimpleUser.prototype, 'age');
Max(150)(CvSimpleUser.prototype, 'age');

export class CvOptionalUser {
  name!: string;
  nickname?: string;
  score?: number;
}
IsString()(CvOptionalUser.prototype, 'name');
MinLength(2)(CvOptionalUser.prototype, 'name');
IsOptional()(CvOptionalUser.prototype, 'nickname');
IsString()(CvOptionalUser.prototype, 'nickname');
MinLength(5)(CvOptionalUser.prototype, 'nickname');
IsOptional()(CvOptionalUser.prototype, 'score');
IsInt()(CvOptionalUser.prototype, 'score');
Min(0)(CvOptionalUser.prototype, 'score');
```

(Mirror whatever nested pair Step 1 settled on.)

- [ ] **Step 3: Write the bench with honesty guards** (`validation.bench.ts`)

```typescript
import { bench, describe } from 'vitest';
import { validateSync as omValidateSync } from '@om-data-mapper/class-validator';
import { validateSync as cvValidateSync } from 'class-validator';
import { OmSimpleUser, OmOptionalUser } from './models-validation-om';
import { CvSimpleUser, CvOptionalUser } from './models-validation-cv';

const validSimple = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', age: 30 };
const invalidSimple = { firstName: 'J', lastName: '', email: 'not-an-email', age: -5 };

function makeOm<T>(cls: new () => T, data: object): T {
  return Object.assign(new cls(), data);
}
function makeCv<T>(cls: new () => T, data: object): T {
  return Object.assign(new cls(), data);
}

// ---- honesty guards: both engines must actually validate these shapes ----
function guard(name: string, omErrors: unknown[], cvErrors: unknown[], expectErrors: boolean) {
  if (expectErrors && (omErrors.length === 0 || cvErrors.length === 0)) {
    throw new Error(
      `honesty guard [${name}]: expected BOTH engines to report errors on invalid data ` +
        `(om=${omErrors.length}, cv=${cvErrors.length}) — a zero here means a no-op benchmark`,
    );
  }
  if (!expectErrors && (omErrors.length !== 0 || cvErrors.length !== 0)) {
    throw new Error(
      `honesty guard [${name}]: expected NO errors on valid data (om=${omErrors.length}, cv=${cvErrors.length})`,
    );
  }
}

guard(
  'simple/valid',
  omValidateSync(makeOm(OmSimpleUser, validSimple)),
  cvValidateSync(makeCv(CvSimpleUser, validSimple) as object),
  false,
);
guard(
  'simple/invalid',
  omValidateSync(makeOm(OmSimpleUser, invalidSimple)),
  cvValidateSync(makeCv(CvSimpleUser, invalidSimple) as object),
  true,
);
// (repeat guards for the optional scenario with its own valid/invalid fixtures,
//  and for nested if implemented)

// ---- benchmarks: instances pre-created outside the measured loop ----
const omSimpleValid = makeOm(OmSimpleUser, validSimple);
const cvSimpleValid = makeCv(CvSimpleUser, validSimple);
const omSimpleInvalid = makeOm(OmSimpleUser, invalidSimple);
const cvSimpleInvalid = makeCv(CvSimpleUser, invalidSimple);

describe('validation: simple object (valid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omSimpleValid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvSimpleValid as object);
  });
});

describe('validation: simple object (invalid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omSimpleInvalid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvSimpleInvalid as object);
  });
});
// (optional + nested groups follow the same pattern)
```

Fixture caveat: om metadata attaches on first instantiation (TC39 addInitializer) — the guard section already instantiates every om class before any measurement, which also pre-warms the JIT cache; state this in a comment (it is the fair comparison: both libraries get warmed metadata).

Note on error-shape: om invalid fixture must trip decorators that BOTH engines implement identically (the compat table is the source of truth); if om reports a different error COUNT than cv for the same fixture, that is fine (different constraint granularity) — the guard checks only ≥1, but add a comment logging both counts.

- [ ] **Step 4: Run**

```bash
pnpm bench:compat
```

Expected: validation groups run, both engines show non-trivial ops/sec (if either engine shows implausible >50M ops/sec on the invalid path, suspect a no-op and re-check the guards — guards should have caught it; investigate before committing).

- [ ] **Step 5: Full-suite check and commit**

```bash
pnpm -w test && pnpm exec prettier --write benchmarks
git add -A && git commit -m "feat(benchmarks): honest validation comparison using om's own decorators"
```

---

### Task 4: Honest transformation comparison (om compat vs real class-transformer)

**Files:**

- Create: `benchmarks/compat/models-transform-om.ts`, `benchmarks/compat/models-transform-ct.ts`, `benchmarks/compat/transformation.bench.ts`

**Interfaces:**

- Consumes: `@om-data-mapper/class-transformer` exports `plainToInstance, instanceToPlain, Expose, Exclude, Type, Transform` (verify against `packages/class-transformer/src/index.ts`); upstream `class-transformer@0.5.x` same-named APIs, decorators applied programmatically.
- Produces: two benchmark groups: `plainToInstance` (flat DTO with rename via `@Expose({ name })`, and nested with `@Type`) and `instanceToPlain` (with one `@Exclude`d field). Honesty guard: om output and upstream output deep-equal each other AND a hand-written expected literal.

- [ ] **Step 1: Write om models** (`models-transform-om.ts`) — TC39 syntax:

```typescript
import { Expose, Exclude, Type } from '@om-data-mapper/class-transformer';

export class OmAddress {
  @Expose()
  city!: string;
  @Expose()
  street!: string;
}

export class OmUser {
  @Expose({ name: 'user_id' })
  id!: number;
  @Expose()
  name!: string;
  @Expose()
  @Type(() => OmAddress)
  address!: OmAddress;
  @Exclude()
  password!: string;
}
```

- [ ] **Step 2: Write upstream models** (`models-transform-ct.ts`) — programmatic application:

```typescript
import 'reflect-metadata';
import { Expose, Exclude, Type } from 'class-transformer';

export class CtAddress {
  city!: string;
  street!: string;
}
Expose()(CtAddress.prototype, 'city');
Expose()(CtAddress.prototype, 'street');

export class CtUser {
  id!: number;
  name!: string;
  address!: CtAddress;
  password!: string;
}
Expose({ name: 'user_id' })(CtUser.prototype, 'id');
Expose()(CtUser.prototype, 'name');
Expose()(CtUser.prototype, 'address');
Type(() => CtAddress)(CtUser.prototype, 'address');
Exclude()(CtUser.prototype, 'password');
```

- [ ] **Step 3: Write the bench with honesty guards** (`transformation.bench.ts`)

Structure identical to Task 3: plain fixture `{ user_id: 1, name: 'John', address: { city: 'NYC', street: 'Main St' }, password: 'hunter2' }`; guards assert (a) om `plainToInstance(OmUser, fixture)` yields `instanceof OmUser` with `id === 1` and `address instanceof OmAddress`, (b) upstream ditto with its classes, (c) `instanceToPlain` of the om instance deep-equals `instanceToPlain` of the ct instance on the compared keys AND neither contains `password`. Deep-equal via `JSON.stringify` with sorted keys or field-by-field; on mismatch throw `honesty guard` error printing both outputs. IMPORTANT compat caveat to verify while writing guards: om and upstream may differ on `excludeExtraneousValues` defaults — pass explicit equivalent options to both if needed for an apples-to-apples scenario, and document the chosen options in a comment. Then `describe`/`bench` groups measuring `plainToInstance` and `instanceToPlain` for both libraries on pre-created data.

- [ ] **Step 4: Run**

```bash
pnpm bench:compat
```

Expected: both validation and transformation files run green with plausible numbers.

- [ ] **Step 5: Full-suite check and commit**

```bash
pnpm -w test && pnpm exec prettier --write benchmarks
git add -A && git commit -m "feat(benchmarks): honest transformation comparison vs class-transformer"
```

---

### Task 5: Honest benchmarks README + un-masked CI workflow + final verification

**Files:**

- Create: `benchmarks/README.md` (rewrite)
- Modify: `.github/workflows/benchmark.yml` (replace placeholder), `benchmarks/core/README.md` (only if Task 2 left stale commands)

**Interfaces:**

- Consumes: the `pnpm bench` / `bench:core` / `bench:compat` scripts from Task 2.
- Produces: a workflow that runs the full bench suite and FAILS the job on any failure (no `|| echo`, no `continue-on-error`), and a README with zero performance claims.

- [ ] **Step 1: Write `benchmarks/README.md`**

Content requirements (write it, don't copy the old one):

- What lives here: `core/` (om mapping vs hand-written vanilla baseline), `compat/` (om compat layers vs the real `class-validator` / `class-transformer`).
- How to run: `pnpm bench`, `pnpm bench:core`, `pnpm bench:compat` from repo root (they build the packages first); how to run one file (`pnpm --filter benchmarks exec vitest bench --run compat/validation.bench.ts`).
- The honesty-guard contract, verbatim explanation: every comparison file asserts both engines do real work on the scenario data before anything is measured, and throws otherwise; a paragraph naming the v4 failure (benchmark measured an engine that returned `[]` on foreign metadata; published numbers were fabricated) and stating that results are only ever produced by running the suite — this README intentionally contains **no numbers**.
- Fairness notes: metadata pre-warmed for both libraries; upstream decorators applied programmatically (same semantics, no build-step asymmetry); vanilla baselines are hand-written per scenario and expected to win some benchmarks.

- [ ] **Step 2: Rewrite `.github/workflows/benchmark.yml`**

```yaml
name: Benchmarks

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'benchmarks/**'
      - 'packages/**'
      - '.github/workflows/benchmark.yml'

jobs:
  bench:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm bench
```

Check `.github/workflows/ci.yml` first and reuse its exact pnpm/node setup steps (action versions, pnpm version pinning) so the two workflows stay consistent — copy the setup block from ci.yml verbatim if it differs from the sketch above. No failure masking anywhere: the job's success = the suite ran and every honesty guard passed.

- [ ] **Step 3: Full verification**

```bash
pnpm -r build && pnpm -w exec eslint . && pnpm exec prettier --check . && pnpm -w test && pnpm bench
```

Expected: everything green end-to-end; record the bench summary output (ops/sec tables) in the report as evidence of a real run.

- [ ] **Step 4: Commit**

```bash
pnpm exec prettier --write benchmarks/README.md .github/workflows/benchmark.yml
git add -A && git commit -m "docs(benchmarks): honest README; ci: un-masked benchmark workflow"
```
