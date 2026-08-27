/**
 * `each: true` applies a constraint to every element of an iterable property
 * instead of to the property value itself.
 *
 * Behaviour verified against class-validator 0.14.4: one error per property
 * (not per element), `value` is the whole collection, the default message is
 * prefixed with "each value", a user-supplied message is not, a
 * non-iterable value is skipped, and Sets are treated like arrays.
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../../../src';
import { IsArray, IsString, MinLength } from '../../../../src/decorators';

describe('each option', () => {
  it('reports one error when every element fails', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['ab', 'cd'];
    }

    const errors = validateSync(new Dto());

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('tags');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('reports an error when only one element fails', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['abcdef', 'cd'];
    }

    expect(validateSync(new Dto())).toHaveLength(1);
  });

  it('reports nothing when every element passes', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['abcdef', 'ghijkl'];
    }

    expect(validateSync(new Dto())).toHaveLength(0);
  });

  it('reports the whole collection as the error value', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['ab', 'cd'];
    }

    expect(validateSync(new Dto())[0].value).toEqual(['ab', 'cd']);
  });

  it('prefixes the default message with "each value"', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['ab'];
    }

    expect(validateSync(new Dto())[0].constraints?.minLength).toMatch(/^each value /);
  });

  it('leaves a user-supplied message unprefixed', () => {
    class Dto {
      @MinLength(5, { each: true, message: 'tags are too short' })
      tags = ['ab'];
    }

    expect(validateSync(new Dto())[0].constraints?.minLength).toBe('tags are too short');
  });

  it('skips a value that is not a collection', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = 'not an array' as unknown as string[];
    }

    expect(validateSync(new Dto())).toHaveLength(0);
  });

  it('reports nothing for an empty array', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags: string[] = [];
    }

    expect(validateSync(new Dto())).toHaveLength(0);
  });

  it('validates the elements of a Set', () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = new Set(['ab']) as unknown as string[];
    }

    expect(validateSync(new Dto())).toHaveLength(1);
  });

  it('applies a type constraint to each element', () => {
    class Dto {
      @IsString({ each: true })
      tags = [1, 2] as unknown as string[];
    }

    // An array is not a string either, so the error alone proves nothing —
    // the prefix is what shows the elements were the thing checked.
    expect(validateSync(new Dto())[0].constraints?.isString).toMatch(/^each value /);
  });

  it('validates the property itself when each is absent', () => {
    class Dto {
      @IsArray()
      tags = 'not an array' as unknown as string[];
    }

    expect(validateSync(new Dto())).toHaveLength(1);
  });

  it('applies each on the async path too', async () => {
    class Dto {
      @MinLength(5, { each: true })
      tags = ['ab', 'cd'];
    }

    const errors = await validate(new Dto());

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.minLength).toMatch(/^each value /);
  });

  // The deduplicator collapses constraints that look identical. `each` has to
  // take part in that comparison, or `@MinLength(5)` and
  // `@MinLength(5, { each: true })` on one property silently become one. These
  // two cases fail the surviving constraint in turn, so together they prove
  // both are still registered.

  it('keeps the non-each constraint when both are declared', () => {
    class Dto {
      @IsArray()
      @IsArray({ each: true })
      // Not a collection: the per-element check skips it, the check on the
      // property itself fails.
      tags = 'not an array' as unknown as string[][];
    }

    const errors = validateSync(new Dto());

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isArray).not.toMatch(/^each value /);
  });

  it('keeps the each constraint when both are declared', () => {
    class Dto {
      @IsArray()
      @IsArray({ each: true })
      // An array of non-arrays: the check on the property itself passes, the
      // per-element check fails.
      tags = [1, 2] as unknown as string[][];
    }

    const errors = validateSync(new Dto());

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isArray).toMatch(/^each value /);
  });
});
