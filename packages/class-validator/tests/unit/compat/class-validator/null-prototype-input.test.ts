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
