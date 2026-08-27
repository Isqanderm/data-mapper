/**
 * Error keys and the rejection shape must match class-validator 0.14.4.
 *
 * Consumers read `error.constraints.isUrl` and `catch (errors) { errors.map(…) }`.
 * A key spelled differently, or a rejection that is not the error array, breaks
 * that code silently at the point where it reads `undefined`.
 *
 * Every expectation below was measured against class-validator 0.14.4.
 */

import { describe, it, expect } from 'vitest';
import { validateOrReject, validateOrRejectSync, validateSync } from '../../../../src';
import {
  IsDateString,
  IsFQDN,
  IsIP,
  IsISBN,
  IsISIN,
  IsISO8601,
  IsJSON,
  IsJWT,
  IsMACAddress,
  IsNegative,
  IsPositive,
  IsURL,
  IsUUID,
  Length,
  MinLength,
} from '../../../../src/decorators';

const keyOf = (o: object) => Object.keys(validateSync(o)[0]?.constraints ?? {});

describe('error keys', () => {
  describe('acronyms are spelled as upstream spells them', () => {
    it('@IsURL reports isUrl', () => {
      class Dto {
        @IsURL()
        p = '~~~';
      }
      expect(keyOf(new Dto())).toEqual(['isUrl']);
    });

    it('@IsUUID reports isUuid', () => {
      class Dto {
        @IsUUID()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isUuid']);
    });

    it('@IsJSON reports isJson', () => {
      class Dto {
        @IsJSON()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isJson']);
    });

    it('@IsIP reports isIp', () => {
      class Dto {
        @IsIP()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isIp']);
    });

    it('@IsFQDN reports isFqdn', () => {
      class Dto {
        @IsFQDN()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isFqdn']);
    });

    it('@IsISO8601 reports isIso8601', () => {
      class Dto {
        @IsISO8601()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isIso8601']);
    });

    it('@IsJWT reports isJwt', () => {
      class Dto {
        @IsJWT()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isJwt']);
    });

    it('@IsMACAddress reports isMacAddress', () => {
      class Dto {
        @IsMACAddress()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isMacAddress']);
    });

    it('@IsISIN reports isIsin', () => {
      class Dto {
        @IsISIN()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isIsin']);
    });

    it('@IsISBN reports isIsbn', () => {
      class Dto {
        @IsISBN()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isIsbn']);
    });
  });

  describe('decorators that reported another constraint’s key', () => {
    it('@Length reports isLength, not minLength', () => {
      class TooShort {
        @Length(2, 4)
        p = 'a';
      }
      expect(keyOf(new TooShort())).toEqual(['isLength']);
    });

    it('@Length reports isLength for a value over the maximum too', () => {
      class TooLong {
        @Length(2, 4)
        p = 'abcdef';
      }
      expect(keyOf(new TooLong())).toEqual(['isLength']);
    });

    it('@Length accepts a value inside the range', () => {
      class Ok {
        @Length(2, 4)
        p = 'abc';
      }
      expect(validateSync(new Ok())).toHaveLength(0);
    });

    it('@IsDateString reports isDateString, not isIso8601', () => {
      class Dto {
        @IsDateString()
        p = 'x';
      }
      expect(keyOf(new Dto())).toEqual(['isDateString']);
    });

    it('@IsPositive reports isPositive, not min', () => {
      class Dto {
        @IsPositive()
        p = -1;
      }
      expect(keyOf(new Dto())).toEqual(['isPositive']);
    });

    it('@IsNegative reports isNegative, not max', () => {
      class Dto {
        @IsNegative()
        p = 1;
      }
      expect(keyOf(new Dto())).toEqual(['isNegative']);
    });
  });

  describe('@IsPositive / @IsNegative measure the sign, not an epsilon', () => {
    it('accepts a very small positive number', () => {
      class Dto {
        @IsPositive()
        p = 5e-7;
      }
      expect(validateSync(new Dto())).toHaveLength(0);
    });

    it('accepts a very small negative number', () => {
      class Dto {
        @IsNegative()
        p = -5e-7;
      }
      expect(validateSync(new Dto())).toHaveLength(0);
    });

    it('rejects zero as positive', () => {
      class Dto {
        @IsPositive()
        p = 0;
      }
      expect(validateSync(new Dto())).toHaveLength(1);
    });

    it('rejects zero as negative', () => {
      class Dto {
        @IsNegative()
        p = 0;
      }
      expect(validateSync(new Dto())).toHaveLength(1);
    });
  });
});

describe('validateOrReject', () => {
  class Dto {
    @MinLength(5)
    p = 'ab';
  }

  it('rejects with the error array itself', async () => {
    await expect(validateOrReject(new Dto())).rejects.toSatisfy(Array.isArray);
  });

  it('rejects with errors a caller can read', async () => {
    try {
      await validateOrReject(new Dto());
      throw new Error('should have rejected');
    } catch (rejected) {
      const errors = rejected as { property: string; constraints?: Record<string, string> }[];
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('p');
      expect(errors[0].constraints).toHaveProperty('minLength');
    }
  });

  it('throws the error array from the sync twin as well', () => {
    // Not an upstream API, but the two must not disagree about what they throw.
    try {
      validateOrRejectSync(new Dto());
      throw new Error('should have thrown');
    } catch (thrown) {
      expect(Array.isArray(thrown)).toBe(true);
      expect((thrown as { property: string }[])[0].property).toBe('p');
    }
  });

  it('resolves for a valid object', async () => {
    class Valid {
      @MinLength(1)
      p = 'ok';
    }
    await expect(validateOrReject(new Valid())).resolves.toBeUndefined();
  });
});
