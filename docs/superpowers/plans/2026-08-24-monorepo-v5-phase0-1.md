# om-data-mapper v5 — Phase 0–1: Cleanup & Monorepo Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the om-data-mapper monolith into a pnpm monorepo with 4 packages (`@om-data-mapper/core`, `@om-data-mapper/class-transformer`, `@om-data-mapper/class-validator`, meta-package `om-data-mapper`) with zero behavior change — all 518 tests stay green.

**Architecture:** Code moves, it does not change. `src/core` + `src/decorators` + `src/index.ts` → core package; `src/compat/class-transformer` → class-transformer package; `src/compat/class-validator` → class-validator package; a new thin meta-package re-exports all three and preserves the v4 subpath exports. The compat modules have **zero imports from core** (verified by grep), so the split is mechanical. Tests move with their packages; 4 cross-package test files (they import only the two compat modules) go to the meta-package. Releases move from semantic-release to changesets.

**Tech Stack:** pnpm workspaces, changesets, TypeScript 5 (tsc dual CJS/ESM build, unchanged), vitest 3 (projects mode), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-24-monorepo-v5-design.md`

## Global Constraints

- **Zero behavior change in this plan.** Total test count before == after: **518 passed, 34 files** (4 cross-package files move to meta; totals must match).
- New scoped packages start at version **1.0.0**; meta-package becomes **5.0.0**. **Nothing is published by this plan** (publish happens in Phase 5).
- Package names exactly: `@om-data-mapper/core`, `@om-data-mapper/class-transformer`, `@om-data-mapper/class-validator`, `om-data-mapper`.
- v4 subpath exports must keep working from the meta-package: `om-data-mapper/class-transformer-compat`, `om-data-mapper/class-validator-compat`.
- `engines`: `"node": ">=18.0.0"` in every published package.
- Use `git mv` for all moves (preserve history). Commit after every task.
- Build stays `tsc` dual-build + `scripts/fix-esm-imports.js` (script stays at repo root; it operates on `build/esm` relative to cwd, so it works when invoked from a package dir).

## Manual prerequisite (repo owner, not automatable)

- [ ] Create the npm organization **om-data-mapper** at https://www.npmjs.com/org/create (verified 2026-08-24: `@om-data-mapper/core` is unclaimed, org page returns 403 → name appears free). Needed before Phase 5 publish; do it early so the name isn't squatted.

---

### Task 1: Phase 0 — delete cruft

**Files:**

- Delete: `ANNOUNCEMENT_v4.1.0.md`, `RELEASE_NOTES_v4.1.0.md`, `INTEGRATION_SUMMARY.md`, `DOCUMENTATION_IMPROVEMENTS.md`
- Delete: `.augment/` (tracked), `benchmarks/suites/compat/build-cv/`, `benchmarks/suites/compat/build-om-validation/`, `benchmarks/package.json`
- Modify: `.gitignore`

**Interfaces:** none (pure deletion).

- [ ] **Step 1: Delete the files**

```bash
git rm ANNOUNCEMENT_v4.1.0.md RELEASE_NOTES_v4.1.0.md INTEGRATION_SUMMARY.md DOCUMENTATION_IMPROVEMENTS.md
git rm -r .augment
git rm -r --ignore-unmatch benchmarks/suites/compat/build-cv benchmarks/suites/compat/build-om-validation
git rm --ignore-unmatch benchmarks/package.json benchmarks/package-lock.json
```

- [ ] **Step 2: Add ignore rules**

Append to `.gitignore`:

```
.idea/
.augment/
benchmarks/**/build-*/
```

- [ ] **Step 3: Verify tests still pass**

Run: `npx vitest run 2>&1 | tail -5`
Expected: `Test Files  34 passed (34)`, `Tests  518 passed (518)`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove stale release cruft, tracked IDE dirs, committed benchmark artifacts"
```

---

### Task 2: pnpm workspace bootstrap

**Files:**

- Create: `pnpm-workspace.yaml`
- Modify: `package.json` (root becomes private workspace root)
- Delete: `package-lock.json`

**Interfaces:**

- Produces: workspace root that later tasks add packages into; root devDependencies are shared by all packages (pnpm resolves devDeps from root for scripts run via `pnpm -r`, and vitest/tsc are invoked through root-installed binaries).

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: Rewrite root `package.json`**

Replace the whole file with (keep the existing devDependencies block verbatim — copy it from the current file):

```json
{
  "name": "om-data-mapper-monorepo",
  "private": true,
  "version": "0.0.0",
  "description": "Monorepo for om-data-mapper packages",
  "packageManager": "pnpm@10.15.0",
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "build": "pnpm -r run build",
    "clean": "pnpm -r run clean",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:esm": "pnpm -r --workspace-concurrency=1 run test:esm",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": { "<copy current devDependencies verbatim>": "" }
}
```

From devDependencies **remove** the semantic-release packages (`semantic-release`, `@semantic-release/commit-analyzer`, `@semantic-release/git`, `@semantic-release/github`, `@semantic-release/npm`, `@semantic-release/release-notes-generator`) — changesets replaces them in Task 8. Keep everything else (vitest, typescript, eslint, prettier, fast-check, class-validator, reflect-metadata, chalk, tinybench, typedoc, ts-node, @types/benchmark, @vitest/coverage-v8, @eslint/js).

- [ ] **Step 3: Switch lockfiles**

```bash
git rm package-lock.json
corepack enable pnpm 2>/dev/null || npm i -g pnpm@10
pnpm install
```

Expected: `pnpm-lock.yaml` created, install succeeds.

- [ ] **Step 4: Verify tests still run under pnpm**

Run: `pnpm exec vitest run 2>&1 | tail -5`
Expected: `Tests  518 passed (518)` (old layout still in place — `vitest.config.mts` untouched so far).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: switch to pnpm workspace root, drop semantic-release deps"
```

---

### Task 3: Create `packages/core`

**Files:**

- Move: `src/core/`, `src/decorators/`, `src/index.ts` → `packages/core/src/`
- Move: `tests/unit/core/`, `tests/unit/decorators/`, `tests/smoke/` → `packages/core/tests/unit/...`, `packages/core/tests/smoke/`
- Move: `test/esm-runtime-simple.test.mjs`, `test/esm-integration.test.mjs`, `test/ESM_TESTING.md` → `packages/core/test/`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/tsconfig.esm.json`, `packages/core/vitest.config.mts`

**Interfaces:**

- Produces: package `@om-data-mapper/core@1.0.0` exporting everything the current `src/index.ts` exports (`Mapper` class + legacy interfaces from `core/`, decorators `Mapper, Map, MapFrom, Default, Transform, MapWith, Ignore`, functions `createMapper, plainToInstance, plainToClass, plainToInstanceArray, plainToClassArray, tryPlainToInstance, tryPlainToInstanceArray, getMapper`, types `MapperOptions, PropertyMapping, MapperMetadata, TransformOptions`). Consumed by Task 6 (meta re-export).

- [ ] **Step 1: Move source**

```bash
mkdir -p packages/core
git mv src packages/core/src        # compat moves OUT again in Tasks 4-5
```

(Moving all of `src/` at once keeps `git mv` simple; Tasks 4–5 pull `packages/core/src/compat/*` out to their own packages. Nothing imports across those boundaries — verified.)

- [ ] **Step 2: Move core tests (relative import depth is preserved, so imports keep working)**

```bash
mkdir -p packages/core/tests/unit
git mv tests/unit/core packages/core/tests/unit/core
git mv tests/unit/decorators packages/core/tests/unit/decorators
git mv tests/smoke packages/core/tests/smoke
mkdir -p packages/core/test
git mv test/esm-runtime-simple.test.mjs test/esm-integration.test.mjs test/ESM_TESTING.md packages/core/test/
```

- [ ] **Step 3: Create `packages/core/package.json`**

```json
{
  "name": "@om-data-mapper/core",
  "version": "1.0.0",
  "description": "High-performance TypeScript/JavaScript data mapper with JIT compilation. TC39 decorators, zero dependencies.",
  "license": "MIT",
  "author": "Isqanderm <aleksandr.melnik.personal@gmail.com> (https://www.linkedin.com/in/isqander-melnik)",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Isqanderm/data-mapper.git",
    "directory": "packages/core"
  },
  "main": "build/cjs/index.js",
  "module": "build/esm/index.js",
  "types": "build/cjs/index.d.ts",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./build/cjs/index.d.ts",
      "import": "./build/esm/index.js",
      "require": "./build/cjs/index.js",
      "default": "./build/cjs/index.js"
    }
  },
  "files": ["build", "README.md", "LICENSE"],
  "scripts": {
    "clean": "rm -rf build",
    "build": "rm -rf build && tsc -p tsconfig.json && tsc -p tsconfig.esm.json && node ../../scripts/fix-esm-imports.js && echo '{\"type\":\"module\"}' > build/esm/package.json",
    "test": "vitest run",
    "test:esm": "node test/esm-runtime-simple.test.mjs && node test/esm-integration.test.mjs"
  },
  "engines": { "node": ">=18.0.0" },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 4: Create `packages/core/tsconfig.json` and `tsconfig.esm.json`**

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "build/cjs" },
  "include": ["src"],
  "exclude": ["node_modules", "build", "tests", "test"]
}
```

`packages/core/tsconfig.esm.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "build/esm"
  }
}
```

(The root `tsconfig.json` stays as the shared base; its own `include: ["src"]` becomes irrelevant once `src/` is gone — Task 7 cleans it up.)

- [ ] **Step 5: Create `packages/core/vitest.config.mts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Run core tests (they still see `src/compat` sitting inside the package — harmless, nothing imports it)**

```bash
cd packages/core && pnpm exec vitest run 2>&1 | tail -5; cd ../..
```

Expected: 11 test files pass (4 core + 4 decorators + 1 smoke = 9 files… count whatever passes and record it; the invariant check is the **grand total 518** in Task 7). No failures.

- [ ] **Step 7: Build the package and run ESM smoke tests**

```bash
cd packages/core && pnpm run build && node test/esm-runtime-simple.test.mjs; cd ../..
```

Expected: build succeeds; smoke test prints `All smoke tests passed`.
`esm-integration.test.mjs` computes `projectRoot` from its own location — open it, and if `projectRoot` resolves to the repo root instead of `packages/core`, fix the `join(...)` so `esmBuildDir` = `packages/core/build/esm`. Then run `node test/esm-integration.test.mjs` — expected: all scenarios pass. If any scenario imports compat paths (grep says none do), move that scenario to the meta-package in Task 6.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "refactor: extract @om-data-mapper/core package"
```

---

### Task 4: Create `packages/class-transformer`

**Files:**

- Move: `packages/core/src/compat/class-transformer/` (5 files: `index.ts`, `decorators.ts`, `functions.ts`, `metadata.ts`, `types.ts`) → `packages/class-transformer/src/`
- Move: `tests/unit/compat/class-transformer.test.ts`, `tests/unit/compat/class-transformer-decorators.test.ts` → `packages/class-transformer/tests/unit/compat/`
- Create: `packages/class-transformer/package.json`, `tsconfig.json`, `tsconfig.esm.json`, `vitest.config.mts`

**Interfaces:**

- Produces: package `@om-data-mapper/class-transformer@1.0.0` exporting the compat API (`Expose, Exclude, Type, Transform, TransformClassToPlain, TransformClassToClass, TransformPlainToClass`, `plainToInstance`, metadata helpers). Consumed by Task 6.

- [ ] **Step 1: Move source and tests**

```bash
mkdir -p packages/class-transformer/tests/unit/compat
git mv packages/core/src/compat/class-transformer packages/class-transformer/src
git mv tests/unit/compat/class-transformer.test.ts tests/unit/compat/class-transformer-decorators.test.ts packages/class-transformer/tests/unit/compat/
```

- [ ] **Step 2: Fix test import paths** (tests import `../../../src/compat/class-transformer`; in the new package the module root is `src`)

```bash
cd packages/class-transformer
LC_ALL=C sed -i '' "s|src/compat/class-transformer|src|g" tests/unit/compat/*.test.ts
grep -rn "compat" tests/ && echo "LEFTOVER — fix manually" || echo "OK: no compat paths left"
cd ../..
```

- [ ] **Step 3: Create package config files**

`packages/class-transformer/package.json` — same shape as core's (Task 3 Step 3) with these differences:

```json
{
  "name": "@om-data-mapper/class-transformer",
  "version": "1.0.0",
  "description": "class-transformer compatibility adapter for om-data-mapper: JIT-compiled Expose/Exclude/Type/Transform decorators and plainToInstance.",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Isqanderm/data-mapper.git",
    "directory": "packages/class-transformer"
  },
  "scripts": {
    "clean": "rm -rf build",
    "build": "rm -rf build && tsc -p tsconfig.json && tsc -p tsconfig.esm.json && node ../../scripts/fix-esm-imports.js && echo '{\"type\":\"module\"}' > build/esm/package.json",
    "test": "vitest run"
  }
}
```

All other fields (`main`, `module`, `types`, `sideEffects`, `exports` (only `.`), `files`, `license`, `author`, `engines`, `publishConfig`) — identical to core's.

`tsconfig.json`, `tsconfig.esm.json`, `vitest.config.mts` — byte-identical to core's (Task 3 Steps 4–5); copy them:

```bash
cp packages/core/tsconfig.json packages/core/tsconfig.esm.json packages/core/vitest.config.mts packages/class-transformer/
```

- [ ] **Step 4: Test and build**

```bash
cd packages/class-transformer && pnpm exec vitest run 2>&1 | tail -4 && pnpm run build; cd ../..
```

Expected: 2 test files pass, 0 fail; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: extract @om-data-mapper/class-transformer package"
```

---

### Task 5: Create `packages/class-validator`

**Files:**

- Move: `packages/core/src/compat/class-validator/` (16 files: `index.ts`, `types.ts`, `decorators/` ×10, `engine/` ×4) → `packages/class-validator/src/`
- Move: `tests/unit/compat/class-validator/` (20 test files) → `packages/class-validator/tests/unit/compat/class-validator/`
- Create: `packages/class-validator/package.json`, `tsconfig.json`, `tsconfig.esm.json`, `vitest.config.mts`
- Delete (now empty): `packages/core/src/compat/`, `tests/unit/compat/`

**Interfaces:**

- Produces: package `@om-data-mapper/class-validator@1.0.0` exporting the compat API (`validate`, `validateSync`, all validator decorators, `ValidationError`, `ValidatorOptions` types). Subdirectory imports like `.../decorators` must keep working for the meta tests (Task 6 aliases handle it). Consumed by Task 6.

- [ ] **Step 1: Move source and tests**

```bash
mkdir -p packages/class-validator/tests/unit/compat
git mv packages/core/src/compat/class-validator packages/class-validator/src
git mv tests/unit/compat/class-validator packages/class-validator/tests/unit/compat/class-validator
rmdir packages/core/src/compat tests/unit/compat 2>/dev/null || true
```

- [ ] **Step 2: Fix test import paths** (tests import `../../../../src/compat/class-validator[...]`)

```bash
cd packages/class-validator
LC_ALL=C sed -i '' "s|src/compat/class-validator|src|g" tests/unit/compat/class-validator/*.test.ts
grep -rn "compat/class-validator" tests/ && echo "LEFTOVER — fix manually" || echo "OK"
cd ../..
```

- [ ] **Step 3: Create package config files** — same recipe as Task 4 Step 3, with:

```json
{
  "name": "@om-data-mapper/class-validator",
  "version": "1.0.0",
  "description": "class-validator compatibility adapter for om-data-mapper: JIT-compiled validation engine and decorators.",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Isqanderm/data-mapper.git",
    "directory": "packages/class-validator"
  }
}
```

```bash
cp packages/core/tsconfig.json packages/core/tsconfig.esm.json packages/core/vitest.config.mts packages/class-validator/
```

- [ ] **Step 4: Test and build**

```bash
cd packages/class-validator && pnpm exec vitest run 2>&1 | tail -4 && pnpm run build; cd ../..
```

Expected: 20 test files pass, 0 fail; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: extract @om-data-mapper/class-validator package"
```

---

### Task 6: Create meta-package `packages/om-data-mapper`

**Files:**

- Create: `packages/om-data-mapper/src/index.ts`, `src/class-transformer-compat.ts`, `src/class-validator-compat.ts`
- Create: `packages/om-data-mapper/package.json`, `tsconfig.json`, `tsconfig.esm.json`, `vitest.config.mts`
- Move: `tests/integration/real-world-scenarios.test.ts`, `tests/unit/integration/validation-and-mapping.test.ts`, `tests/benchmarks/regression.test.ts`, `tests/benchmarks/memory-leak.test.ts` → `packages/om-data-mapper/tests/`
- Move: `test/esm-post-install-simulation.test.mjs` → `packages/om-data-mapper/test/`
- Delete (now empty): `tests/`, `test/`

**Interfaces:**

- Consumes: the three packages from Tasks 3–5 as `workspace:^` dependencies.
- Produces: package `om-data-mapper@5.0.0` whose root export re-exports `@om-data-mapper/core`, and whose subpaths `./class-transformer-compat` / `./class-validator-compat` re-export the adapters — the exact v4 public surface.

- [ ] **Step 1: Create source files**

`packages/om-data-mapper/src/index.ts`:

```ts
export * from '@om-data-mapper/core';
```

`packages/om-data-mapper/src/class-transformer-compat.ts`:

```ts
export * from '@om-data-mapper/class-transformer';
```

`packages/om-data-mapper/src/class-validator-compat.ts`:

```ts
export * from '@om-data-mapper/class-validator';
```

- [ ] **Step 2: Create `packages/om-data-mapper/package.json`**

```json
{
  "name": "om-data-mapper",
  "version": "5.0.0",
  "description": "High-performance TypeScript/JavaScript data mapper and validator with JIT compilation. Meta-package: re-exports @om-data-mapper/core and the class-transformer / class-validator compatibility adapters.",
  "license": "MIT",
  "author": "Isqanderm <aleksandr.melnik.personal@gmail.com> (https://www.linkedin.com/in/isqander-melnik)",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Isqanderm/data-mapper.git",
    "directory": "packages/om-data-mapper"
  },
  "main": "build/cjs/index.js",
  "module": "build/esm/index.js",
  "types": "build/cjs/index.d.ts",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./build/cjs/index.d.ts",
      "import": "./build/esm/index.js",
      "require": "./build/cjs/index.js",
      "default": "./build/cjs/index.js"
    },
    "./class-transformer-compat": {
      "types": "./build/cjs/class-transformer-compat.d.ts",
      "import": "./build/esm/class-transformer-compat.js",
      "require": "./build/cjs/class-transformer-compat.js",
      "default": "./build/cjs/class-transformer-compat.js"
    },
    "./class-validator-compat": {
      "types": "./build/cjs/class-validator-compat.d.ts",
      "import": "./build/esm/class-validator-compat.js",
      "require": "./build/cjs/class-validator-compat.js",
      "default": "./build/cjs/class-validator-compat.js"
    }
  },
  "files": ["build", "README.md", "LICENSE"],
  "scripts": {
    "clean": "rm -rf build",
    "build": "rm -rf build && tsc -p tsconfig.json && tsc -p tsconfig.esm.json && node ../../scripts/fix-esm-imports.js && echo '{\"type\":\"module\"}' > build/esm/package.json",
    "test": "vitest run",
    "test:esm": "node test/esm-post-install-simulation.test.mjs"
  },
  "dependencies": {
    "@om-data-mapper/core": "workspace:^",
    "@om-data-mapper/class-transformer": "workspace:^",
    "@om-data-mapper/class-validator": "workspace:^"
  },
  "engines": { "node": ">=18.0.0" },
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 3: tsconfigs (copy from core) and vitest config with source aliases**

```bash
cp packages/core/tsconfig.json packages/core/tsconfig.esm.json packages/om-data-mapper/
```

`packages/om-data-mapper/vitest.config.mts` (aliases point at sibling **sources**, so meta tests don't require a prior build):

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@om-data-mapper/core': p('../core/src'),
      '@om-data-mapper/class-transformer': p('../class-transformer/src'),
      '@om-data-mapper/class-validator': p('../class-validator/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Move the 4 cross-package test files and rewrite their imports to package names**

These files import **only** the two compat modules (verified by grep — no core imports):

```bash
mkdir -p packages/om-data-mapper/tests
git mv tests/integration/real-world-scenarios.test.ts packages/om-data-mapper/tests/real-world-scenarios.test.ts
git mv tests/unit/integration/validation-and-mapping.test.ts packages/om-data-mapper/tests/validation-and-mapping.test.ts
git mv tests/benchmarks/regression.test.ts packages/om-data-mapper/tests/regression.test.ts
git mv tests/benchmarks/memory-leak.test.ts packages/om-data-mapper/tests/memory-leak.test.ts
cd packages/om-data-mapper
LC_ALL=C sed -i '' \
  -e "s|'[./]*src/compat/class-validator/decorators'|'@om-data-mapper/class-validator/decorators'|g" \
  -e "s|'[./]*src/compat/class-validator'|'@om-data-mapper/class-validator'|g" \
  -e "s|'[./]*src/compat/class-transformer'|'@om-data-mapper/class-transformer'|g" \
  tests/*.test.ts
grep -n "src/compat" tests/*.test.ts && echo "LEFTOVER — fix manually" || echo "OK"
cd ../..
```

Note: the `/decorators` subpath resolves through the vite alias prefix (`@om-data-mapper/class-validator` → `../class-validator/src`, so `/decorators` lands on `src/decorators`).

- [ ] **Step 5: Run meta tests**

```bash
cd packages/om-data-mapper && pnpm exec vitest run 2>&1 | tail -4; cd ../..
```

Expected: 4 test files pass, 0 fail.

- [ ] **Step 6: Move and adapt the ESM post-install simulation**

```bash
mkdir -p packages/om-data-mapper/test
git mv test/esm-post-install-simulation.test.mjs packages/om-data-mapper/test/
rmdir test tests/integration tests/unit tests/benchmarks tests 2>/dev/null || true
```

Open `packages/om-data-mapper/test/esm-post-install-simulation.test.mjs` and update paths:

- the build dir it inspects → `packages/om-data-mapper/build/esm` (relative to the file: `join(__dirname, '..', 'build', 'esm')`);
- any reference to `build/esm/compat/class-transformer/...` → `build/esm/class-transformer-compat.js` (same for class-validator);
- if it simulates `import 'om-data-mapper'` from a temp dir, ensure it can resolve the workspace deps (run it after `pnpm -r build`; workspace symlinks in `node_modules` make bare-specifier imports of `@om-data-mapper/*` resolve).

```bash
pnpm -r run build
node packages/om-data-mapper/test/esm-post-install-simulation.test.mjs
```

Expected: all scenarios pass. Iterate on path fixes until green — do not weaken assertions.

- [ ] **Step 7: pnpm link check**

```bash
pnpm install   # registers workspace deps of the meta package
pnpm -r run build 2>&1 | tail -3
```

Expected: build order is core → adapters → meta (pnpm topological), all succeed.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add om-data-mapper meta-package preserving v4 export surface"
```

---

### Task 7: Root wiring — vitest projects, coverage, eslint, tsconfig, typedoc

**Files:**

- Modify: `vitest.config.mts` (root), `tsconfig.json` (root), `eslint.config.mjs`, `typedoc.json`
- Delete: root `tsconfig.esm.json` (per-package copies exist now)

**Interfaces:**

- Consumes: the 4 package `vitest.config.mts` files (Tasks 3–6).
- Produces: `pnpm test` at root runs **all** suites with coverage; this is the command CI uses (Task 9).

- [ ] **Step 1: Rewrite root `vitest.config.mts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'json', 'json-summary', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/types.ts', '**/interfaces.ts', 'packages/om-data-mapper/src/**'],
      all: true,
      thresholds: { lines: 70, functions: 80, branches: 70, statements: 70 },
    },
  },
});
```

(The v4 config excluded `class-transformer` sources from coverage; they are now included. If thresholds fail because of that package, add `'packages/class-transformer/src/**'` to `exclude` with the comment `// TODO Phase 2: raise coverage and remove` — do not lower the thresholds.)

- [ ] **Step 2: Root `tsconfig.json`** — keep it as the shared compiler-options base but stop compiling from root: change `"include": ["src"]` to `"include": []`, and delete root `tsconfig.esm.json`:

```bash
git rm tsconfig.esm.json
```

- [ ] **Step 3: `eslint.config.mjs`** — in the `ignores` array replace `'build/**'` with `'**/build/**'` and add `'**/coverage/**'` if missing.

- [ ] **Step 4: `typedoc.json`** — point `entryPoints` at the new sources: `["packages/core/src/index.ts", "packages/class-transformer/src/index.ts", "packages/class-validator/src/index.ts"]`. Verify with `pnpm exec typedoc --emit none` (warnings OK, errors not).

- [ ] **Step 5: THE INVARIANT CHECK — run everything from root**

```bash
pnpm test 2>&1 | tail -8
```

Expected — **must match the pre-split baseline exactly**:

- `Test Files  34 passed (34)`
- `Tests  518 passed (518)`
- coverage table prints; thresholds pass.

```bash
pnpm lint && pnpm run build && pnpm run test:esm
```

Expected: all succeed.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: wire root vitest projects, coverage, eslint and typedoc to monorepo layout"
```

---

### Task 8: Changesets

**Files:**

- Create: `.changeset/config.json`
- Delete: `.releaserc.json`
- Modify: root `package.json` (add changesets devDep + release scripts)

**Interfaces:**

- Produces: `pnpm changeset` workflow used by the release CI (Task 9) and by Phase 5 to publish.

- [ ] **Step 1: Install and init**

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
git rm .releaserc.json
```

- [ ] **Step 2: Configure `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "Isqanderm/data-mapper" }],
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

```bash
pnpm add -Dw @changesets/changelog-github
```

- [ ] **Step 3: Add root release scripts** (to root `package.json` `scripts`):

```json
"changeset": "changeset",
"version-packages": "changeset version",
"release": "pnpm -r run build && changeset publish"
```

- [ ] **Step 4: Sanity check**

Run: `pnpm changeset status 2>&1 | tail -3`
Expected: reports no changesets present (clean state) without erroring.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: replace semantic-release with changesets"
```

---

### Task 9: Rewrite CI workflows

**Files:**

- Rewrite: `.github/workflows/ci.yml` (764 lines → ~60)
- Rewrite: `.github/workflows/release.yml` (changesets action)
- Replace: `.github/workflows/benchmark.yml` (stub until Phase 3)
- Keep: `.github/workflows/codeql.yml` (untouched)

**Interfaces:**

- Consumes: root scripts from Task 7 (`pnpm test`, `pnpm lint`, `pnpm run build`, `pnpm run test:esm`) and Task 8 (`pnpm run release`, `pnpm run version-packages`).

- [ ] **Step 1: Rewrite `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm lint
      - run: pnpm run format:check
      - run: pnpm test
      - run: pnpm run test:esm
      - name: Upload coverage to Codecov
        if: matrix.node == 22
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: coverage/lcov.info
          fail_ci_if_error: true
```

The 520-line inline coverage-comment script is deleted; Codecov's default PR comment (already configured via `codecov.yml`) replaces it.

- [ ] **Step 2: Rewrite `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Create release PR or publish
        uses: changesets/action@v1
        with:
          publish: pnpm run release
          version: pnpm run version-packages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Manual follow-up noted for Phase 5: the existing `NPM_TOKEN` secret (used by semantic-release) must have publish rights for the new `@om-data-mapper` scope.

- [ ] **Step 3: Stub `.github/workflows/benchmark.yml`**

Replace the whole file with:

```yaml
name: Benchmarks

# The v4 benchmark pipeline referenced non-existent paths and masked failures.
# It is being rebuilt honestly in Phase 3 (see docs/superpowers/specs/2026-08-24-monorepo-v5-design.md).
on:
  workflow_dispatch:

jobs:
  placeholder:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Benchmark pipeline is being rebuilt in Phase 3."
```

- [ ] **Step 4: Validate workflow syntax**

```bash
pnpm exec prettier --check .github/workflows/*.yml || pnpm exec prettier --write .github/workflows/*.yml
```

(If `actionlint` is available: `actionlint .github/workflows/*.yml`.)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "ci: rewrite pipelines for pnpm monorepo, changesets release, stub benchmarks until Phase 3"
```

---

### Task 10: Final verification and push

**Files:** none new.

- [ ] **Step 1: Full clean-room check**

```bash
git status --porcelain           # expected: empty
rm -rf node_modules packages/*/node_modules packages/*/build
pnpm install --frozen-lockfile
pnpm run build && pnpm lint && pnpm test 2>&1 | tail -6 && pnpm run test:esm
```

Expected: `Tests  518 passed (518)`, everything green.

- [ ] **Step 2: Verify the meta-package surface (the v4 contract)**

```bash
node -e "const m = require('./packages/om-data-mapper/build/cjs/index.js'); const ct = require('./packages/om-data-mapper/build/cjs/class-transformer-compat.js'); const cv = require('./packages/om-data-mapper/build/cjs/class-validator-compat.js'); console.log(typeof m.plainToInstance, typeof ct.Expose, typeof cv.validateSync);"
```

Expected output: `function function function`

- [ ] **Step 3: Push and watch CI**

```bash
git push origin main
gh run watch --exit-status || gh run list --limit 3
```

Expected: CI matrix (Node 20/22/24) green. If a matrix job fails on Node 24 for environment reasons, fix forward — do not drop the matrix entry silently.

---

## Follow-up phases (each gets its own plan via superpowers:writing-plans when its turn comes)

The spec (`docs/superpowers/specs/2026-08-24-monorepo-v5-design.md`) is the source of truth; this is the committed scope so nothing gets lost:

**Phase 2 — compat honesty (`packages/class-validator`, `packages/class-transformer`), TDD:**

- Implement in `engine/compiler.ts` + `engine/validator.ts` all 7 dead `ValidatorOptions` with class-validator semantics: `skipMissingProperties` / `skipUndefinedProperties` (skip validators when the property is `undefined`, except `@IsDefined`), `skipNullProperties` (same for `null`), `whitelist` (strip properties that have no validation decorators; requires implementing `@Allow`), `forbidNonWhitelisted` (error instead of stripping, `whitelistValidation` constraint), `forbidUnknownValues` (объект без метаданных → error, default true as in class-validator ≥0.14), `stopAtFirstError` (per-property short-circuit).
- Function-form `message: (args: ValidationArguments) => string` in `getErrorMessage` (`engine/compiler.ts:~1376`); add `ValidationArguments` construction (value, constraints, targetName, object, property).
- `registerDecorator()` + minimal `getMetadataStorage()`; `ValidationError.target`/`.value` + `validationError: {target, value}` options.
- class-transformer adapter: implement `enableImplicitConversion`; **remove** from types the dead `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`, `enableValidation`.
- Compat tables (implemented / not implemented) in each package README; missing ~20 decorators stay missing but documented.

**Phase 3 — honest benchmarks:**

- Delete `benchmarks/comparisons/validation-comparison/` (measures a no-op) and its fabricated `RESULTS.md`.
- New private workspace package `packages/benchmarks` (not published): tinybench suites comparing `@om-data-mapper/class-transformer` vs `class-transformer` and `@om-data-mapper/class-validator` vs `class-validator`, using **each library's own decorators** on equivalent models; JSON output for CI.
- One command: `pnpm bench`. Rebuild `benchmark.yml` from the stub: run on main, `benchmark-action/github-action-benchmark` for trend tracking, **no `|| echo` masking**.

**Phase 4 — documentation:**

- Root README rewritten ≤300 lines: what/why, install, quick start (mapper + validator), honest benchmark table generated from Phase 3 JSON, links to per-package READMEs and `docs/`; class-validator adapter gets first-class billing. Remove the self-contradicting claims ("17.28x", "42.7x", vanilla table, "98% coverage").
- Per-package READMEs (npm landing pages) with compat tables from Phase 2.
- `docs/migration-v4-to-v5.md`; move the troubleshooting manual from README into `docs/`; sync `docs-ru/` (add missing `migration-class-transformer.md` translation); fix the broken `docs/COVERAGE_PROTECTION.md` link; update CHANGELOG note that changelogs are now per-package.

**Phase 5 — release & revival:**

- Verify npm org `om-data-mapper` + `NPM_TOKEN` scope rights; changeset for all 4 packages (scoped 1.0.0, meta 5.0.0 major with migration notes); merge → changesets PR → publish.
- `npm deprecate` nothing (meta keeps the name alive); verify `npm install om-data-mapper@5` in a scratch project (CJS + ESM + both subpaths).
- Merge the 5 dependabot PRs (rebased onto monorepo); close or convert PR #21 into a `@om-data-mapper/nestjs` plan; announce (release notes with honest numbers).
