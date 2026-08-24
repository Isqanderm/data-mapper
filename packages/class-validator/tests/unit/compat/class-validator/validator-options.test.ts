import { describe, it, expect } from 'vitest';
import {
  IsString,
  IsDefined,
  MinLength,
  IsUppercase,
  validate,
  validateSync,
} from '../../../../src';

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
