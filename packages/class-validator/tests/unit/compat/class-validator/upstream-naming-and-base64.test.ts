/**
 * Two small parity gaps left over from the compatibility audit.
 *
 * `IsUrl` is upstream's spelling; this package only exported `IsURL`, so
 * `import { IsUrl }` failed even though the implementation was there.
 *
 * `@IsBase64` accepted strings whose length is not a multiple of four —
 * upstream (validator.js, padding on by default) rejects them.
 */

import { describe, it, expect } from 'vitest';
import { validateSync } from '../../../../src';
import { IsBase64, IsURL, IsUrl } from '../../../../src/decorators';

describe('IsUrl naming', () => {
  it('exports the decorator under upstream’s spelling', () => {
    expect(typeof IsUrl).toBe('function');
  });

  it('is the same decorator as IsURL', () => {
    expect(IsUrl).toBe(IsURL);
  });

  it('validates through the upstream spelling', () => {
    class Dto {
      @IsUrl()
      site = 'not a url at all';
    }

    const errors = validateSync(new Dto());

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });

  it('accepts a valid URL through the upstream spelling', () => {
    class Dto {
      @IsUrl()
      site = 'https://example.com';
    }

    expect(validateSync(new Dto())).toHaveLength(0);
  });
});

describe('IsBase64 padding', () => {
  class Dto {
    @IsBase64()
    p: unknown;
    constructor(v: unknown) {
      this.p = v;
    }
  }

  it.each([
    ['a padded four-character group', 'YWJjZA=='],
    ['an unpadded four-character group', 'YWJj'],
    ['a single padded character', 'YQ=='],
    ['a three-character group with one pad', 'YWJjZGU='],
    ['an empty string', ''],
  ])('accepts %s', (_label, value) => {
    expect(validateSync(new Dto(value))).toHaveLength(0);
  });

  it.each([
    ['a two-character string with no padding', 'zz'],
    ['a three-character string with no padding', 'abc'],
    ['a single character', 'a'],
    ['padding only', '===='],
    ['a group containing a space', 'YWJ jZA=='],
    ['a group with misplaced padding', 'YWJjZA='],
    ['characters outside the alphabet', '!!!!'],
  ])('rejects %s', (_label, value) => {
    expect(validateSync(new Dto(value))).toHaveLength(1);
  });
});
