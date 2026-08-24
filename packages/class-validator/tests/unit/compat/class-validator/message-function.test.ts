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
