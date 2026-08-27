/**
 * A constraint must fail when the value is not of the type it measures.
 *
 * The generated checks were written as "if the type fits and the value is
 * bad, report an error", so a value of the wrong type fell out of the `if`
 * and was reported as valid. Upstream's predicates return false for a value
 * they cannot measure, which is an error.
 *
 * Matrix verified against class-validator 0.14.4: every listed decorator
 * rejects undefined, null, and any value outside the type it measures.
 * Allowing undefined is what `@IsOptional()` and the `skip*Properties`
 * options are for.
 */

import { describe, it, expect } from 'vitest';
import { validateSync } from '../../../../src';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsBoolean,
  IsDate,
  IsAlpha,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsJSON,
  IsURL,
  IsUUID,
} from '../../../../src/decorators';

class MinLen {
  @MinLength(3)
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class MaxLen {
  @MaxLength(3)
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Email {
  @IsEmail()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Alpha {
  @IsAlpha()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Json {
  @IsJSON()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Url {
  @IsURL()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Uuid {
  @IsUUID()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Str {
  @IsString()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Num {
  @IsNumber()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Int {
  @IsInt()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Minimum {
  @Min(5)
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Maximum {
  @Max(5)
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Bool {
  @IsBoolean()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class Dt {
  @IsDate()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class ArrMin {
  @ArrayMinSize(1)
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}
class ArrNotEmpty {
  @ArrayNotEmpty()
  p: unknown;
  constructor(v: unknown) {
    this.p = v;
  }
}

type Ctor = new (v: unknown) => object;

const stringDecorators: [string, Ctor, unknown][] = [
  ['@MinLength(3)', MinLen, 'abcd'],
  ['@MaxLength(3)', MaxLen, 'ab'],
  ['@IsEmail()', Email, 'a@b.co'],
  ['@IsString()', Str, 'abc'],
  ['@IsAlpha()', Alpha, 'abc'],
  ['@IsJSON()', Json, '{"a":1}'],
  ['@IsURL()', Url, 'https://example.com'],
  ['@IsUUID()', Uuid, '3f2504e0-4f89-41d3-9a0c-0305e82c3301'],
];

const numberDecorators: [string, Ctor, unknown][] = [
  ['@IsNumber()', Num, 7],
  ['@IsInt()', Int, 7],
  ['@Min(5)', Minimum, 7],
  ['@Max(5)', Maximum, 3],
];

const arrayDecorators: [string, Ctor, unknown][] = [
  ['@ArrayMinSize(1)', ArrMin, [1]],
  ['@ArrayNotEmpty()', ArrNotEmpty, [1]],
];

describe('values of the wrong type', () => {
  describe.each(stringDecorators)('%s', (_name, Cls, valid) => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a number', 12],
      ['an array', ['ab']],
      ['an object', {}],
      ['a boolean', true],
    ])('rejects %s', (_label, value) => {
      expect(validateSync(new Cls(value))).toHaveLength(1);
    });

    it('accepts a valid string', () => {
      expect(validateSync(new Cls(valid))).toHaveLength(0);
    });
  });

  describe.each(numberDecorators)('%s', (_name, Cls, valid) => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'abc'],
      ['an array', [1]],
      ['an object', {}],
      ['a boolean', true],
    ])('rejects %s', (_label, value) => {
      expect(validateSync(new Cls(value))).toHaveLength(1);
    });

    it('accepts a valid number', () => {
      expect(validateSync(new Cls(valid))).toHaveLength(0);
    });
  });

  describe.each(arrayDecorators)('%s', (_name, Cls, valid) => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'ab'],
      ['a number', 12],
      ['an object', {}],
    ])('rejects %s', (_label, value) => {
      expect(validateSync(new Cls(value))).toHaveLength(1);
    });

    it('accepts a valid array', () => {
      expect(validateSync(new Cls(valid))).toHaveLength(0);
    });
  });

  describe('@IsBoolean()', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'true'],
      ['a number', 1],
    ])('rejects %s', (_label, value) => {
      expect(validateSync(new Bool(value))).toHaveLength(1);
    });

    it('accepts a boolean', () => {
      expect(validateSync(new Bool(false))).toHaveLength(0);
    });
  });

  describe('@IsDate()', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a date string', '2020-01-02'],
      ['a number', 1577923200000],
    ])('rejects %s', (_label, value) => {
      expect(validateSync(new Dt(value))).toHaveLength(1);
    });

    it('accepts a Date', () => {
      expect(validateSync(new Dt(new Date('2020-01-02')))).toHaveLength(0);
    });
  });

  describe('escape hatches still work', () => {
    class OptionalString {
      @IsOptional()
      @MinLength(3)
      p: unknown;
      constructor(v: unknown) {
        this.p = v;
      }
    }

    it('lets @IsOptional() allow undefined', () => {
      expect(validateSync(new OptionalString(undefined))).toHaveLength(0);
    });

    it('lets @IsOptional() allow null', () => {
      expect(validateSync(new OptionalString(null))).toHaveLength(0);
    });

    it('still reports a bad value under @IsOptional()', () => {
      expect(validateSync(new OptionalString('ab'))).toHaveLength(1);
    });

    it('lets skipUndefinedProperties allow undefined', () => {
      expect(validateSync(new MinLen(undefined), { skipUndefinedProperties: true })).toHaveLength(
        0,
      );
    });

    it('lets skipMissingProperties allow null', () => {
      expect(validateSync(new MinLen(null), { skipMissingProperties: true })).toHaveLength(0);
    });
  });
});
