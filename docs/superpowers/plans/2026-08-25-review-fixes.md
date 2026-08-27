# PR #37 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every confirmed finding from the whole-branch adversarial review of PR #37 (20 confirmed findings: 8 code bugs, 1 security issue in codegen, packaging/licensing gaps, dishonest test certification, and CI/typecheck holes).

**Architecture:** All fixes are surgical changes inside the existing monorepo packages (`packages/core`, `packages/class-validator`, `packages/class-transformer`, `packages/om-data-mapper`) plus CI/packaging wiring. No new dependencies, no new packages. Every behavior change is recorded in a changeset and mirrored into the compat/migration docs (EN + RU).

**Tech Stack:** TypeScript (TC39 stage-3 decorators, no reflect-metadata), vitest (root workspace projects), pnpm workspaces, Changesets, GitHub Actions.

**Spec:** The findings inventory below (§Findings) is the spec. Background: `docs/superpowers/specs/2026-08-24-monorepo-v5-design.md`.

## Global Constraints

- Node floor is 20 → `Object.hasOwn` and `structuredClone` are allowed in source and generated code.
- Zero runtime dependencies in all published packages — do not add any.
- TDD per task: failing test first, then the minimal fix. The full suite (`pnpm test`, currently 38 files / 549 tests) must stay green after every task.
- Prettier is a CI gate: run `pnpm exec prettier --write <changed files>` before every commit.
- All tests import source via relative `src` paths (e.g. `../../../../src`), matching existing files in the same directory — never via package names inside a package's own test tree.
- Run a single test file from the repo root with: `pnpm exec vitest run <path-to-test-file>`.
- Behavior changes must update `docs/compat-class-validator.md` / `docs/compat-class-transformer.md`, their `docs-ru/` mirrors, and get a changeset. Packages are not yet published, so `patch` changesets are sufficient.
- Commit after every task; commit messages end with the standard Co-Authored-By / Claude-Session trailer used in this branch's history.

## Findings → Task map

| #   | Finding (file:line)                                                                                                            | Task      |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 1   | stopAtFirstError async trim uses `in`, walks Object.prototype (compiler.ts:601)                                                | Task 1    |
| 2   | Null-prototype objects throw instead of unknownValue (validator.ts:53, metadata.ts:146)                                        | Task 2    |
| 3   | Constraints array grows unbounded per instantiation (metadata.ts:65, string.ts:630, custom.ts:96/144)                          | Task 3    |
| 4   | registerDecorator drops second unnamed inline validator / same class with new constraints (register-decorator.ts:41)           | Task 4    |
| 5   | Class-based custom validators report key `custom` instead of registered name (register-decorator.ts:49, compiler.ts:1665/1838) | Task 4    |
| 6   | Validation metadata keyed by module-local Symbol — duplicate installs validate nothing (metadata.ts:15)                        | Task 5    |
| 7   | enableImplicitConversion coerces arrays as a whole (functions.ts:329)                                                          | Task 6    |
| 8   | `require('./functions')` survives into ESM build of 3 method decorators (decorators.ts:221/240/259)                            | Task 7    |
| 9   | @Map path / target key interpolated raw into `new Function` source — SyntaxError + code injection (core.ts:261 et al.)         | Task 8    |
| 10  | Fabricated perf figures still live in core JSDoc (index.ts:5/10/85, core.ts:38)                                                | Task 9    |
| 11  | All 4 tarballs publish without a LICENSE file (packages/\*/package.json `files`)                                               | Task 10   |
| 12  | Tests import `@om-data-mapper/class-validator/decorators` — not in the exports map                                             | Task 11   |
| 13  | ESM post-install simulation bypasses the exports map; legacy `Mapper.create` unreachable from public surface                   | Task 12   |
| 14  | benchmarks/tsconfig.json fails `tsc --noEmit` (4× TS2339); examples & benchmarks typecheck absent from CI                      | Task 13   |
| 15  | whitelist/stopAtFirstError codegen duplicated sync/async; ci.yml matrix redundancy; release re-arm                             | §Deferred |

---

### Task 1: stopAtFirstError must check own keys only

**Files:**

- Modify: `packages/class-validator/src/engine/compiler.ts:601`
- Test: `packages/class-validator/tests/unit/compat/class-validator/stop-at-first-error-prototype.test.ts` (create)

**Interfaces:**

- Consumes: `validate`, `ValidateBy`, `MinLength` from `packages/class-validator/src/index.ts` (already exported).
- Produces: no API change — generated async validators use `Object.hasOwn` for the first-error lookup.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { validate, ValidateBy, MinLength } from '../../../../src';

// 'toString' passes sanitizeValidatorName's IDENTIFIER_REGEX but is an
// inherited key on every plain object — the exact prototype collision.
function IsToStringNamed() {
  return ValidateBy({
    name: 'toString',
    validator: { validate: () => false, defaultMessage: () => 'toString check failed' },
  });
}

describe('stopAtFirstError with prototype-colliding validator names', () => {
  it('keeps exactly one error instead of dropping all of them (async path)', async () => {
    class Dto {
      @IsToStringNamed()
      @MinLength(100)
      s!: string;
    }
    const instance = Object.assign(new Dto(), { s: 'x' });
    const errors = await validate(instance, { stopAtFirstError: true });
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/stop-at-first-error-prototype.test.ts`
Expected: FAIL — `errors` has length 0 (the trim resolved `firstKey` to the inherited `toString`, deleted every real key, then dropped the error entirely).

- [ ] **Step 3: Fix the generated lookup**

In `packages/class-validator/src/engine/compiler.ts` line 601, replace:

```typescript
lines.push(`        const firstKey = order.find(k => k in propertyErrors) || keys[0];`);
```

with:

```typescript
lines.push(
  `        const firstKey = order.find(k => Object.hasOwn(propertyErrors, k)) || keys[0];`,
);
```

Then check there are no other `in propertyErrors` / `in errors` membership tests in generated code: `grep -n "in propertyErrors\|in errors" packages/class-validator/src/engine/compiler.ts` — fix any other hit the same way (as of writing, line 601 is the only one).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/stop-at-first-error-prototype.test.ts`
Expected: PASS

- [ ] **Step 5: Run the package suite**

Run: `pnpm exec vitest run packages/class-validator`
Expected: all files pass.

- [ ] **Step 6: Commit**

```bash
git add packages/class-validator/src/engine/compiler.ts packages/class-validator/tests/unit/compat/class-validator/stop-at-first-error-prototype.test.ts
git commit -m "fix(class-validator): stopAtFirstError trim must check own keys, not inherited ones"
```

---

### Task 2: null-prototype inputs must not throw

**Files:**

- Modify: `packages/class-validator/src/engine/metadata.ts:145-148` (`getClassValidationMetadata`)
- Test: `packages/class-validator/tests/unit/compat/class-validator/null-prototype-input.test.ts` (create)

**Interfaces:**

- Consumes: `validate`, `validateSync` from `../../../../src`.
- Produces: `getClassValidationMetadata(instance)` returns `undefined` for constructor-less instances (signature unchanged).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../../../src';

describe('validating objects without a prototype', () => {
  it('validateSync returns [] for Object.create(null)', () => {
    expect(validateSync(Object.create(null))).toEqual([]);
  });

  it('validateSync returns unknownValue when forbidUnknownValues is set', () => {
    const errors = validateSync(Object.create(null), { forbidUnknownValues: true });
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('unknownValue');
  });

  it('async validate returns [] for Object.create(null)', async () => {
    expect(await validate(Object.create(null))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/null-prototype-input.test.ts`
Expected: FAIL with `TypeError` (reading `VALIDATION_METADATA` off `undefined` constructor).

- [ ] **Step 3: Guard the constructor lookup**

In `packages/class-validator/src/engine/metadata.ts`, replace:

```typescript
export function getClassValidationMetadata(instance: any): ClassValidationMetadata | undefined {
  const constructor = instance.constructor;
  return constructor[VALIDATION_METADATA];
}
```

with:

```typescript
export function getClassValidationMetadata(instance: any): ClassValidationMetadata | undefined {
  const constructor = instance?.constructor;
  return constructor ? constructor[VALIDATION_METADATA] : undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/null-prototype-input.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/class-validator/src/engine/metadata.ts packages/class-validator/tests/unit/compat/class-validator/null-prototype-input.test.ts
git commit -m "fix(class-validator): return no-metadata for null-prototype objects instead of throwing"
```

---

### Task 3: constraint metadata must not grow per instantiation

**Files:**

- Modify: `packages/class-validator/src/engine/metadata.ts` (`addValidationConstraint`)
- Modify: `packages/class-validator/src/decorators/string.ts:619-640` (`Matches`)
- Modify: `packages/class-validator/src/decorators/custom.ts:86-107` (`Validate`), `:127-156` (`ValidateBy`)
- Test: `packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts` (create)

**Interfaces:**

- Consumes: `getValidationMetadata` from `../../../../src/engine/metadata` (already exported from that module).
- Produces: decorators build **one** `ValidationConstraint` object per decorator application (hoisted out of `addInitializer`), so the identity check in `addValidationConstraint` deduplicates repeated initializer runs. `addValidationConstraint` gains a fast identity path: `constraints.includes(constraint)`.

**Root cause:** `addInitializer` callbacks run on every `new Dto()`. The three object-valued decorators (`Matches`, `Validate`, `ValidateBy` — verified the only ones: `grep -rn "value: {" packages/class-validator/src/decorators/` returns exactly string.ts:630, custom.ts:97, custom.ts:144) build a **fresh** `value` object inside the callback, and `addValidationConstraint`'s dedup compares `value` by identity → never matches → unbounded growth.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { Matches, Validate, ValidateBy, validateSync } from '../../../../src';
import { getValidationMetadata } from '../../../../src/engine/metadata';

class AlwaysFailsConstraint {
  validate() {
    return false;
  }
}

function IsFailing() {
  return ValidateBy({
    name: 'isFailing',
    validator: { validate: () => false, defaultMessage: () => 'nope' },
  });
}

describe('constraint metadata does not grow per instantiation', () => {
  it('@Matches registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @Matches(/^a+$/)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('@Validate registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @Validate(AlwaysFailsConstraint)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('@ValidateBy registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @IsFailing()
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('errors carry a single constraint key after many constructions', () => {
    class Dto {
      @Matches(/^a+$/)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    const errors = validateSync(Object.assign(new Dto(), { s: '!!!' }));
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['matches']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts`
Expected: FAIL — constraints arrays have length 50.

- [ ] **Step 3: Hoist constraint objects out of addInitializer**

`packages/class-validator/src/decorators/string.ts` — add to the type import at the top of the file: `ValidationConstraint` (from `'../types'`). Rewrite the body of `Matches`'s inner function:

```typescript
return function (target: undefined, context: ClassFieldDecoratorContext): any {
  const propertyKey = context.name;

  // One constraint object per decorator application: addInitializer runs on
  // every construction, and addValidationConstraint dedups by identity.
  const constraint: ValidationConstraint = {
    type: 'matches',
    value: {
      pattern: pattern instanceof RegExp ? pattern.source : pattern,
      modifiers: pattern instanceof RegExp ? pattern.flags : modifiers,
    },
    message: options?.message,
    groups: options?.groups,
    always: options?.always,
  };

  context.addInitializer(function (this: any) {
    addValidationConstraint(this.constructor, propertyKey, constraint);
  });
};
```

`packages/class-validator/src/decorators/custom.ts` — same hoist for `Validate`:

```typescript
return function (target: undefined, context: ClassFieldDecoratorContext): any {
  const propertyKey = context.name;

  const constraint: ValidationConstraint = {
    type: 'custom',
    value: {
      constraintClass,
      constraints: constraints || [],
    },
    message: options?.message,
    groups: options?.groups,
    always: options?.always,
  };

  context.addInitializer(function (this: any) {
    addValidationConstraint(this.constructor, propertyKey, constraint);
  });
};
```

and for `ValidateBy`:

```typescript
return function (target: undefined, context: ClassFieldDecoratorContext): any {
  const propertyKey = context.name;

  const constraint: ValidationConstraint = {
    type: 'validateBy',
    value: {
      name: options.name,
      validator: options.validator.validate,
      defaultMessage: options.validator.defaultMessage,
      constraints: options.constraints || [],
    },
    message: validationOptions?.message,
    groups: validationOptions?.groups,
    always: validationOptions?.always,
  };

  context.addInitializer(function (this: any) {
    addValidationConstraint(this.constructor, propertyKey, constraint);
  });
};
```

Add `import type { ValidationConstraint } from '../types';` to custom.ts (string.ts already imports from `'../types'` — extend that import).

`packages/class-validator/src/engine/metadata.ts` — add the identity fast path at the top of `addValidationConstraint`, right after `getPropertyMetadata`:

```typescript
const propertyMetadata = getPropertyMetadata(target, propertyKey);

// Fast path: the same constraint object re-registered by a repeated
// addInitializer run (decorators hoist one object per application).
if (propertyMetadata.constraints.includes(constraint)) return;
```

Keep the existing structural comparison below it (it still covers value-less decorators like `@IsFQDN` that build a fresh constraint per run — their `value` is `undefined`, so the structural compare works for them).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts`
Expected: PASS

- [ ] **Step 5: Run the package suite**

Run: `pnpm exec vitest run packages/class-validator`
Expected: all pass (subclass scenarios keep working: the same hoisted constraint object lands in each subclass's own metadata map).

- [ ] **Step 6: Commit**

```bash
git add packages/class-validator/src/decorators/string.ts packages/class-validator/src/decorators/custom.ts packages/class-validator/src/engine/metadata.ts packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts
git commit -m "fix(class-validator): stop unbounded constraint growth - one constraint object per decorator application"
```

---

### Task 4: registerDecorator fidelity — named keys, no silent drops

**Files:**

- Modify: `packages/class-validator/src/register-decorator.ts` (full rewrite below)
- Modify: `packages/class-validator/src/decorators/custom.ts` (`Validate` — add `name` to value)
- Modify: `packages/class-validator/src/engine/compiler.ts` (sync custom branch ~1646-1676, async custom branch ~1820-1846, stopAtFirstError order map line 592-594)
- Modify: `docs/compat-class-validator.md`, `docs-ru/compat-class-validator.md`
- Test: `packages/class-validator/tests/unit/compat/class-validator/register-decorator-fidelity.test.ts` (create)

**Interfaces:**

- Consumes: hoisted-constraint pattern from Task 3 (this task edits the same `Validate` block Task 3 produced).
- Produces: `custom`-type constraint `value` gains a `name: string` field; `validateBy`-type value gains `validatorSource: string` (used only for dedup). The compiler emits the error key `sanitizeValidatorName(constraint.value.name || 'custom')` for custom-class validators, sync and async.

**Behavior change (record in changeset + compat table):** class-based custom validators (`@Validate(Cls)`, `registerDecorator({validator: Cls})`) now report errors under the registered name (`@ValidatorConstraint({name})` → explicit `args.name` → lowerFirst(class name)) instead of the hard-coded `custom` — this matches upstream class-validator.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { registerDecorator, validateSync, Validate, ValidatorConstraint } from '../../../../src';
import { getValidationMetadata } from '../../../../src/engine/metadata';
import type { ValidationArguments } from '../../../../src';

@ValidatorConstraint({ name: 'isLongerThan' })
class IsLongerThanConstraint {
  validate(value: any, args?: ValidationArguments) {
    const [related] = args!.constraints;
    const other = (args!.object as any)[related];
    return typeof value === 'string' && typeof other === 'string' && value.length > other.length;
  }
}

describe('registerDecorator fidelity', () => {
  it('enforces BOTH unnamed inline validators on one property', () => {
    class Dto {
      v!: string;
    }
    // Two different unnamed inline validators, registered the way the
    // documented TC39 migration pattern does (imperative, per property).
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      validator: { validate: (value: any) => typeof value === 'string' },
    });
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      validator: { validate: (value: any) => typeof value === 'string' && value.length >= 3 },
    });
    const short = Object.assign(new Dto(), { v: 'ab' });
    const errors = validateSync(short);
    expect(errors).toHaveLength(1); // second validator must actually run
  });

  it('enforces the same constraint class registered twice with different constraints', () => {
    class Dto {
      a = 'aaaa';
      b = 'bbbbbb';
      v!: string;
    }
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: IsLongerThanConstraint,
    });
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['b'],
      validator: IsLongerThanConstraint,
    });
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(2);
  });

  it('does not grow metadata when the identical registration repeats', () => {
    class Dto {
      v!: string;
    }
    for (let i = 0; i < 50; i++) {
      registerDecorator({
        target: Dto,
        propertyName: 'v',
        constraints: ['a'],
        validator: IsLongerThanConstraint,
      });
    }
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(1);
  });

  it('reports class-based validators under their registered name', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      name: 'isLongerThan',
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: IsLongerThanConstraint,
    });
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });

  it('@Validate reports under the @ValidatorConstraint name', () => {
    class Dto {
      a = 'aaaa';
      @Validate(IsLongerThanConstraint, ['a'])
      v = 'x';
    }
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });
});
```

Note: if `ValidatorConstraint` is not exported from the package root, add it to `packages/class-validator/src/index.ts`'s existing decorator re-export (check first — `export * from './decorators'` probably already covers it).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/register-decorator-fidelity.test.ts`
Expected: FAIL — test 1 gets 0 errors (second validator dropped), test 2 gets length 1, tests 4-5 get key `custom`.

- [ ] **Step 3: Rewrite register-decorator.ts**

Replace the body of `packages/class-validator/src/register-decorator.ts` (keep the file header comment and the `RegisterDecoratorOptions` interface unchanged) with:

```typescript
function lowerFirst(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function sameConstraints(a: any[] | undefined, b: any[]): boolean {
  const left = a || [];
  return left.length === b.length && left.every((item, i) => item === b[i]);
}

export function registerDecorator(args: RegisterDecoratorOptions): void {
  const { validator } = args;
  const constraints = args.constraints || [];

  // addInitializer runs on every instance construction; guard against
  // re-registering the same logical constraint on repeated instantiation —
  // without silently swallowing genuinely different registrations.
  const existingConstraints = getValidationMetadata(args.target).properties.get(
    args.propertyName,
  )?.constraints;
  if (existingConstraints) {
    const isDuplicate = existingConstraints.some((existing) => {
      if (typeof validator === 'function') {
        return (
          existing.type === 'custom' &&
          existing.value?.constraintClass === validator &&
          sameConstraints(existing.value?.constraints, constraints)
        );
      }
      return (
        existing.type === 'validateBy' &&
        existing.value?.name === (args.name || 'customValidation') &&
        existing.value?.validatorSource === validator.validate.toString() &&
        sameConstraints(existing.value?.constraints, constraints)
      );
    });
    if (isDuplicate) return;
  }

  if (typeof validator === 'function') {
    // ValidatorConstraint class → compiled via the 'custom' constraint path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'custom',
      value: {
        constraintClass: validator,
        name:
          args.name || (validator as any).__validatorMetadata?.name || lowerFirst(validator.name),
        constraints,
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
    });
  } else {
    // Inline validator object → compiled via the 'validateBy' path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'validateBy',
      value: {
        name: args.name || 'customValidation',
        validator: (value: any, validationArgs?: ValidationArguments) =>
          validator.validate(value, validationArgs),
        defaultMessage: validator.defaultMessage?.bind(validator),
        validatorSource: validator.validate.toString(),
        constraints,
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
    });
  }
}
```

- [ ] **Step 4: Give @Validate a name**

In the `Validate` block produced by Task 3 (`packages/class-validator/src/decorators/custom.ts`), extend the hoisted constraint's `value`:

```typescript
      value: {
        constraintClass,
        name:
          (constraintClass as any).__validatorMetadata?.name ||
          constraintClass.name.charAt(0).toLowerCase() + constraintClass.name.slice(1),
        constraints: constraints || [],
      },
```

- [ ] **Step 5: Emit the named key in the compiler (sync + async + order map)**

In `packages/class-validator/src/engine/compiler.ts`:

(a) Sync custom branch (~line 1646): before the `lines.push` block, compute the key and use it in all four `.custom =` emissions:

```typescript
const customKey = sanitizeValidatorName((constraint.value && constraint.value.name) || 'custom');
```

then replace every `${errorsName}.custom =` in this branch with `${errorsName}.${customKey} =` (3 occurrences sync).

(b) Async custom branch (~line 1820-1846): same — compute `customKey` the same way and replace the 3 `${errorsName}.custom =` occurrences.

(c) stopAtFirstError order map (line 592-594): replace

```typescript
if (c.type === 'custom') return 'custom';
```

with

```typescript
if (c.type === 'custom') return sanitizeValidatorName((c.value && c.value.name) || 'custom');
```

- [ ] **Step 6: Run new test, then the whole package suite; update stale `custom`-key expectations**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/register-decorator-fidelity.test.ts` → PASS.
Run: `pnpm exec vitest run packages/class-validator` — any existing test asserting the `custom` key for class-based validators will fail; find them with `grep -rn "constraints.custom\|'custom'" packages/class-validator/tests/` and update those expectations to the new named keys (each new expectation must match the registered/derived name of the constraint class used in that test).

- [ ] **Step 7: Update compat docs (EN + RU)**

In `docs/compat-class-validator.md` (and mirror in `docs-ru/compat-class-validator.md`): update the `registerDecorator` / `@Validate` rows to state that error keys use the registered name (`@ValidatorConstraint({name})` → explicit `name` arg → lower-cased class name), matching upstream; note that inline validators without a name still use `customValidation`.

- [ ] **Step 8: Commit**

```bash
git add packages/class-validator/src packages/class-validator/tests docs/compat-class-validator.md docs-ru/compat-class-validator.md
git commit -m "fix(class-validator): registerDecorator - enforce all registrations, report class validators under their registered name"
```

---

### Task 5: shared metadata key + changeset for validator fixes

**Files:**

- Modify: `packages/class-validator/src/engine/metadata.ts:15`
- Test: extend `packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts`
- Create: `.changeset/review-fixes-class-validator.md`

**Interfaces:**

- Produces: `VALIDATION_METADATA` becomes `Symbol.for('om-data-mapper:validation-metadata')` — two installed copies of the package see each other's metadata instead of silently validating nothing.

- [ ] **Step 1: Write the failing test** (append to constraint-dedup.test.ts)

```typescript
it('stores metadata under the global symbol registry key (survives duplicate installs)', () => {
  class Dto {
    @Matches(/^a$/)
    s!: string;
  }
  new Dto();
  expect((Dto as any)[Symbol.for('om-data-mapper:validation-metadata')]).toBeDefined();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts`
Expected: the new test FAILS (module-local Symbol ≠ registry Symbol).

- [ ] **Step 3: Switch to the symbol registry**

```typescript
const VALIDATION_METADATA = Symbol.for('om-data-mapper:validation-metadata');
```

- [ ] **Step 4: Run test + package suite** → PASS.

- [ ] **Step 5: Write the changeset** — create `.changeset/review-fixes-class-validator.md`:

```markdown
---
'@om-data-mapper/class-validator': patch
---

Review fixes: `stopAtFirstError` no longer drops all errors when a validator is named after an `Object.prototype` member; null-prototype inputs return the no-metadata result instead of throwing; constraint metadata no longer grows on every instantiation for `@Matches`/`@Validate`/`@ValidateBy`; `registerDecorator` enforces every registration (second unnamed inline validators and re-registered classes with new constraints are no longer silently dropped); class-based custom validators report errors under their registered name (upstream-compatible) instead of `custom`; validation metadata is keyed via `Symbol.for` so duplicate package copies interoperate.
```

- [ ] **Step 6: Commit**

```bash
git add packages/class-validator/src/engine/metadata.ts packages/class-validator/tests/unit/compat/class-validator/constraint-dedup.test.ts .changeset/review-fixes-class-validator.md
git commit -m "fix(class-validator): key metadata via Symbol.for; add changeset for review fixes"
```

---

### Task 6: enableImplicitConversion must coerce array elements

**Files:**

- Modify: `packages/class-transformer/src/functions.ts:325-346` (`transformValue`)
- Test: extend `packages/class-transformer/tests/unit/compat/implicit-conversion.test.ts`
- Create: `.changeset/review-fixes-class-transformer.md`

**Interfaces:**

- Consumes: `plainToInstance`, `Type` from `../../../src` (existing test file's imports).
- Produces: no API change; array-valued `@Type(() => Number|String|Boolean|Date)` properties coerce per element under `enableImplicitConversion`.

- [ ] **Step 1: Write the failing tests** (append to implicit-conversion.test.ts)

```typescript
describe('array-valued properties', () => {
  class ArrayDto {
    @Type(() => Number)
    scores!: number[];
    @Type(() => Date)
    dates!: Date[];
  }

  it('coerces number arrays per element', () => {
    const dto = plainToInstance(
      ArrayDto,
      { scores: ['1', '2'], dates: [] },
      { enableImplicitConversion: true },
    );
    expect(dto.scores).toEqual([1, 2]);
  });

  it('coerces date arrays per element', () => {
    const dto = plainToInstance(
      ArrayDto,
      { scores: [], dates: ['2026-01-01'] },
      { enableImplicitConversion: true },
    );
    expect(dto.dates).toHaveLength(1);
    expect(dto.dates[0]).toBeInstanceOf(Date);
  });

  it('leaves arrays untouched without the flag', () => {
    const dto = plainToInstance(ArrayDto, { scores: ['1'], dates: [] });
    expect(dto.scores).toEqual(['1']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/class-transformer/tests/unit/compat/implicit-conversion.test.ts`
Expected: FAIL — `scores` is `NaN` (whole-array `Number(['1','2'])`).

- [ ] **Step 3: Restructure transformValue's type block**

Replace the `if (propertyMeta?.typeFunction && transformationType === 'plainToClass')` block in `packages/class-transformer/src/functions.ts` with:

```typescript
// Apply type transformation if exists
if (propertyMeta?.typeFunction && transformationType === 'plainToClass') {
  const TypeClass = propertyMeta.typeFunction();

  const isPrimitiveTarget =
    TypeClass === Number || TypeClass === String || TypeClass === Boolean || TypeClass === Date;
  const coercePrimitive = (input: any): any => {
    if (TypeClass === Number) return typeof input === 'number' ? input : Number(input);
    if (TypeClass === String) return typeof input === 'string' ? input : String(input);
    if (TypeClass === Boolean) return typeof input === 'boolean' ? input : Boolean(input);
    return input instanceof Date ? input : new Date(input as any);
  };

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (
        options.enableImplicitConversion &&
        isPrimitiveTarget &&
        item !== null &&
        item !== undefined
      ) {
        return coercePrimitive(item);
      }
      if (typeof item === 'object' && item !== null) {
        return transformPlainToClass(TypeClass as any, item, transformationType, options);
      }
      return item;
    });
  }

  if (
    options.enableImplicitConversion &&
    isPrimitiveTarget &&
    value !== null &&
    value !== undefined
  ) {
    return coercePrimitive(value);
  }

  if (typeof value === 'object' && value !== null) {
    return transformPlainToClass(TypeClass as any, value, transformationType, options);
  }
}
```

- [ ] **Step 4: Run tests** — new tests and the whole `pnpm exec vitest run packages/class-transformer` suite must pass.

- [ ] **Step 5: Document + changeset**

Update the `enableImplicitConversion` JSDoc in `packages/class-transformer/src/types.ts` to state array elements are coerced individually. Update the corresponding caveat in `docs/compat-class-transformer.md` + `docs-ru/compat-class-transformer.md` if it mentions whole-array coercion. Create `.changeset/review-fixes-class-transformer.md`:

```markdown
---
'@om-data-mapper/class-transformer': patch
---

`enableImplicitConversion` now coerces array-valued `@Type(() => Number|String|Boolean|Date)` properties per element (previously the whole array was passed to the constructor, yielding `NaN`/joined strings); `@TransformClassToPlain`/`@TransformClassToClass`/`@TransformPlainToClass` work under ESM (a literal `require` no longer survives into the ESM build).
```

(The second half of the changeset text is delivered by Task 7 — same package, one changeset.)

- [ ] **Step 6: Commit**

```bash
git add packages/class-transformer docs/compat-class-transformer.md docs-ru/compat-class-transformer.md .changeset/review-fixes-class-transformer.md
git commit -m "fix(class-transformer): enableImplicitConversion coerces array elements individually"
```

---

### Task 7: ESM-safe method decorators

**Files:**

- Modify: `packages/class-transformer/src/decorators.ts` (lines ~218-263: three `require('./functions')` sites + top-of-file import)
- Test: `packages/class-transformer/tests/unit/compat/transform-method-decorators.test.ts` (create)

**Interfaces:**

- Consumes: `classToPlain`, `classToClass`, `plainToClass` from `./functions` — verified acyclic: `functions.ts` imports only `./metadata` and `./types`, never `./decorators`, so a static import cannot create a cycle (the `// avoid circular dependency` comments are wrong).
- Produces: `build/esm/decorators.js` free of `require(`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  TransformClassToPlain,
  TransformClassToClass,
  TransformPlainToClass,
  Expose,
  Exclude,
} from '../../../src';

class UserDto {
  @Expose()
  name!: string;

  @Exclude()
  password!: string;
}

function makeUser(): UserDto {
  const u = new UserDto();
  u.name = 'ada';
  u.password = 'hunter2';
  return u;
}

class Service {
  @TransformClassToPlain()
  getUser() {
    return makeUser();
  }

  @TransformClassToClass()
  cloneUser() {
    return makeUser();
  }

  @TransformPlainToClass(UserDto)
  getPlain() {
    return { name: 'ada', password: 'hunter2' };
  }
}

describe('transform method decorators', () => {
  const service = new Service();

  it('@TransformClassToPlain converts the return value to a plain object', () => {
    const result = service.getUser();
    expect(result).not.toBeInstanceOf(UserDto);
    expect((result as any).name).toBe('ada');
    expect(result).not.toHaveProperty('password');
  });

  it('@TransformClassToClass deep-clones the return value', () => {
    const original = makeUser();
    const result = service.cloneUser();
    expect(result).toBeInstanceOf(UserDto);
    expect(result).not.toBe(original);
  });

  it('@TransformPlainToClass converts plain return values to instances', () => {
    const result = service.getPlain();
    expect(result).toBeInstanceOf(UserDto);
  });
});
```

These are the first tests ever invoking these decorators — adjust assertions only if actual `classToPlain` exclusion semantics differ (verify against `packages/class-transformer/tests/unit/compat/class-transformer.test.ts` expectations for `@Exclude`).

- [ ] **Step 2: Run to check current state**

Run: `pnpm exec vitest run packages/class-transformer/tests/unit/compat/transform-method-decorators.test.ts`
Expected: PASSES under vitest (CJS-transpiled `require` works there) — the failing case is the ESM build. Continue: the real red/green is Step 4's grep.

- [ ] **Step 3: Replace require with static imports**

At the top of `packages/class-transformer/src/decorators.ts`, add to the existing imports:

```typescript
import { classToPlain, classToClass, plainToClass } from './functions';
```

Then in the three method decorators, delete the `// Import ... dynamically to avoid circular dependency` comment and the `const { ... } = require('./functions');` line, calling the imported functions directly, e.g.:

```typescript
return function (this: any, ...args: any[]) {
  const result = target.call(this, ...args);
  return classToPlain(result, options);
};
```

(same shape for `classToClass(result, options)` and `plainToClass(classType, result, options)`).

- [ ] **Step 4: Verify the ESM build is require-free**

```bash
pnpm --filter @om-data-mapper/class-transformer run build
grep -n "require(" packages/class-transformer/build/esm/decorators.js
```

Expected: grep prints nothing (exit code 1). Before the fix it printed 3 hits — that's the red baseline; after, zero.

- [ ] **Step 5: Run suites** — `pnpm exec vitest run packages/class-transformer` and `pnpm run test:esm` must pass.

- [ ] **Step 6: Commit**

```bash
git add packages/class-transformer/src/decorators.ts packages/class-transformer/tests/unit/compat/transform-method-decorators.test.ts
git commit -m "fix(class-transformer): static imports in method decorators - require() broke the ESM build"
```

---

### Task 8: core codegen — escape every interpolated key and path

**Files:**

- Modify: `packages/core/src/decorators/core.ts` (`generateSafePropertyAccess` + every codegen emission site)
- Test: `packages/core/tests/unit/decorators/codegen-escaping.test.ts` (create)

**Interfaces:**

- Consumes: `Mapper`, `Map` from `../../../src/decorators` (same import as `decorators.test.ts`); mappers are exercised via `new TestMapper().transform(source)`.
- Produces: `generateSafePropertyAccess(path)` now returns a bracket-access chain **including the leading accessor**, e.g. `'a.b-c'` → `?.["a"]?.["b-c"]`, so call sites emit `source${safeSourcePath}`. All target/cache key emissions use `JSON.stringify`.

**Threat model:** `@Map()`/`@MapFrom()` source paths and decorated field names are interpolated verbatim into `new Function` source. A kebab-case key breaks compilation (SyntaxError takes down the mapper class); a quote-bearing key escapes the string literal and executes arbitrary code inside the compiled function. Keys come from the mapper author, not end-user data — this is hardening plus a real correctness bug for kebab-case APIs.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { Mapper, Map } from '../../../src/decorators';

describe('codegen escaping', () => {
  it('maps kebab-case source keys', () => {
    @Mapper()
    class HeaderMapper {
      @Map('content-type')
      contentType!: string;
    }
    const result = new HeaderMapper().transform({ 'content-type': 'application/json' } as any);
    expect(result.contentType).toBe('application/json');
  });

  it('maps nested kebab-case source paths', () => {
    @Mapper()
    class UserMapper {
      @Map('user-info.first-name')
      firstName!: string;
    }
    const result = new UserMapper().transform({
      'user-info': { 'first-name': 'Ada' },
    } as any);
    expect(result.firstName).toBe('Ada');
  });

  it('maps quoted (non-identifier) target field names', () => {
    @Mapper()
    class WeirdMapper {
      @Map('a')
      'weird-key'!: string;
    }
    const result = new WeirdMapper().transform({ a: 'ok' } as any);
    expect((result as any)['weird-key']).toBe('ok');
  });

  it('neutralizes quote-bearing keys instead of executing them', () => {
    const hostile = 'x"]; globalThis.__pwned = true; //';
    @Mapper()
    class HostileMapper {
      @Map(hostile)
      v!: string;
    }
    const result = new HostileMapper().transform({ [hostile]: 'ok' } as any);
    expect(result.v).toBe('ok');
    expect((globalThis as any).__pwned).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run packages/core/tests/unit/decorators/codegen-escaping.test.ts`
Expected: FAIL — kebab-case cases throw SyntaxError at first instantiation (or in safe mode swallow into wrong output — either way assertions fail).

- [ ] **Step 3: Rewrite the access generators**

In `packages/core/src/decorators/core.ts`, replace `generateSafePropertyAccess` (lines 19-30) with:

```typescript
/**
 * Generate safe nested property access code with optional chaining.
 * Emits bracket access with JSON-escaped keys so any key — kebab-case,
 * quotes, unicode — is data, never code: 'a.b-c' → '?.["a"]?.["b-c"]'.
 * The returned string INCLUDES the leading accessor: emit `source${...}`.
 */
function generateSafePropertyAccess(sourcePath: string): string {
  return sourcePath
    .split('.')
    .map((part) => `?.[${JSON.stringify(part)}]`)
    .join('');
}

/** Bracket accessor for a single literal key: 'k' → '["k"]'. */
function prop(key: string): string {
  return `[${JSON.stringify(key)}]`;
}

/** Cache-slot accessor: cacheKey('x', '__transformer') → '["x__transformer"]'. */
function cacheKey(key: string, suffix: string): string {
  return `[${JSON.stringify(`${key}${suffix}`)}]`;
}
```

- [ ] **Step 4: Rewrite every emission site**

Audit the whole file: `grep -n 'target\.\$\|source?\.\$\|\[.\${key}\|cache\[.__defValues' packages/core/src/decorators/core.ts`. Rewrite each **generated-code string** (template literals appended to `body`/`lines` that become `new Function` source):

- `target.${key}` → `target${prop(key)}`
- `source?.${safeSourcePath}` → `source${safeSourcePath}` (helper now carries the `?.[...]`)
- `cache['${key}__valueTransform']` → `cache${cacheKey(key, '__valueTransform')}` (same for `__transformer`, `__condition`, `__nestedMapper` and any other suffix found)
- `cache['__defValues']['${key}']` → `cache['__defValues']${prop(key)}`

Do NOT touch the runtime assignments (`cache[\`${key}\_\_transformer\`] = transformer;`etc.) — those execute in TypeScript at compile time and are already safe;`JSON.stringify`of the same plain key guarantees the generated lookups still match the runtime-populated slots. Apply the same treatment in`\_generatePathMappingCode`, `\_generateTransformCode`, `\_generateNestedMapperCode`, and any other `\_generate\*` method the grep surfaces. After the rewrite the audit grep must return zero raw-interpolation hits (`target\.\$`and`source?\.\$` in particular).

- [ ] **Step 5: Run tests**

Run: `pnpm exec vitest run packages/core/tests/unit/decorators/codegen-escaping.test.ts` → PASS.
Run: `pnpm exec vitest run packages/core` → all pass (identifier-keyed mappers behave identically through bracket access).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/decorators/core.ts packages/core/tests/unit/decorators/codegen-escaping.test.ts
git commit -m "fix(core): JSON-escape all keys and paths in generated mapper code - kebab-case keys compiled to SyntaxError, quotes injected code"
```

---

### Task 9: purge fabricated performance figures from core JSDoc

**Files:**

- Modify: `packages/core/src/index.ts` (lines 5, 10, 85), `packages/core/src/decorators/core.ts` (line 38)

- [ ] **Step 1: Locate every remaining figure**

Run: `grep -rn "42.7x\|17.28x\|20,000\|60,000\|474%" packages/*/src`
Expected today: 4 hits (index.ts:5, index.ts:10, index.ts:85, decorators/core.ts:38).

- [ ] **Step 2: Rewrite honestly**

- `index.ts:5`: replace `Delivers up to **42.7x better performance** than class-transformer` with `Compiles mappings to specialized functions instead of interpreting metadata per call`.
- `index.ts:10`: replace the `**🔥 Blazing Fast**: 17.28x faster than class-transformer through JIT compilation` bullet with `**🔥 JIT-compiled**: transformations compile once to specialized functions and are reused`.
- `index.ts:85`: replace `// Your existing code works exactly the same, but 17.28x faster! 🚀` with `// Your existing code works the same, backed by compiled transforms`.
- `decorators/core.ts:38`: replace `transformations, delivering up to 42.7x better performance than class-transformer.` with `transformations without per-call metadata interpretation.`

- [ ] **Step 3: Verify** — the Step 1 grep now returns nothing; `pnpm exec vitest run packages/core` still green (JSDoc only).

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/index.ts packages/core/src/decorators/core.ts
git commit -m "docs(core): purge fabricated performance figures from JSDoc"
```

---

### Task 10: ship LICENSE in all four tarballs

**Files:**

- Create: `packages/core/LICENSE`, `packages/class-validator/LICENSE`, `packages/class-transformer/LICENSE`, `packages/om-data-mapper/LICENSE` (copies of root `LICENSE`)

- [ ] **Step 1: Copy the root license**

```bash
cp LICENSE packages/core/LICENSE
cp LICENSE packages/class-validator/LICENSE
cp LICENSE packages/class-transformer/LICENSE
cp LICENSE packages/om-data-mapper/LICENSE
```

- [ ] **Step 2: Verify each tarball would include it**

```bash
pnpm -r --filter './packages/*' exec npm pack --dry-run 2>&1 | grep -c "LICENSE"
```

Expected: 4 (one LICENSE line per package listing). If a package build is required for pack to succeed, run `pnpm run build` first.

- [ ] **Step 3: Commit**

```bash
git add packages/core/LICENSE packages/class-validator/LICENSE packages/class-transformer/LICENSE packages/om-data-mapper/LICENSE
git commit -m "fix(packaging): ship LICENSE in every published tarball - files declared it but no file existed"
```

---

### Task 11: tests must import what consumers can import

**Files:**

- Modify: `packages/om-data-mapper/tests/memory-leak.test.ts:20`, `packages/om-data-mapper/tests/regression.test.ts:20`, `packages/om-data-mapper/tests/real-world-scenarios.test.ts` (same pattern)

**Interfaces:**

- Consumes: `packages/class-validator/src/index.ts` does `export * from './decorators'`, so every decorator is importable from the package **root** — the `/decorators` subpath is not in the exports map and only resolves through the vitest alias.

- [ ] **Step 1: Reproduce the honest failure mode**

Run: `node -e "import('@om-data-mapper/class-validator/decorators')" 2>&1 | head -3` from `packages/om-data-mapper` — expect `ERR_PACKAGE_PATH_NOT_EXPORTED`. This is what real consumers get for the path the tests certify.

- [ ] **Step 2: Point the imports at the package root**

In each of the three test files, change:

```typescript
} from '@om-data-mapper/class-validator/decorators';
```

to:

```typescript
} from '@om-data-mapper/class-validator';
```

(keep the imported name list unchanged — the root re-exports all decorators).

- [ ] **Step 3: Sweep for any other unexported subpath**

Run: `grep -rn "@om-data-mapper/[a-z-]*/" packages/*/tests packages/*/test examples benchmarks --include="*.ts" --include="*.mjs" | grep -v node_modules`
Every hit must be a subpath actually present in that package's `exports` map (check `packages/*/package.json`); fix any that isn't the same way.

- [ ] **Step 4: Run the affected suites**

Run: `pnpm exec vitest run packages/om-data-mapper`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/om-data-mapper/tests
git commit -m "test(om-data-mapper): import via real exports map, not vitest-alias-only subpaths"
```

---

### Task 12: retire the unreachable legacy Mapper export; honest ESM simulation

**Files:**

- Modify: `packages/core/src/index.ts` (remove `export * from './core/Mapper'`)
- Modify: `packages/om-data-mapper/test/esm-post-install-simulation.test.mjs` (full rewrite of scenarios 1-7)
- Modify: `docs/migration-v4-to-v5.md`, `docs-ru/migration-v4-to-v5.md`
- Create: `.changeset/remove-unreachable-legacy-mapper.md`

**Decision (recommended, needs no code fork):** `export { Mapper } from './decorators'` already shadows `export * from './core/Mapper'` under ES module semantics, so `Mapper.create` has been unreachable from the published surface the whole time — CI-green tests reached it only through raw `node_modules` file paths. Remove the dead star re-export (the class stays in the codebase: `core.ts:14` imports it as `BaseMapper`, the engine of the decorator API, and `packages/core/tests/unit/core/*.test.ts` keep testing it via direct src imports). `packages/core/src/core/Mapper.ts` exports only the `Mapper` class (verified: single `export` at line 24), so nothing else is lost.

- [ ] **Step 1: Remove the shadowed export**

In `packages/core/src/index.ts` replace:

```typescript
// Legacy API (deprecated but maintained for backward compatibility)
export * from './core/interfaces';
export * from './core/Mapper';
```

with:

```typescript
// Legacy interfaces (kept for typing compatibility). The legacy `Mapper.create`
// class API is intentionally NOT re-exported: the decorator API's `Mapper`
// shadowed it under ES module semantics, so it was never reachable from the
// published surface — see docs/migration-v4-to-v5.md.
export * from './core/interfaces';
```

- [ ] **Step 2: Rebuild and verify the public surface is unchanged**

```bash
pnpm run build
node -e "import('./packages/core/build/esm/index.js').then(m => { console.log(typeof m.Mapper, typeof m.Mapper.create); })"
```

Expected: `function undefined` — same as before the change (the decorator `Mapper` already won); nothing consumers could reach was removed.

- [ ] **Step 3: Rewrite the ESM post-install simulation honestly**

In `packages/om-data-mapper/test/esm-post-install-simulation.test.mjs`:

- Delete the `legacyMapperPath` construction and the header apology about bypassing the exports map.
- Every scenario must import **only** via package names resolved through real exports maps. Node self-reference (`import('om-data-mapper')`) works because the package declares `exports`. Rewrite scenarios 1-7 (legacy `Mapper.create`) to equivalent decorator-API scenarios, e.g.:

```javascript
await asyncTest('Decorator API resolves through the exports map', async () => {
  const { Mapper, Map, createMapper } = await import('om-data-mapper');
  assert.strictEqual(typeof Mapper, 'function');

  @Mapper()
  class UserMapper {
    @Map('name')
    fullName;
  }
  const result = new UserMapper().transform({ name: 'Ada' });
  assert.strictEqual(result.fullName, 'Ada');
});
```

Caveat: raw `.mjs` cannot use decorators — if the existing file is plain JS (it is), express the same scenarios through the compat subpaths and helper functions that need no decorator syntax (`plainToInstance` from `om-data-mapper/class-transformer-compat`, `validateSync` from `om-data-mapper/class-validator-compat`, plus asserting `Mapper`/`createMapper` resolve as functions from the root). Keep scenarios 8-9 (already exports-map-based) as they are.

- Update the final success message to claim only what is tested.

- [ ] **Step 4: Run it**

Run: `pnpm run test:esm`
Expected: all scenarios pass through real resolution.

- [ ] **Step 5: Document the removal**

`docs/migration-v4-to-v5.md` (+ RU mirror): add a "Legacy `Mapper.create`" section: the class API is not part of v5's public surface (and was already unreachable in the v4 dual-export layout); migrate to `@Mapper()` + `@Map()` or `createMapper`. Create `.changeset/remove-unreachable-legacy-mapper.md`:

```markdown
---
'@om-data-mapper/core': patch
'om-data-mapper': patch
---

Remove the dead `export * from './core/Mapper'` re-export: the decorator API's `Mapper` already shadowed the legacy class under ES module semantics, so `Mapper.create` was never reachable from the published surface. The ESM post-install simulation now exercises only imports that resolve through the real exports maps.
```

- [ ] **Step 6: Full suite + commit**

Run: `pnpm test` → 549+ tests green (legacy-class unit tests import from src directly and are unaffected).

```bash
git add packages/core/src/index.ts packages/om-data-mapper/test/esm-post-install-simulation.test.mjs docs/migration-v4-to-v5.md docs-ru/migration-v4-to-v5.md .changeset/remove-unreachable-legacy-mapper.md
git commit -m "fix(core): drop unreachable legacy Mapper re-export; make ESM simulation use real package resolution"
```

---

### Task 13: typecheck benchmarks and examples in CI

**Files:**

- Modify: `benchmarks/compat/transformation.bench.ts:91-92`
- Modify: `benchmarks/package.json` (add `typecheck` script)
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Reproduce the red typecheck**

Run: `pnpm --filter benchmarks exec tsc --noEmit`
Expected: 4× TS2339 (`Property 'constructor' does not exist on type 'never'`) in `compat/transformation.bench.ts:104/112/119/127`.

- [ ] **Step 2: Fix the inference**

In `benchmarks/compat/transformation.bench.ts` lines 91-92, annotate the honesty-guard instances (the overloads infer `never` for these fixtures):

```typescript
const omInstance = omPlainToInstance(OmUser, fixture) as OmUser;
const ctInstance = ctPlainToInstance(CtUser, fixture) as CtUser;
```

Re-run `pnpm --filter benchmarks exec tsc --noEmit` → clean. Run `pnpm bench:compat` once to confirm the honesty guards still pass at runtime.

- [ ] **Step 3: Add the typecheck script**

In `benchmarks/package.json` scripts:

```json
    "typecheck": "tsc --noEmit",
```

(`examples/package.json` already has one.)

- [ ] **Step 4: Wire both into CI**

In `.github/workflows/ci.yml`, after the `- run: pnpm run build` step add:

```yaml
- run: pnpm --filter examples run typecheck
- run: pnpm --filter benchmarks run typecheck
```

(after build, because both typecheck against built package `dist`/`build` outputs).

- [ ] **Step 5: Verify locally**

```bash
pnpm run build
pnpm --filter examples run typecheck
pnpm --filter benchmarks run typecheck
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add benchmarks/compat/transformation.bench.ts benchmarks/package.json .github/workflows/ci.yml
git commit -m "ci: typecheck examples and benchmarks - the exact rot class that let v4 examples decay unnoticed"
```

---

## Final verification (after all tasks)

- [ ] `pnpm run build` — 4 packages clean
- [ ] `pnpm lint` && `pnpm exec prettier --check .` — clean
- [ ] `pnpm test` — full suite green (549 baseline + new tests from Tasks 1-8)
- [ ] `pnpm run test:esm` — green with the rewritten simulation
- [ ] `pnpm bench` — honesty guards still pass
- [ ] `grep -rn "42.7x\|17.28x" packages/*/src docs README.md` — empty
- [ ] Push and confirm CI green, then update PR #37 description: add a "Post-review fixes" section listing the 20 findings and their fixes.

## Deferred (explicitly out of scope, tracked for Phase 5 / later)

- **Sync/async codegen duplication** (whitelist + stopAtFirstError machinery duplicated verbatim across the two generators with hand-maintained error-key coupling): real maintainability debt, but a risky refactor to land alongside 13 behavior fixes. Do it as its own PR with the (now larger) test suite as the safety net.
- **ci.yml matrix redundancy** (lint/format/coverage run on all 3 Node versions, only node 22's coverage is used): harmless; optimize when CI time hurts.
- **release.yml re-arm** (`publish:` + `NPM_TOKEN`), npm org registration, and pre-publish integrity gates — Phase 5 by design.
- **`@Matches` function-form messages** still receive the internal `{pattern, modifiers}` shape in `args.constraints` (parked since Phase 2).
- **`always` ValidatorOption** — documented ❌; implementing it is a feature, not a review fix.
- **Two RU guides with partially-translated prose** — future docs pass.
