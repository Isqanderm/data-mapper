/**
 * Honest validation comparison: om-data-mapper's own decorators
 * (@tech-pioneer/data-mapper-class-validator) vs real upstream class-validator.
 *
 * Why "honest": an earlier (v4) benchmark fed class-validator-decorated
 * classes straight into om's engine. om's engine looks for its OWN
 * decorator metadata, found none, and validateSync returned `[]` — a
 * silent no-op that got reported as "60,000% faster". The guards below
 * make that mistake impossible: every scenario is checked, on BOTH
 * engines, BEFORE any bench() runs, to prove each engine actually
 * inspects the data (0 errors on valid input, >=1 error on invalid
 * input). A guard failure throws and aborts the whole run.
 *
 * Fairness note on warm-up: om attaches its validation metadata lazily,
 * on first instantiation of a decorated class (TC39 `addInitializer`).
 * The guard section below instantiates every om AND cv class at least
 * once before any bench() executes, so both engines enter the measured
 * loops with warm metadata / JIT-compiled validators — a fair
 * apples-to-apples comparison, not om paying a one-time compile cost
 * that cv doesn't pay.
 */
import { bench, describe } from 'vitest';
import {
  validateSync as omValidateSync,
  type ValidationError as OmValidationError,
} from '@tech-pioneer/data-mapper-class-validator';
import { validateSync as cvValidateSync } from 'class-validator';
import type { ValidationError as CvValidationError } from 'class-validator';
import { OmSimpleUser, OmOptionalUser, OmAddress, OmUserWithAddress } from './models-validation-om';
import { CvSimpleUser, CvOptionalUser, CvAddress, CvUserWithAddress } from './models-validation-cv';

// ---------------------------------------------------------------------------
// Fixtures (plain data — mirrored 1:1 between om and cv instances below)
// ---------------------------------------------------------------------------

const validSimple = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', age: 30 };
const invalidSimple = { firstName: 'J', lastName: '', email: 'not-an-email', age: -5 };

const validOptional = { name: 'Alice', nickname: 'ali_the_great', score: 42 };
const invalidOptional = { name: 'A', nickname: 'abc', score: -1 };

const validNestedAddress = { street: '123 Main St', city: 'Springfield' };
const invalidNestedAddress = { street: 'St', city: 'X' };

// ---------------------------------------------------------------------------
// Instance builders — construction happens outside the measured bench()
// callbacks; only validateSync() itself is timed.
// ---------------------------------------------------------------------------

function makeOm<T extends object>(cls: new () => T, data: Partial<T>): T {
  return Object.assign(new cls(), data);
}
function makeCv<T extends object>(cls: new () => T, data: Partial<T>): T {
  return Object.assign(new cls(), data);
}

function makeOmNested(address: { street: string; city: string }): OmUserWithAddress {
  const user = new OmUserWithAddress();
  user.name = 'Alice';
  user.address = Object.assign(new OmAddress(), address);
  return user;
}
function makeCvNested(address: { street: string; city: string }): CvUserWithAddress {
  const user = new CvUserWithAddress();
  user.name = 'Alice';
  user.address = Object.assign(new CvAddress(), address);
  return user;
}

// ---------------------------------------------------------------------------
// Honesty guards: both engines must actually validate these shapes.
// Runs at import time, before any describe/bench block.
// ---------------------------------------------------------------------------

function guard(
  name: string,
  omErrors: OmValidationError[],
  cvErrors: CvValidationError[],
  expectErrors: boolean,
): void {
  // Error COUNTS may legitimately differ between the two engines (e.g. cv
  // may collapse multiple failed constraints on one property into a
  // single ValidationError with several `constraints` keys, while om may
  // report differently-shaped errors for the same property) — the compat
  // table (docs/compat-class-validator.md) is the source of truth for
  // constraint-level parity. This guard only checks presence/absence of
  // errors, never exact counts.
  console.info(
    `[honesty guard] ${name}: om reported ${omErrors.length} error(s), ` +
      `cv reported ${cvErrors.length} error(s) (expectErrors=${expectErrors})`,
  );
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

// simple/valid, simple/invalid
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

// optional/valid, optional/invalid
guard(
  'optional/valid',
  omValidateSync(makeOm(OmOptionalUser, validOptional)),
  cvValidateSync(makeCv(CvOptionalUser, validOptional) as object),
  false,
);
guard(
  'optional/invalid',
  omValidateSync(makeOm(OmOptionalUser, invalidOptional)),
  cvValidateSync(makeCv(CvOptionalUser, invalidOptional) as object),
  true,
);

// nested/valid, nested/invalid
guard(
  'nested/valid',
  omValidateSync(makeOmNested(validNestedAddress)),
  cvValidateSync(makeCvNested(validNestedAddress) as object),
  false,
);
guard(
  'nested/invalid',
  omValidateSync(makeOmNested(invalidNestedAddress)),
  cvValidateSync(makeCvNested(invalidNestedAddress) as object),
  true,
);

// ---------------------------------------------------------------------------
// Benchmarks: instances pre-created outside the measured loop (metadata is
// already warm from the guard section above).
// ---------------------------------------------------------------------------

const omSimpleValid = makeOm(OmSimpleUser, validSimple);
const cvSimpleValid = makeCv(CvSimpleUser, validSimple);
const omSimpleInvalid = makeOm(OmSimpleUser, invalidSimple);
const cvSimpleInvalid = makeCv(CvSimpleUser, invalidSimple);

const omOptionalValid = makeOm(OmOptionalUser, validOptional);
const cvOptionalValid = makeCv(CvOptionalUser, validOptional);
const omOptionalInvalid = makeOm(OmOptionalUser, invalidOptional);
const cvOptionalInvalid = makeCv(CvOptionalUser, invalidOptional);

const omNestedValid = makeOmNested(validNestedAddress);
const cvNestedValid = makeCvNested(validNestedAddress);
const omNestedInvalid = makeOmNested(invalidNestedAddress);
const cvNestedInvalid = makeCvNested(invalidNestedAddress);

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

describe('validation: optional fields object (valid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omOptionalValid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvOptionalValid as object);
  });
});

describe('validation: optional fields object (invalid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omOptionalInvalid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvOptionalInvalid as object);
  });
});

describe('validation: nested object (valid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omNestedValid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvNestedValid as object);
  });
});

describe('validation: nested object (invalid data)', () => {
  bench('om-data-mapper validateSync', () => {
    omValidateSync(omNestedInvalid);
  });
  bench('class-validator validateSync', () => {
    cvValidateSync(cvNestedInvalid as object);
  });
});
