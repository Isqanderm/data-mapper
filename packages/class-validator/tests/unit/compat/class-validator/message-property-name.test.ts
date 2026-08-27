/**
 * Default messages name the property they are about.
 *
 * Upstream writes `t must be longer than or equal to 3 characters`; this
 * package wrote `must be at least 3 characters`, so anything showing
 * `error.constraints` to a person — a form, an API response, a log line —
 * could not tell which field the sentence referred to without pairing it back
 * up with `error.property` by hand.
 *
 * The texts themselves still differ from upstream's wording; only the
 * property prefix is matched here. A caller-supplied message is untouched.
 */

import { describe, it, expect } from 'vitest';
import { validateSync } from '../../../../src';
import {
  ArrayMinSize,
  ArrayUnique,
  IsEmail,
  IsLatitude,
  IsNotEmpty,
  MaxDate,
  MinDate,
  MinLength,
} from '../../../../src/decorators';

const messageOf = (o: object) => Object.values(validateSync(o)[0]?.constraints ?? {})[0];

describe('default messages name their property', () => {
  it('prefixes a length message', () => {
    class Dto {
      @MinLength(3)
      username = 'ab';
    }
    expect(messageOf(new Dto())).toBe('username must be at least 3 characters');
  });

  it('prefixes a format message', () => {
    class Dto {
      @IsEmail()
      contact = 'nope';
    }
    expect(messageOf(new Dto())).toBe('contact must be an email');
  });

  it('prefixes an emptiness message', () => {
    class Dto {
      @IsNotEmpty()
      title = '';
    }
    expect(messageOf(new Dto())).toBe('title should not be empty');
  });

  it('prefixes an array message', () => {
    class Dto {
      @ArrayMinSize(2)
      items = [1];
    }
    expect(messageOf(new Dto())).toBe('items must contain at least 2 elements');
  });

  describe('messages that used to start with their own noun', () => {
    it('reads correctly for a latitude', () => {
      class Dto {
        @IsLatitude()
        lat = 999;
      }
      expect(messageOf(new Dto())).toBe('lat must be a number between -90 and 90');
    });

    it('reads correctly for array uniqueness', () => {
      class Dto {
        @ArrayUnique()
        tags = [1, 1];
      }
      expect(messageOf(new Dto())).toBe('tags must contain only unique values');
    });

    it('reads correctly for a minimum date', () => {
      class Dto {
        @MinDate(new Date('2020-01-01T00:00:00.000Z'))
        when = new Date('2019-01-01T00:00:00.000Z');
      }
      expect(messageOf(new Dto())).toBe('when must not be before 2020-01-01T00:00:00.000Z');
    });

    it('reads correctly for a maximum date', () => {
      class Dto {
        @MaxDate(new Date('2020-01-01T00:00:00.000Z'))
        when = new Date('2021-01-01T00:00:00.000Z');
      }
      expect(messageOf(new Dto())).toBe('when must not be after 2020-01-01T00:00:00.000Z');
    });
  });

  describe('each', () => {
    it('names the property after the each prefix, as upstream does', () => {
      class Dto {
        @MinLength(5, { each: true })
        tags = ['ab'];
      }
      expect(messageOf(new Dto())).toBe('each value in tags must be at least 5 characters');
    });
  });

  describe('caller-supplied messages', () => {
    it('leaves a string message exactly as written', () => {
      class Dto {
        @MinLength(3, { message: 'too short' })
        username = 'ab';
      }
      expect(messageOf(new Dto())).toBe('too short');
    });

    it('leaves a string message alone under each too', () => {
      class Dto {
        @MinLength(5, { each: true, message: 'tag too short' })
        tags = ['ab'];
      }
      expect(messageOf(new Dto())).toBe('tag too short');
    });

    it('leaves a function message alone', () => {
      class Dto {
        @MinLength(3, { message: (args) => `${args.property}: ${String(args.value)}` })
        username = 'ab';
      }
      expect(messageOf(new Dto())).toBe('username: ab');
    });
  });
});
