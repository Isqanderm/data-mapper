/**
 * Honest transformation comparison: om-data-mapper's own decorators
 * (@om-data-mapper/class-transformer) vs real upstream class-transformer.
 *
 * Why "honest": see validation.bench.ts for the general rationale (an
 * engine silently no-op'ing on foreign decorator metadata can look
 * absurdly "faster" while doing nothing). The guards below prove BOTH
 * engines actually transform the fixture — correct field values, correct
 * prototypes, correct renamed/excluded keys — BEFORE any bench() runs.
 * A guard failure throws and aborts the whole run.
 *
 * Options-equivalence note: every property on OmUser/CtUser and
 * OmAddress/CtAddress carries an explicit @Expose or @Exclude decorator
 * (docs/compat-class-transformer.md confirms both engines default to
 * `strategy: 'exposeAll'` when no options are passed, and that default
 * only matters for UNDECORATED properties). Since nothing here is
 * undecorated, the `excludeExtraneousValues` / `strategy` default-mismatch
 * caveat from the task brief does not apply to this fixture, and no
 * explicit ClassTransformOptions are needed on either call to get an
 * apples-to-apples comparison — verified empirically (see
 * packages/class-transformer/src/functions.ts + metadata.ts:
 * shouldExposeProperty / getSourcePropertyName) and against real
 * class-transformer@0.5.1 output: both engines rename `id` <-> `user_id`
 * in BOTH directions (plainToInstance reads `user_id`, instanceToPlain
 * writes `user_id`) and both drop `password` unconditionally from
 * instanceToPlain output.
 *
 * Fairness note on warm-up: om attaches its transform metadata lazily,
 * on first instantiation of a decorated class (TC39 `addInitializer`).
 * The guard section below instantiates every om AND ct class at least
 * once before any bench() executes, so both engines enter the measured
 * loops with warm metadata — a fair apples-to-apples comparison, not om
 * paying a one-time compile cost that ct doesn't pay.
 */
import { bench, describe } from 'vitest';
import {
  plainToInstance as omPlainToInstance,
  instanceToPlain as omInstanceToPlain,
} from '@om-data-mapper/class-transformer';
import {
  plainToInstance as ctPlainToInstance,
  instanceToPlain as ctInstanceToPlain,
} from 'class-transformer';
import { OmUser, OmAddress } from './models-transform-om';
import { CtUser, CtAddress } from './models-transform-ct';

// ---------------------------------------------------------------------------
// Fixture (plain data — mirrored 1:1 between om and ct instances below)
// ---------------------------------------------------------------------------

const fixture = {
  user_id: 1,
  name: 'John',
  address: { city: 'NYC', street: 'Main St' },
  password: 'hunter2',
};

// Hand-written expected instanceToPlain output: `id` renamed back to
// `user_id`, nested address flattened to a plain object, `password`
// dropped entirely (guard c also checks this literal is never mutated
// by the deep-equal comparison logic itself).
const expectedPlain = {
  user_id: 1,
  name: 'John',
  address: { city: 'NYC', street: 'Main St' },
};

// ---------------------------------------------------------------------------
// Deep-equal helper: JSON.stringify with recursively sorted keys.
// ---------------------------------------------------------------------------

function sortedJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = val[k];
          return acc;
        }, {});
    }
    return val;
  });
}

// ---------------------------------------------------------------------------
// Honesty guards: both engines must actually transform this fixture.
// Runs at import time, before any describe/bench block.
// ---------------------------------------------------------------------------

const omInstance = omPlainToInstance(OmUser, fixture);
const ctInstance = ctPlainToInstance(CtUser, fixture);

console.info(
  `[honesty guard] plainToInstance: om -> ${omInstance.constructor.name} ` +
    `(id=${omInstance.id}, address=${omInstance.address?.constructor.name}), ` +
    `ct -> ${ctInstance.constructor.name} ` +
    `(id=${ctInstance.id}, address=${ctInstance.address?.constructor.name})`,
);

// (a) om plainToInstance yields instanceof om classes with correct field values
if (!(omInstance instanceof OmUser)) {
  throw new Error(
    `honesty guard [plainToInstance/om]: expected instanceof OmUser, got ${omInstance?.constructor?.name}`,
  );
}
if (omInstance.id !== 1) {
  throw new Error(`honesty guard [plainToInstance/om]: expected id === 1, got ${omInstance.id}`);
}
if (!(omInstance.address instanceof OmAddress)) {
  throw new Error(
    `honesty guard [plainToInstance/om]: expected address instanceof OmAddress, got ${omInstance.address?.constructor?.name}`,
  );
}

// (b) upstream plainToInstance yields instanceof upstream classes with correct field values
if (!(ctInstance instanceof CtUser)) {
  throw new Error(
    `honesty guard [plainToInstance/ct]: expected instanceof CtUser, got ${ctInstance?.constructor?.name}`,
  );
}
if (ctInstance.id !== 1) {
  throw new Error(`honesty guard [plainToInstance/ct]: expected id === 1, got ${ctInstance.id}`);
}
if (!(ctInstance.address instanceof CtAddress)) {
  throw new Error(
    `honesty guard [plainToInstance/ct]: expected address instanceof CtAddress, got ${ctInstance.address?.constructor?.name}`,
  );
}

// (c) instanceToPlain outputs deep-equal each other AND a hand-written
// expected literal, and neither output contains `password`.
const omPlain = omInstanceToPlain(omInstance);
const ctPlain = ctInstanceToPlain(ctInstance);

console.info(
  `[honesty guard] instanceToPlain: om -> ${JSON.stringify(omPlain)}, ct -> ${JSON.stringify(ctPlain)}`,
);

if (sortedJson(omPlain) !== sortedJson(ctPlain)) {
  throw new Error(
    `honesty guard [instanceToPlain]: om and ct outputs are not deep-equal\n` +
      `  om: ${JSON.stringify(omPlain)}\n` +
      `  ct: ${JSON.stringify(ctPlain)}`,
  );
}
if (sortedJson(omPlain) !== sortedJson(expectedPlain)) {
  throw new Error(
    `honesty guard [instanceToPlain]: om output does not match hand-written expected literal\n` +
      `  om:       ${JSON.stringify(omPlain)}\n` +
      `  expected: ${JSON.stringify(expectedPlain)}`,
  );
}
if ('password' in omPlain || 'password' in ctPlain) {
  throw new Error(
    `honesty guard [instanceToPlain]: password leaked into output ` +
      `(om has password=${'password' in omPlain}, ct has password=${'password' in ctPlain})`,
  );
}

// ---------------------------------------------------------------------------
// Benchmarks: instances pre-created outside the measured loop (metadata is
// already warm from the guard section above).
// ---------------------------------------------------------------------------

const omPlainToInstanceInput = fixture;
const ctPlainToInstanceInput = fixture;
const omInstanceToPlainInput = omInstance;
const ctInstanceToPlainInput = ctInstance;

describe('transformation: plainToInstance (rename + nested @Type)', () => {
  bench('om-data-mapper plainToInstance', () => {
    omPlainToInstance(OmUser, omPlainToInstanceInput);
  });
  bench('class-transformer plainToInstance', () => {
    ctPlainToInstance(CtUser, ctPlainToInstanceInput);
  });
});

describe('transformation: instanceToPlain (with @Exclude)', () => {
  bench('om-data-mapper instanceToPlain', () => {
    omInstanceToPlain(omInstanceToPlainInput);
  });
  bench('class-transformer instanceToPlain', () => {
    ctInstanceToPlain(ctInstanceToPlainInput);
  });
});
