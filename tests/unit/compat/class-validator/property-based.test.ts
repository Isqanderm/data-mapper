/**
 * Property-based testing with fast-check
 * Testing validators with randomly generated data to ensure they handle edge cases
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validateSync } from '../../../../src/compat/class-validator';
import {
  IsEmail,
  IsURL,
  IsUUID,
  IsISO8601,
  IsInt,
  IsPositive,
  IsNegative,
  MinLength,
  MaxLength,
  IsString,
  Min,
  Max,
  IsNumber,
  IsAlpha,
  IsAlphanumeric,
  IsHexColor,
  IsPort,
} from '../../../../src/compat/class-validator/decorators';

describe('Property-Based Testing - Email Validation', () => {
  it('should validate valid email addresses', () => {
    class EmailDto {
      @IsEmail()
      email: string;
    }

    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const dto = new EmailDto();
        dto.email = email;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid email addresses', () => {
    class EmailDto {
      @IsEmail()
      email: string;
    }

    // Generate strings that are NOT valid emails
    const invalidEmails = fc.oneof(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
      fc.constant(''),
      fc.constant('invalid'),
      fc.constant('@example.com'),
      fc.constant('user@'),
      fc.constant('user@domain'),
      fc.constant('user domain@example.com')
    );

    fc.assert(
      fc.property(invalidEmails, (email) => {
        const dto = new EmailDto();
        dto.email = email;
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property-Based Testing - URL Validation', () => {
  it('should validate valid URLs', () => {
    class UrlDto {
      @IsURL()
      url: string;
    }

    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const dto = new UrlDto();
        dto.url = url;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Testing - UUID Validation', () => {
  it('should validate valid UUIDs', () => {
    class UuidDto {
      @IsUUID()
      id: string;
    }

    fc.assert(
      fc.property(fc.uuid(), (uuid) => {
        const dto = new UuidDto();
        dto.id = uuid;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid UUIDs', () => {
    class UuidDto {
      @IsUUID()
      id: string;
    }

    const invalidUuids = fc.oneof(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.constant(''),
      fc.constant('not-a-uuid'),
      fc.constant('12345678-1234-1234-1234-12345678901'),
      fc.constant('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
    );

    fc.assert(
      fc.property(invalidUuids, (uuid) => {
        const dto = new UuidDto();
        dto.id = uuid;
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property-Based Testing - ISO8601 Date Validation', () => {
  it('should validate valid ISO8601 dates', () => {
    class DateDto {
      @IsISO8601()
      date: string;
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2147483647 }),
        (timestamp) => {
          const dto = new DateDto();
          const date = new Date(timestamp * 1000);
          dto.date = date.toISOString();
          const errors = validateSync(dto);
          return errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Testing - Number Validation', () => {
  it('should validate integers with @IsInt', () => {
    class IntDto {
      @IsInt()
      value: number;
    }

    fc.assert(
      fc.property(fc.integer(), (num) => {
        const dto = new IntDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject non-integers with @IsInt', () => {
    class IntDto {
      @IsInt()
      value: number;
    }

    fc.assert(
      fc.property(
        fc.double({ noNaN: true }).filter(n => Number.isFinite(n) && !Number.isInteger(n)),
        (num) => {
          const dto = new IntDto();
          dto.value = num;
          const errors = validateSync(dto);
          return errors.length > 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate positive numbers with @IsPositive', () => {
    class PositiveDto {
      @IsPositive()
      value: number;
    }

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (num) => {
        const dto = new PositiveDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject non-positive numbers with @IsPositive', () => {
    class PositiveDto {
      @IsPositive()
      value: number;
    }

    fc.assert(
      fc.property(fc.integer({ min: -1000000, max: 0 }), (num) => {
        const dto = new PositiveDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should validate negative numbers with @IsNegative', () => {
    class NegativeDto {
      @IsNegative()
      value: number;
    }

    fc.assert(
      fc.property(fc.integer({ min: -1000000, max: -1 }), (num) => {
        const dto = new NegativeDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should validate numbers with @Min and @Max', () => {
    class RangeDto {
      @IsNumber()
      @Min(10)
      @Max(100)
      value: number;
    }

    fc.assert(
      fc.property(fc.integer({ min: 10, max: 100 }), (num) => {
        const dto = new RangeDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject numbers outside range with @Min and @Max', () => {
    class RangeDto {
      @IsNumber()
      @Min(10)
      @Max(100)
      value: number;
    }

    const outOfRange = fc.oneof(
      fc.integer({ min: -1000, max: 9 }),
      fc.integer({ min: 101, max: 1000 })
    );

    fc.assert(
      fc.property(outOfRange, (num) => {
        const dto = new RangeDto();
        dto.value = num;
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property-Based Testing - String Length Validation', () => {
  it('should validate strings with @MinLength', () => {
    class MinLengthDto {
      @IsString()
      @MinLength(5)
      value: string;
    }

    fc.assert(
      fc.property(fc.string({ minLength: 5, maxLength: 100 }), (str) => {
        const dto = new MinLengthDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject strings shorter than @MinLength', () => {
    class MinLengthDto {
      @IsString()
      @MinLength(5)
      value: string;
    }

    fc.assert(
      fc.property(fc.string({ maxLength: 4 }), (str) => {
        const dto = new MinLengthDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should validate strings with @MaxLength', () => {
    class MaxLengthDto {
      @IsString()
      @MaxLength(10)
      value: string;
    }

    fc.assert(
      fc.property(fc.string({ maxLength: 10 }), (str) => {
        const dto = new MaxLengthDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should validate strings with both @MinLength and @MaxLength', () => {
    class RangeLengthDto {
      @IsString()
      @MinLength(5)
      @MaxLength(20)
      value: string;
    }

    fc.assert(
      fc.property(fc.string({ minLength: 5, maxLength: 20 }), (str) => {
        const dto = new RangeLengthDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Testing - String Format Validation', () => {
  it('should validate alphabetic strings with @IsAlpha', () => {
    class AlphaDto {
      @IsAlpha()
      value: string;
    }

    // Generate strings with only letters (a-z, A-Z)
    const alphaChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    const alphaString = fc.array(alphaChar, { minLength: 1, maxLength: 20 }).map(arr => arr.join(''));

    fc.assert(
      fc.property(alphaString, (str) => {
        const dto = new AlphaDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should validate alphanumeric strings with @IsAlphanumeric', () => {
    class AlphanumericDto {
      @IsAlphanumeric()
      value: string;
    }

    // Generate strings with only letters and numbers
    const alphanumericChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''));
    const alphanumericString = fc.array(alphanumericChar, { minLength: 1, maxLength: 20 }).map(arr => arr.join(''));

    fc.assert(
      fc.property(alphanumericString, (str) => {
        const dto = new AlphanumericDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should validate hex colors with @IsHexColor', () => {
    class HexColorDto {
      @IsHexColor()
      value: string;
    }

    // Generate valid hex colors (3 or 6 hex digits)
    const hexDigit = fc.constantFrom(...'0123456789abcdefABCDEF'.split(''));
    const hexColor = fc.oneof(
      fc.array(hexDigit, { minLength: 6, maxLength: 6 }).map(arr => `#${arr.join('')}`),
      fc.array(hexDigit, { minLength: 3, maxLength: 3 }).map(arr => `#${arr.join('')}`)
    );

    fc.assert(
      fc.property(hexColor, (color) => {
        const dto = new HexColorDto();
        dto.value = color;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should validate port numbers with @IsPort', () => {
    class PortDto {
      @IsPort()
      value: string;
    }

    fc.assert(
      fc.property(fc.integer({ min: 0, max: 65535 }), (port) => {
        const dto = new PortDto();
        dto.value = port.toString();
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid port numbers with @IsPort', () => {
    class PortDto {
      @IsPort()
      value: string;
    }

    const invalidPorts = fc.oneof(
      fc.integer({ min: 65536, max: 100000 }),
      fc.integer({ min: -100000, max: -1 })
    );

    fc.assert(
      fc.property(invalidPorts, (port) => {
        const dto = new PortDto();
        dto.value = port.toString();
        const errors = validateSync(dto);
        return errors.length > 0;
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property-Based Testing - Edge Cases', () => {
  it('should handle empty strings consistently', () => {
    class EmptyStringDto {
      @IsString()
      @MinLength(1)
      value: string;
    }

    const dto = new EmptyStringDto();
    dto.value = '';
    const errors = validateSync(dto);

    // Empty string should fail MinLength(1)
    fc.assert(
      fc.property(fc.constant(''), () => {
        return errors.length > 0;
      }),
      { numRuns: 10 }
    );
  });

  it('should handle very large numbers', () => {
    class LargeNumberDto {
      @IsNumber()
      value: number;
    }

    fc.assert(
      fc.property(fc.double({ min: -1e10, max: 1e10, noNaN: true }), (num) => {
        const dto = new LargeNumberDto();
        dto.value = num;
        const errors = validateSync(dto);
        // Should pass if it's a valid number (not NaN or Infinity)
        return errors.length === 0 || !Number.isFinite(num);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle unicode strings', () => {
    class UnicodeDto {
      @IsString()
      value: string;
    }

    fc.assert(
      fc.property(fc.string(), (str) => {
        const dto = new UnicodeDto();
        dto.value = str;
        const errors = validateSync(dto);
        return errors.length === 0;
      }),
      { numRuns: 50 }
    );
  });
});

