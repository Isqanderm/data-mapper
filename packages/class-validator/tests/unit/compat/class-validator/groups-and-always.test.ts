/**
 * Group filtering and the `always` escape hatch.
 *
 * Matrix measured against class-validator 0.14.4 (checking which constraint
 * actually ran, not merely how many errors came back — with
 * forbidUnknownValues an object whose metadata was filtered away reports an
 * error of its own, which is easy to mistake for the constraint running):
 *
 *   validate options        | constraint groups ['g1'] | no groups | ['g1'] + always
 *   ------------------------|--------------------------|-----------|----------------
 *   none                    | runs                     | runs      | runs
 *   groups: []              | runs                     | runs      | runs
 *   groups: ['g1']          | runs                     | skipped   | runs
 *   groups: ['other']       | skipped                  | skipped   | runs
 *
 * So: with no filter everything runs; with a filter only matching groups run,
 * and an ungrouped constraint is skipped; `always: true` ignores the filter.
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../../../src';
import { IsNotEmpty, IsOptional, MinLength } from '../../../../src/decorators';

class Grouped {
  @IsNotEmpty({ groups: ['g1'] })
  p = '';
}
class Ungrouped {
  @IsNotEmpty()
  p = '';
}
class GroupedAlways {
  @IsNotEmpty({ groups: ['g1'], always: true })
  p = '';
}

/** Did the constraint itself run, as opposed to some other error appearing? */
const ran = (errors: { constraints?: Record<string, string> }[]) =>
  errors.some((e) => e.constraints && 'isNotEmpty' in e.constraints);

describe('group filtering', () => {
  describe('with no groups option', () => {
    it('runs a grouped constraint', () => {
      expect(ran(validateSync(new Grouped()))).toBe(true);
    });

    it('runs an ungrouped constraint', () => {
      expect(ran(validateSync(new Ungrouped()))).toBe(true);
    });
  });

  describe('with an empty groups array', () => {
    it('runs a grouped constraint', () => {
      expect(ran(validateSync(new Grouped(), { groups: [] }))).toBe(true);
    });

    it('runs an ungrouped constraint', () => {
      expect(ran(validateSync(new Ungrouped(), { groups: [] }))).toBe(true);
    });
  });

  describe('with a matching group', () => {
    it('runs the matching constraint', () => {
      expect(ran(validateSync(new Grouped(), { groups: ['g1'] }))).toBe(true);
    });

    it('skips an ungrouped constraint', () => {
      expect(ran(validateSync(new Ungrouped(), { groups: ['g1'] }))).toBe(false);
    });
  });

  describe('with a non-matching group', () => {
    it('skips the grouped constraint', () => {
      expect(ran(validateSync(new Grouped(), { groups: ['other'] }))).toBe(false);
    });

    it('skips an ungrouped constraint', () => {
      expect(ran(validateSync(new Ungrouped(), { groups: ['other'] }))).toBe(false);
    });
  });

  describe('always', () => {
    it('runs regardless of a non-matching group', () => {
      expect(ran(validateSync(new GroupedAlways(), { groups: ['other'] }))).toBe(true);
    });

    it('runs with no groups option', () => {
      expect(ran(validateSync(new GroupedAlways()))).toBe(true);
    });

    it('runs when set through the validator options instead', () => {
      expect(ran(validateSync(new Grouped(), { groups: ['other'], always: true }))).toBe(true);
    });
  });

  describe('on the async path', () => {
    it('runs a grouped constraint with no groups option', async () => {
      expect(ran(await validate(new Grouped()))).toBe(true);
    });

    it('skips an ungrouped constraint under a group filter', async () => {
      expect(ran(await validate(new Ungrouped(), { groups: ['g1'] }))).toBe(false);
    });

    it('honours always under a non-matching filter', async () => {
      expect(ran(await validate(new GroupedAlways(), { groups: ['other'] }))).toBe(true);
    });
  });
});

describe('@IsOptional with groups', () => {
  class OptionalGrouped {
    @IsOptional({ groups: ['g1'] })
    @MinLength(3)
    p: unknown = undefined;
  }

  it('treats the property as optional when no groups are given', () => {
    expect(validateSync(new OptionalGrouped())).toHaveLength(0);
  });

  it('treats the property as optional under a matching group', () => {
    expect(validateSync(new OptionalGrouped(), { groups: ['g1'] })).toHaveLength(0);
  });

  // With @MinLength ungrouped, a non-matching filter skips it too, so nothing
  // is reported either way and the case proves nothing. Giving the constraint
  // its own group separates the two: under 'x' the optional marker is out of
  // scope while the constraint is in it. Upstream reports minLength here.
  class OptionalOffConstraintOn {
    @IsOptional({ groups: ['g1'] })
    @MinLength(3, { groups: ['x'] })
    p: unknown = undefined;
  }

  it('does not treat it as optional when its own group is not selected', () => {
    const errors = validateSync(new OptionalOffConstraintOn(), { groups: ['x'] });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('treats it as optional when the optional marker’s group is selected', () => {
    expect(validateSync(new OptionalOffConstraintOn(), { groups: ['g1'] })).toHaveLength(0);
  });
});
