# Phase 2 — Compat Honesty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the class-validator and class-transformer compat layers honest: every declared option either works or is removed, with a documented compat table.

**Architecture:** The class-validator engine JIT-compiles per-class validators (`new Function`) from Symbol-stored metadata. Options arrive at runtime as `opts` inside the generated code, so new options are implemented as generated runtime checks (like `opts.groups` today) plus small changes in `engine/validator.ts` for object-level options. class-transformer is a plain (non-JIT) recursive transformer; `enableImplicitConversion` lands in its `transformValue` helper.

**Tech Stack:** TypeScript, TC39 Stage 3 decorators (NO `reflect-metadata`, NO `experimentalDecorators`), vitest, pnpm workspaces, changesets, prettier.

**Spec:** `docs/superpowers/specs/2026-08-24-monorepo-v5-design.md` (Phase 2 section)

## Global Constraints

- Run everything from repo root `/Users/alexandermelnik/tech-pioneer/data-mapper/.claude/worktrees/monorepo-v5` (git worktree — do not cd out).
- TC39 Stage 3 decorators only. Metadata is attached in `context.addInitializer`, i.e. **a class instance must be created before its metadata exists**. Tests must `new Dto()` (or assign fields) before validating.
- Baseline: `cd packages/class-validator && pnpm test` → 307 passed; full repo suite 518 passed. No existing test may break.
- Package tests run with `pnpm --filter @om-data-mapper/class-validator test` / `pnpm --filter @om-data-mapper/class-transformer test`. Single file: `pnpm --filter @om-data-mapper/class-validator exec vitest run tests/unit/compat/class-validator/<file>.test.ts`.
- Formatting is a CI gate: run `pnpm exec prettier --write <changed files>` before every commit.
- Commit after each task; message style follows repo history (`feat:`, `fix:`, `test:`, `docs:`).
- Key files: `packages/class-validator/src/engine/compiler.ts` (codegen, 1733 lines), `packages/class-validator/src/engine/validator.ts` (validate/validateSync), `packages/class-validator/src/types.ts`, `packages/class-validator/src/index.ts`, `packages/class-transformer/src/{types.ts,functions.ts}`.
- In generated code these identifiers are in scope: `object`, `options`, `opts`, `metadata`, `errors`, `getValidationMetadata`, `hasValidationMetadata`, `compileValidator`, `getValidatorInstance` (async adds `compileAsyncValidator`). Per-property blocks additionally have `value`, `propertyErrors`, `nestedErrors`.
- The sync codegen lives in `generateValidationCode`/`generatePropertyValidation`/`generateConstraintCheck`; the async twins are `generateAsyncValidationCode`/`generateAsyncPropertyValidation`/`generateAsyncConstraintCheck`. **Every behavior change must be made in both sync and async paths and tested through both `validateSync` and `validate`.**

---

### Task 1: Function-form `message`

`getErrorMessage` (compiler.ts:1711) returns the constraint message only when it is a string; function messages silently fall back to the default. Fix: emit a runtime expression that calls the function with `ValidationArguments`.

**Files:**

- Modify: `packages/class-validator/src/engine/compiler.ts`
- Test: `packages/class-validator/tests/unit/compat/class-validator/message-function.test.ts` (create)

**Interfaces:**

- Consumes: `ValidationConstraint.message?: string | ((args: ValidationArguments) => string)` (already typed in `types.ts`).
- Produces: internal helper `emitMessage(constraint, constraintIndex, propertyName, valueName, defaultMessage): string` returning a **JS expression string** (either a JSON string literal or a runtime call). All ~80 `JSON.stringify(getErrorMessage(...))` call sites switch to it.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/class-validator/tests/unit/compat/class-validator/message-function.test.ts
import { describe, it, expect } from 'vitest';
import { IsString, MinLength, validate, validateSync } from '../../../../src';
import type { ValidationArguments } from '../../../../src';

describe('function-form message', () => {
  it('calls the message function with ValidationArguments (sync)', () => {
    class Dto {
      @IsString({
        message: (args: ValidationArguments) =>
          `${args.property} of ${args.targetName} got ${args.value}`,
      })
      name: any = 42;
    }
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints!.isString).toBe('name of Dto got 42');
  });

  it('calls the message function (async validate)', async () => {
    class Dto {
      @MinLength(5, { message: (args: ValidationArguments) => `too short: ${args.value}` })
      name: any = 'ab';
    }
    const errors = await validate(new Dto());
    expect(errors[0].constraints!.minLength).toBe('too short: ab');
  });

  it('string messages still work', () => {
    class Dto {
      @IsString({ message: 'nope' })
      name: any = 1;
    }
    expect(validateSync(new Dto())[0].constraints!.isString).toBe('nope');
  });
});
```

Note: check how existing tests import (`packages/class-validator/tests/unit/compat/class-validator/basic-validation.test.ts`) and copy their import path style exactly.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @om-data-mapper/class-validator exec vitest run tests/unit/compat/class-validator/message-function.test.ts`
Expected: FAIL — message is the default `'must be a string'`, not the function result.

- [ ] **Step 3: Implement `emitMessage` and switch call sites**

Add next to `getErrorMessage` in compiler.ts:

```typescript
/**
 * Emit a JS expression (as a string) for a constraint's error message.
 * String messages are inlined as literals; function messages are called
 * at runtime with ValidationArguments looked up from `metadata`.
 */
function emitMessage(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  defaultMessage: string,
): string {
  if (typeof constraint.message === 'function') {
    const safeProp = JSON.stringify(propertyName);
    return (
      `(metadata.properties.get(${safeProp}).constraints[${constraintIndex}].message({ ` +
      `value: ${valueName}, ` +
      `constraints: [metadata.properties.get(${safeProp}).constraints[${constraintIndex}].value], ` +
      `targetName: object && object.constructor ? object.constructor.name : '', ` +
      `object: object, ` +
      `property: ${safeProp} }))`
    );
  }
  return JSON.stringify(getErrorMessage(constraint, defaultMessage));
}
```

Then in `generateConstraintCheck` replace **every** occurrence of the pattern
`${JSON.stringify(getErrorMessage(constraint, <X>))}` with
`${emitMessage(constraint, constraintIndex, propertyName, valueName, <X>)}`.
This is mechanical — do it with a global regex replace (e.g. Edit with `replace_all` on the exact substring `JSON.stringify(getErrorMessage(constraint, ` → `emitMessage(constraint, constraintIndex, propertyName, valueName, `, then fix the matching closing parens: the old pattern ends `))};` and the new call needs the same arity — verify with `pnpm --filter @om-data-mapper/class-validator exec tsc --noEmit` or the package build). The `custom`/`validateBy` branches (both sync at lines ~1488-1551 and async at ~1601-1706) keep their `defaultMessage` logic but must prefer an explicit constraint message: where they currently compute `const errorMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'))`, use `const errorMsg = emitMessage(constraint, constraintIndex, propertyName, valueName, 'validation failed')` and change the runtime fallback chain to: explicit `constraint.message` (string or function, via the emitted expression) → validator `defaultMessage` → default string. Concretely, generate: `if (constraintHasExplicitMessage) { errors.X = <emitted expr>; } else if (validatorInstance.defaultMessage) { ... } else { errors.X = <default literal>; }` where `constraintHasExplicitMessage` is decided at codegen time from `constraint.message != null`.

`generateAsyncConstraintCheck` delegates built-ins to `generateConstraintCheck`, so built-ins need no extra async work — only the custom/validateBy branches listed above.

- [ ] **Step 4: Run the new test + full package suite**

Run: `pnpm --filter @om-data-mapper/class-validator test`
Expected: 307 + 3 new, all PASS.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator/src/engine/compiler.ts packages/class-validator/tests/unit/compat/class-validator/message-function.test.ts
git add -A && git commit -m "feat(class-validator): support function-form message in compat layer"
```

---

### Task 2: `skipMissingProperties` / `skipNullProperties` / `skipUndefinedProperties`

**Files:**

- Modify: `packages/class-validator/src/engine/compiler.ts` (`generatePropertyValidation` and `generateAsyncPropertyValidation`)
- Test: `packages/class-validator/tests/unit/compat/class-validator/validator-options.test.ts` (create)

**Interfaces:**

- Consumes: `opts` object in generated code; `ValidatorOptions.skip*` fields already declared in types.ts.
- Produces: generated per-property guard variable `skipProp`; `@IsDefined` (constraint type `'isDefined'`) is exempt — it fires even when skipped (class-validator semantics).

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/class-validator/tests/unit/compat/class-validator/validator-options.test.ts
import { describe, it, expect } from 'vitest';
import { IsString, IsDefined, validate, validateSync } from '../../../../src';

describe('skip* options', () => {
  class Dto {
    @IsString()
    a: any;
    @IsString()
    b: any = null;
    @IsString()
    c: any = 'ok';
  }

  it('default: undefined and null both fail', () => {
    expect(validateSync(new Dto())).toHaveLength(2);
  });

  it('skipUndefinedProperties skips only undefined', () => {
    const errors = validateSync(new Dto(), { skipUndefinedProperties: true });
    expect(errors.map((e) => e.property)).toEqual(['b']);
  });

  it('skipNullProperties skips only null', () => {
    const errors = validateSync(new Dto(), { skipNullProperties: true });
    expect(errors.map((e) => e.property)).toEqual(['a']);
  });

  it('skipMissingProperties skips both', async () => {
    expect(validateSync(new Dto(), { skipMissingProperties: true })).toHaveLength(0);
    expect(await validate(new Dto(), { skipMissingProperties: true })).toHaveLength(0);
  });

  it('IsDefined ignores skipMissingProperties', () => {
    class Strict {
      @IsDefined()
      x: any;
    }
    const errors = validateSync(new Strict(), { skipMissingProperties: true });
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isDefined');
  });
});
```

If `IsDefined` is not exported from the package index, check `packages/class-validator/src/decorators/common.ts` for its actual name/export before writing the test.

- [ ] **Step 2: Run to verify failures**

Run: `pnpm --filter @om-data-mapper/class-validator exec vitest run tests/unit/compat/class-validator/validator-options.test.ts`
Expected: the three skip tests FAIL (options are currently no-ops → 2 errors returned each time).

- [ ] **Step 3: Implement in codegen**

In `generatePropertyValidation`, right after `const value = object[...]` / `propertyErrors` / `nestedErrors` declarations, emit:

```javascript
const skipProp =
  (opts.skipUndefinedProperties && value === undefined) ||
  (opts.skipNullProperties && value === null) ||
  (opts.skipMissingProperties && (value === undefined || value === null));
```

Then wrap each generated constraint check in `if (!skipProp) { ... }` **except** constraints with `constraint.type === 'isDefined'`, which are emitted unwrapped. Implement by branching at codegen time:

```typescript
const check = generateConstraintCheck(constraint, i, propertyName, 'value', 'propertyErrors', ...);
if (constraint.type === 'isDefined') {
  lines.push(check);
} else {
  lines.push('  if (!skipProp) {');
  lines.push(check);
  lines.push('  }');
}
```

(The existing groups-wrapping stays; nest the skip guard around the group-guarded block, keeping current behavior for groups.) Also wrap the nested-validation block (`if (metadata.isNested)`) in the same `if (!skipProp)` guard — a skipped null/undefined value already short-circuits, so this is belt-and-braces, but keeps semantics obvious. Mirror the identical change in `generateAsyncPropertyValidation` (same variable, same exemption).

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @om-data-mapper/class-validator test`
Expected: all PASS (312 total).

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator/src
git add -A && git commit -m "feat(class-validator): implement skipMissingProperties/skipNullProperties/skipUndefinedProperties"
```

---

### Task 3: `stopAtFirstError`

**Files:**

- Modify: `packages/class-validator/src/engine/compiler.ts` (both property generators)
- Test: append to `packages/class-validator/tests/unit/compat/class-validator/validator-options.test.ts`

**Interfaces:**

- Consumes: `propertyErrors` object in generated code; `skipProp` guard from Task 2.
- Produces: per-property semantics — when `opts.stopAtFirstError` is true, at most one entry in each error's `constraints`.

- [ ] **Step 1: Write the failing test**

```typescript
import { MinLength, IsUppercase } from '../../../../src'; // merge into existing import line

describe('stopAtFirstError', () => {
  class Dto {
    @IsUppercase()
    @MinLength(5)
    name: any = 'ab';
  }

  it('default: all failing constraints reported', () => {
    const errors = validateSync(new Dto());
    expect(Object.keys(errors[0].constraints!)).toHaveLength(2);
  });

  it('stopAtFirstError: only the first failure reported', async () => {
    const errors = validateSync(new Dto(), { stopAtFirstError: true });
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toHaveLength(1);
    const asyncErrors = await validate(new Dto(), { stopAtFirstError: true });
    expect(Object.keys(asyncErrors[0].constraints!)).toHaveLength(1);
  });
});
```

Verify `IsUppercase` export name in `packages/class-validator/src/decorators/string.ts` first; if a different pair of decorators is easier (both must fail on the same value), use that pair — e.g. `@Contains('xx')` + `@MinLength(5)` on `'ab'`.

- [ ] **Step 2: Run to verify failure**

Expected: second test FAILS with 2 constraint keys.

- [ ] **Step 3: Implement**

In both property generators, wrap each constraint check (including `isDefined` ones — upstream stops those too, the skip-exemption is orthogonal) in:

```javascript
if (!(opts.stopAtFirstError && Object.keys(propertyErrors).length > 0)) { <check> }
```

Emit this guard at codegen time around the same block where Task 2 added `if (!skipProp)` — order: `if (!skipProp) { if (!(opts.stopAtFirstError && ...)) { <check> } }`.

- [ ] **Step 4: Run tests** — `pnpm --filter @om-data-mapper/class-validator test`, all PASS.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator/src packages/class-validator/tests
git add -A && git commit -m "feat(class-validator): implement stopAtFirstError"
```

---

### Task 4: `whitelist` + `forbidNonWhitelisted`

**Files:**

- Modify: `packages/class-validator/src/engine/compiler.ts` (`generateValidationCode` and `generateAsyncValidationCode` epilogues)
- Test: append to `validator-options.test.ts`

**Interfaces:**

- Consumes: `metadata.properties` keys at **codegen** time (embedded as a JSON array); `errors` array in generated code.
- Produces: class-validator semantics — `whitelist: true` deletes unknown own properties from the validated object (mutation!); `whitelist: true` + `forbidNonWhitelisted: true` instead pushes an error per unknown property with `constraints: { whitelistValidation: 'property <name> should not exist' }`. Properties with only `@Allow()` count as known (they are in the metadata map).

- [ ] **Step 1: Write the failing tests**

```typescript
import { Allow } from '../../../../src'; // merge into existing import

describe('whitelist / forbidNonWhitelisted', () => {
  class Dto {
    @IsString()
    name: any = 'ok';
    @Allow()
    extraAllowed: any = 1;
  }

  it('whitelist strips undecorated properties', () => {
    const dto: any = new Dto();
    dto.rogue = 'x';
    const errors = validateSync(dto, { whitelist: true });
    expect(errors).toHaveLength(0);
    expect('rogue' in dto).toBe(false);
    expect(dto.extraAllowed).toBe(1); // @Allow keeps it
  });

  it('forbidNonWhitelisted errors instead of stripping', async () => {
    const dto: any = new Dto();
    dto.rogue = 'x';
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('rogue');
    expect(errors[0].constraints).toEqual({
      whitelistValidation: 'property rogue should not exist',
    });
    expect((dto as any).rogue).toBe('x'); // not stripped

    const dto2: any = new Dto();
    dto2.rogue = 'x';
    const asyncErrors = await validate(dto2, { whitelist: true, forbidNonWhitelisted: true });
    expect(asyncErrors).toHaveLength(1);
  });

  it('without whitelist nothing happens to unknown props', () => {
    const dto: any = new Dto();
    dto.rogue = 'x';
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.rogue).toBe('x');
  });
});
```

- [ ] **Step 2: Run to verify failures** — first two FAIL.

- [ ] **Step 3: Implement**

In `generateValidationCode`, before `lines.push('return errors;')`, embed the known keys and emit the epilogue:

```typescript
const knownKeys = JSON.stringify([...metadata.properties.keys()].map(String));
lines.push('// whitelist / forbidNonWhitelisted');
lines.push('if (opts.whitelist) {');
lines.push(`  const knownProps = new Set(${knownKeys});`);
lines.push('  for (const key of Object.keys(object)) {');
lines.push('    if (!knownProps.has(key)) {');
lines.push('      if (opts.forbidNonWhitelisted) {');
lines.push('        errors.push({');
lines.push('          property: key,');
lines.push('          value: object[key],');
lines.push('          target: object,');
lines.push(
  "          constraints: { whitelistValidation: 'property ' + key + ' should not exist' },",
);
lines.push('        });');
lines.push('      } else {');
lines.push('        delete object[key];');
lines.push('      }');
lines.push('    }');
lines.push('  }');
lines.push('}');
```

In `generateAsyncValidationCode`, add the same epilogue **after** `await Promise.all(asyncTasks)` and before `return errors;` (indented two spaces to match the async IIFE body).

- [ ] **Step 4: Run tests** — full package suite PASS.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator
git add -A && git commit -m "feat(class-validator): implement whitelist and forbidNonWhitelisted"
```

---

### Task 5: `forbidUnknownValues`

**Files:**

- Modify: `packages/class-validator/src/engine/validator.ts`
- Test: append to `validator-options.test.ts`

**Interfaces:**

- Consumes: `getClassValidationMetadata(object)` returning `undefined` for unknown objects.
- Produces: when `options.forbidUnknownValues === true` and the object has no validation metadata (or is not a non-null object), `validate`/`validateSync` return one error: `{ property: '', value: undefined, target: object, children: [], constraints: { unknownValue: 'an unknown value was passed to the validate function' } }`. Default stays `false` (documented divergence: upstream class-validator ≥0.14 defaults to `true`).

- [ ] **Step 1: Write the failing tests**

```typescript
describe('forbidUnknownValues', () => {
  it('default: unknown object → no errors (back-compat)', () => {
    expect(validateSync({ anything: 1 })).toHaveLength(0);
  });

  it('true: unknown object → unknownValue error (sync + async)', async () => {
    const target = { anything: 1 };
    const errors = validateSync(target, { forbidUnknownValues: true });
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      unknownValue: 'an unknown value was passed to the validate function',
    });
    expect(errors[0].target).toBe(target);
    expect(await validate({ x: 1 }, { forbidUnknownValues: true })).toHaveLength(1);
  });

  it('true: decorated class still validates normally', () => {
    class Dto {
      @IsString()
      name: any = 'ok';
    }
    expect(validateSync(new Dto(), { forbidUnknownValues: true })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** — second test FAILS (returns `[]`).

- [ ] **Step 3: Implement**

In `validator.ts` add:

```typescript
function unknownValueError(object: any): ValidationError {
  return {
    property: '',
    value: undefined,
    target: object,
    children: [],
    constraints: { unknownValue: 'an unknown value was passed to the validate function' },
  };
}
```

In both `validate` and `validateSync`, replace the early-return branch:

```typescript
const metadata =
  object && typeof object === 'object' ? getClassValidationMetadata(object) : undefined;
if (!metadata || metadata.properties.size === 0) {
  return options?.forbidUnknownValues ? [unknownValueError(object)] : [];
}
```

(`validateMany`/`validateOrReject` delegate, so they inherit the behavior.)

- [ ] **Step 4: Run tests** — full package suite PASS.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator
git add -A && git commit -m "feat(class-validator): implement forbidUnknownValues"
```

---

### Task 6: `validationError: { target, value }` option + fix `ValidationError.target` doc

The compiler already puts `target` and `value` on every error, but there is no way to strip them (class-validator's `ValidatorOptions.validationError`), and the doc comment on `ValidationError.target` in types.ts wrongly says "Property path (for nested objects)".

**Files:**

- Modify: `packages/class-validator/src/types.ts`, `packages/class-validator/src/engine/validator.ts`
- Test: append to `validator-options.test.ts`

**Interfaces:**

- Consumes: errors array returned by compiled validators (each error may have `target`, `value`, `children`).
- Produces: `ValidatorOptions.validationError?: { target?: boolean; value?: boolean }` — when `target === false` / `value === false`, the corresponding field is recursively removed from all errors (children included). Exported helper `stripErrorFields(errors: ValidationError[], options?: ValidatorOptions): ValidationError[]` is internal to validator.ts (not exported from index).

- [ ] **Step 1: Write the failing test**

```typescript
import { ValidateNested, Type } from '../../../../src'; // only if nested decorators exist here; otherwise test flat errors only — check decorators/nested.ts exports first

describe('validationError option', () => {
  class Dto {
    @IsString()
    name: any = 42;
  }

  it('default: target and value present', () => {
    const dto = new Dto();
    const errors = validateSync(dto);
    expect(errors[0].target).toBe(dto);
    expect(errors[0].value).toBe(42);
  });

  it('target:false / value:false strip fields (sync + async)', async () => {
    const errors = validateSync(new Dto(), {
      validationError: { target: false, value: false },
    });
    expect(errors[0]).not.toHaveProperty('target');
    expect(errors[0]).not.toHaveProperty('value');
    const asyncErrors = await validate(new Dto(), { validationError: { target: false } });
    expect(asyncErrors[0]).not.toHaveProperty('target');
    expect(asyncErrors[0]).toHaveProperty('value');
  });
});
```

- [ ] **Step 2: Run to verify failure** — strip test FAILS.

- [ ] **Step 3: Implement**

types.ts — add to `ValidatorOptions`:

```typescript
/**
 * Settings for the returned ValidationError objects.
 * target/value default to true (fields included).
 */
validationError?: {
  target?: boolean;
  value?: boolean;
};
```

and fix the `ValidationError.target` doc comment to `/** Object that was validated */`.

validator.ts — add:

```typescript
function stripErrorFields(
  errors: ValidationError[],
  options?: ValidatorOptions,
): ValidationError[] {
  const stripTarget = options?.validationError?.target === false;
  const stripValue = options?.validationError?.value === false;
  if (!stripTarget && !stripValue) return errors;
  const walk = (errs: ValidationError[]): void => {
    for (const err of errs) {
      if (stripTarget) delete err.target;
      if (stripValue) delete err.value;
      if (err.children) walk(err.children);
    }
  };
  walk(errors);
  return errors;
}
```

Apply it to the result in both `validate` (`return stripErrorFields(await validator(object, options), options);`) and `validateSync`.

- [ ] **Step 4: Run tests** — full package suite PASS.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator
git add -A && git commit -m "feat(class-validator): support validationError target/value stripping; fix ValidationError.target docs"
```

---

### Task 7: `registerDecorator` + `getMetadataStorage`

**Files:**

- Create: `packages/class-validator/src/register-decorator.ts`
- Create: `packages/class-validator/src/metadata-storage.ts`
- Modify: `packages/class-validator/src/index.ts` (exports)
- Test: `packages/class-validator/tests/unit/compat/class-validator/register-decorator.test.ts` (create)

**Interfaces:**

- Consumes: `addValidationConstraint(target, propertyKey, constraint)` from `engine/metadata.ts`; `getValidationMetadata(target)`; `ValidatorConstraintInterface` from `decorators/custom.ts`; constraint types `'custom'` (class-based, `value: { constraintClass, constraints }`) and `'validateBy'` (`value: { name, validator, defaultMessage, constraints }`) as compiled in compiler.ts.
- Produces:

```typescript
export interface RegisterDecoratorOptions {
  name?: string;
  target: Function;
  propertyName: string;
  constraints?: any[];
  options?: ValidationDecoratorOptions; // { message?, groups?, always? }
  validator: ValidatorConstraintInterface | (new () => ValidatorConstraintInterface);
  async?: boolean;
}
export function registerDecorator(args: RegisterDecoratorOptions): void;
export function getMetadataStorage(): CompatMetadataStorage;
// CompatMetadataStorage.getTargetValidationMetadatas(target: Function): ValidationMetadataEntry[]
// ValidationMetadataEntry = { target: Function; propertyName: string; type: string; constraints: any[]; message?; groups?; always? }
```

- [ ] **Step 1: Write the failing test**

```typescript
// packages/class-validator/tests/unit/compat/class-validator/register-decorator.test.ts
import { describe, it, expect } from 'vitest';
import { registerDecorator, getMetadataStorage, validateSync } from '../../../../src';
import type { ValidationArguments, ValidationDecoratorOptions } from '../../../../src';

// TC39-adapted custom decorator, the documented migration pattern
function IsLongerThan(property: string, options?: ValidationDecoratorOptions) {
  return function (_: undefined, context: ClassFieldDecoratorContext) {
    context.addInitializer(function (this: any) {
      registerDecorator({
        name: 'isLongerThan',
        target: this.constructor,
        propertyName: String(context.name),
        constraints: [property],
        options,
        validator: {
          validate(value: any, args?: ValidationArguments) {
            const [related] = args!.constraints;
            const other = (args!.object as any)[related];
            return (
              typeof value === 'string' && typeof other === 'string' && value.length > other.length
            );
          },
          defaultMessage(args?: ValidationArguments) {
            return `${args!.property} must be longer than ${args!.constraints[0]}`;
          },
        },
      });
    });
  };
}

describe('registerDecorator', () => {
  class Dto {
    firstName: string = 'Alexander';
    @IsLongerThan('firstName')
    lastName: string = 'Li';
  }

  it('registers a working object-validator decorator', () => {
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('lastName');
    expect(errors[0].constraints!.isLongerThan).toBe('lastName must be longer than firstName');
  });

  it('does not duplicate constraints across instances', () => {
    new Dto();
    new Dto();
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });

  it('honors explicit message option', () => {
    class Dto2 {
      firstName = 'Long name';
      @IsLongerThan('firstName', { message: 'custom msg' })
      lastName = 'x';
    }
    expect(validateSync(new Dto2())[0].constraints!.isLongerThan).toBe('custom msg');
  });
});

describe('getMetadataStorage', () => {
  it('exposes registered metadata for a target', () => {
    class Dto3 {
      firstName = 'abc';
      @IsLongerThan('firstName')
      lastName = 'x';
    }
    new Dto3(); // metadata attaches on first instantiation (TC39 addInitializer)
    const entries = getMetadataStorage().getTargetValidationMetadatas(Dto3);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    const entry = entries.find((e) => e.propertyName === 'lastName')!;
    expect(entry.target).toBe(Dto3);
    expect(entry.type).toBe('validateBy');
    expect(entry.constraints).toEqual(['firstName']);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL: `registerDecorator` is not exported.

- [ ] **Step 3: Implement**

`register-decorator.ts`:

```typescript
import { addValidationConstraint } from './engine/metadata';
import type { ValidationDecoratorOptions, ValidationArguments } from './types';
import type { ValidatorConstraintInterface } from './decorators/custom';

export interface RegisterDecoratorOptions {
  /** Constraint name used as the key in ValidationError.constraints */
  name?: string;
  /** Class constructor the property belongs to */
  target: Function;
  propertyName: string;
  /** Extra constraint arguments, exposed as ValidationArguments.constraints */
  constraints?: any[];
  options?: ValidationDecoratorOptions;
  /** Inline validator object or ValidatorConstraint class */
  validator: ValidatorConstraintInterface | (new () => ValidatorConstraintInterface);
  async?: boolean;
}

export function registerDecorator(args: RegisterDecoratorOptions): void {
  const { validator } = args;
  if (typeof validator === 'function') {
    // ValidatorConstraint class → compiled via the 'custom' constraint path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'custom',
      value: {
        constraintClass: validator,
        constraints: args.constraints || [],
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
        constraints: args.constraints || [],
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
    });
  }
}
```

**Known pitfall:** `addValidationConstraint` dedupes by comparing `existing.value !== constraint.value` — a fresh `value` object is created on every `addInitializer` run, so instance #2 would duplicate the constraint. Extend the dedupe in `engine/metadata.ts`: when both values are objects, compare `value.name` + `value.constraintClass` + `value.validator` reference equality is NOT stable for arrow wrappers — instead, for `type === 'validateBy'` / `'custom'`, treat constraints as duplicates when `type`, `value?.name`, `value?.constraintClass`, JSON-comparable `value?.constraints`, `message`, `groups`, `always` all match. Simplest robust fix: in `registerDecorator`, check first via `getValidationMetadata(args.target).properties.get(args.propertyName)` whether a constraint with the same `type` and `value?.name` (or same `constraintClass`) already exists, and return early. The duplication test in Step 1 pins this.

**Second pitfall:** the `validateBy` compiled code emits `${errorsName}.${validatorName} = ...` — the name is interpolated as an identifier, so `args.name` must be a valid JS identifier. Guard in compiler.ts `validateBy` branches: `const validatorName = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rawName) ? rawName : 'custom';` — apply to both sync and async branches (small, include in this task).

`metadata-storage.ts`:

```typescript
import { getValidationMetadata } from './engine/metadata';

export interface ValidationMetadataEntry {
  target: Function;
  propertyName: string;
  type: string;
  constraints: any[];
  message?: unknown;
  groups?: string[];
  always?: boolean;
}

/**
 * Minimal compat facade over the Symbol-based metadata storage.
 * Only getTargetValidationMetadatas is provided — see docs/compat-class-validator.md.
 */
class CompatMetadataStorage {
  getTargetValidationMetadatas(target: Function): ValidationMetadataEntry[] {
    const metadata = getValidationMetadata(target);
    const entries: ValidationMetadataEntry[] = [];
    for (const [propertyKey, propMeta] of metadata.properties.entries()) {
      for (const constraint of propMeta.constraints) {
        entries.push({
          target,
          propertyName: String(propertyKey),
          type: constraint.type,
          constraints: Array.isArray(constraint.value?.constraints)
            ? constraint.value.constraints
            : constraint.value !== undefined
              ? [constraint.value]
              : [],
          message: constraint.message,
          groups: constraint.groups,
          always: constraint.always,
        });
      }
    }
    return entries;
  }
}

const storage = new CompatMetadataStorage();

export function getMetadataStorage(): CompatMetadataStorage {
  return storage;
}
```

index.ts — add:

```typescript
export { registerDecorator, type RegisterDecoratorOptions } from './register-decorator';
export { getMetadataStorage, type ValidationMetadataEntry } from './metadata-storage';
```

Verify the meta-package re-exports it: `grep -n "class-validator" packages/om-data-mapper/src/*.ts` — if it star-re-exports `@om-data-mapper/class-validator`, nothing to do; otherwise add the named exports there too.

- [ ] **Step 4: Run tests** — full package suite PASS; also `pnpm --filter om-data-mapper test` if the meta package has tests.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-validator
git add -A && git commit -m "feat(class-validator): add registerDecorator and getMetadataStorage compat APIs"
```

---

### Task 8: class-transformer — `enableImplicitConversion` + remove dead options

**Files:**

- Modify: `packages/class-transformer/src/types.ts` (remove dead options), `packages/class-transformer/src/functions.ts` (`transformValue`)
- Test: `packages/class-transformer/tests/unit/compat/implicit-conversion.test.ts` (create)

**Interfaces:**

- Consumes: `propertyMeta.typeFunction` (from `@Type(() => X)`), `options.enableImplicitConversion`.
- Produces: during `plainToClass`-family transforms with `enableImplicitConversion: true`, properties whose `@Type` resolves to `String` / `Number` / `Boolean` / `Date` coerce primitive inputs (`Number('42') → 42`, `String(42) → '42'`, `Boolean(0) → false`, `new Date('2020-01-01')`). `null`/`undefined` pass through untouched. Without the flag, current behavior (no coercion) is preserved. TC39 limitation (no `reflect-metadata`): properties **without** `@Type` cannot be implicitly converted — documented in the compat table (Task 9).
- Removes from `ClassTransformOptions`: `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`, `enableValidation` (implemented nowhere — verify with `grep -rn 'enableCircularCheck\|exposeUnsetFields\|targetMaps\|enableValidation' packages/class-transformer/src packages/om-data-mapper` before deleting; if the meta package re-declares the type, update it too).

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/class-transformer/tests/unit/compat/implicit-conversion.test.ts
import { describe, it, expect } from 'vitest';
import { plainToInstance, Type } from '../../../src';
// match the import style of tests/unit/compat/class-transformer.test.ts

describe('enableImplicitConversion', () => {
  class Dto {
    @Type(() => Number)
    age!: number;
    @Type(() => String)
    label!: string;
    @Type(() => Boolean)
    active!: boolean;
    @Type(() => Date)
    createdAt!: Date;
  }

  it('coerces primitives via @Type when enabled', () => {
    const dto = plainToInstance(
      Dto,
      { age: '42', label: 7, active: 1, createdAt: '2020-01-02T00:00:00.000Z' },
      { enableImplicitConversion: true },
    );
    expect(dto.age).toBe(42);
    expect(dto.label).toBe('7');
    expect(dto.active).toBe(true);
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.createdAt.toISOString()).toBe('2020-01-02T00:00:00.000Z');
  });

  it('passes null/undefined through', () => {
    const dto = plainToInstance(Dto, { age: null }, { enableImplicitConversion: true });
    expect(dto.age).toBeNull();
  });

  it('without the flag values stay as-is', () => {
    const dto = plainToInstance(Dto, { age: '42' });
    expect(dto.age).toBe('42');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @om-data-mapper/class-transformer exec vitest run tests/unit/compat/implicit-conversion.test.ts`
Expected: first test FAILS (`'42'` stays a string).

- [ ] **Step 3: Implement**

In `functions.ts` `transformValue`, inside the existing `if (propertyMeta?.typeFunction && transformationType === 'plainToClass')` block, before the `Array.isArray(value)` branch:

```typescript
const TypeClass = propertyMeta.typeFunction();

if (options.enableImplicitConversion && value !== null && value !== undefined) {
  if (TypeClass === Number) return typeof value === 'number' ? value : Number(value);
  if (TypeClass === String) return typeof value === 'string' ? value : String(value);
  if (TypeClass === Boolean) return typeof value === 'boolean' ? value : Boolean(value);
  if (TypeClass === Date) return value instanceof Date ? value : new Date(value as any);
}
```

(Note the block already computes `const TypeClass = propertyMeta.typeFunction();` — reuse it, don't compute twice. `classToClass` also passes through `plainToClass` transformation type, which is correct.)

In `types.ts` delete the four dead fields and their doc comments; fix the (currently wrong) doc comments left behind — `enableImplicitConversion`'s comment should read: "If true, values of properties decorated with @Type(() => Number/String/Boolean/Date) are coerced from primitive inputs. Requires @Type — implicit conversion from reflected types is impossible with TC39 decorators."

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @om-data-mapper/class-transformer test` and `pnpm --filter om-data-mapper test` (meta-package smoke tests may reference removed types) and `pnpm -w exec tsc --noEmit 2>/dev/null || pnpm -r build`
Expected: all PASS; build clean.

- [ ] **Step 5: Format and commit**

```bash
pnpm exec prettier --write packages/class-transformer
git add -A && git commit -m "feat(class-transformer): implement enableImplicitConversion; drop dead ClassTransformOptions fields"
```

---

### Task 9: Compat tables, changesets, full verification

**Files:**

- Create: `docs/compat-class-validator.md`, `docs/compat-class-transformer.md`
- Create: `.changeset/phase2-class-validator.md`, `.changeset/phase2-class-transformer.md`
- Modify: nothing in src.

**Interfaces:**

- Consumes: the exact behavior shipped in Tasks 1–8 (write the tables from the code, not from upstream docs).
- Produces: two honest compat tables that Phase 4 README work will link to; changesets for release Phase 5.

- [ ] **Step 1: Write `docs/compat-class-validator.md`**

Structure (fill every row honestly by checking the code — `grep case '` in compiler.ts gives the supported decorator list):

```markdown
# class-validator compatibility

Status of `@om-data-mapper/class-validator` vs `class-validator@0.14`.

## ValidatorOptions

| Option                          | Status | Notes                                                                   |
| ------------------------------- | ------ | ----------------------------------------------------------------------- |
| groups                          | ✅     |                                                                         |
| always                          | ✅     |                                                                         |
| skipMissingProperties           | ✅     | `@IsDefined` still fires, matching upstream                             |
| skipNullProperties              | ✅     |                                                                         |
| skipUndefinedProperties         | ✅     |                                                                         |
| whitelist                       | ✅     | mutates the validated object (deletes unknown props), matching upstream |
| forbidNonWhitelisted            | ✅     | takes effect only together with `whitelist: true`                       |
| stopAtFirstError                | ✅     | per-property, matching upstream                                         |
| forbidUnknownValues             | ⚠️     | implemented; **default is `false`** (upstream ≥0.14 defaults to `true`) |
| validationError.target / .value | ✅     |                                                                         |
| strictGroups                    | ❌     | not implemented                                                         |
| dismissDefaultMessages          | ❌     | not implemented                                                         |
| enableDebugMessages             | ❌     | no-op                                                                   |

## API

| API                                                            | Status | Notes                                                           |
| -------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| validate / validateSync / validateOrReject                     | ✅     | plus non-upstream validateMany/validateManySync                 |
| registerDecorator                                              | ✅     | must be called from a TC39 `addInitializer` (see example below) |
| getMetadataStorage                                             | ⚠️     | minimal facade: only `getTargetValidationMetadatas(target)`     |
| ValidationError.target/value/children/constraints              | ✅     | `contexts` not implemented                                      |
| message as function                                            | ✅     |                                                                 |
| $property / $value / $constraint templating in string messages | ❌     | use a message function instead                                  |

## Decorators

(два списка: поддерживаемые — из `case '...'` в compiler.ts и экспортов `src/decorators/`; отсутствующие относительно upstream — например `@IsISO31661Numeric`, `@IsTaxId`, `@IsOctal`, и т.д. — перечислить фактически.)

## Migrating custom decorators (registerDecorator)

(короткий пример TC39-обёртки из теста register-decorator.test.ts)
```

Include the real TC39 `registerDecorator` example from Task 7's test verbatim.

- [ ] **Step 2: Write `docs/compat-class-transformer.md`**

Same shape: `ClassTransformOptions` table — supported: `strategy`, `excludeExtraneousValues`, `groups`, `version`, `excludePrefixes`, `ignoreDecorators`, `enableImplicitConversion` (⚠️ requires `@Type`, no reflect-metadata under TC39); removed as unimplementable/dead: `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`, `enableValidation`. Functions table: `plainToClass/plainToInstance`, `classToPlain/instanceToPlain`, `classToClass/instanceToInstance`, `plainToClassFromExist`, `serialize`, `deserialize`, `deserializeArray` — all ✅. Decorators: `@Expose`, `@Exclude`, `@Type` (incl. discriminator status — check `decorators.ts` whether discriminator is actually implemented and be honest), `@Transform`.

- [ ] **Step 3: Write changesets**

```markdown
## <!-- .changeset/phase2-class-validator.md -->

'@om-data-mapper/class-validator': minor
'om-data-mapper': minor

---

Implement previously-dead ValidatorOptions (whitelist, forbidNonWhitelisted, skipMissingProperties, skipNullProperties, skipUndefinedProperties, stopAtFirstError, forbidUnknownValues), function-form message, validationError.target/value stripping, registerDecorator and getMetadataStorage. Behavior change: whitelist now actually strips unknown properties (was a silent no-op in v4).
```

```markdown
## <!-- .changeset/phase2-class-transformer.md -->

'@om-data-mapper/class-transformer': minor
'om-data-mapper': minor

---

Implement enableImplicitConversion (primitive coercion via @Type). Remove dead ClassTransformOptions fields: enableCircularCheck, exposeUnsetFields, targetMaps, enableValidation.
```

(Check `.changeset/config.json` for the meta-package linkage first; if `om-data-mapper` is auto-bumped via `linked`/`updateInternalDependencies`, drop the duplicate line.)

- [ ] **Step 4: Full verification**

```bash
pnpm -r build && pnpm -w exec eslint . && pnpm exec prettier --check . && pnpm -w test
```

Expected: build clean, lint clean, format clean, all tests green (518 baseline + ~20 new). Record the new total.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: add honest class-validator/class-transformer compat tables; changesets for Phase 2"
```
