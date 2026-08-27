/**
 * class->plain must descend into nested values.
 *
 * Without recursion a nested instance is copied through untouched, so its
 * `@Exclude()` never runs and the excluded field reaches the output — the
 * failure mode these tests exist to prevent. Verified against
 * class-transformer 0.5.1, whose recursion does not depend on `@Type`.
 */

import { describe, it, expect } from 'vitest';
import { classToPlain, serialize, Exclude, Expose, Type } from '../../../src';

class Credentials {
  user = 'admin';

  @Exclude()
  password = 'SECRET';
}

describe('class->plain recursion into nested values', () => {
  it('applies a nested @Exclude when the property has no @Type', () => {
    class Account {
      label = 'primary';
      credentials = new Credentials();
    }

    const plain = classToPlain(new Account()) as { credentials: Record<string, unknown> };

    expect(plain.credentials).toEqual({ user: 'admin' });
  });

  it('applies a nested @Exclude when the property has @Type', () => {
    class Account {
      label = 'primary';

      @Type(() => Credentials)
      credentials = new Credentials();
    }

    const plain = classToPlain(new Account()) as { credentials: Record<string, unknown> };

    expect(plain.credentials).toEqual({ user: 'admin' });
  });

  it('keeps an excluded field out of serialize() output', () => {
    class Account {
      credentials = new Credentials();
    }

    expect(serialize(new Account())).not.toContain('SECRET');
  });

  it('applies nested @Exclude to every element of an array', () => {
    class Account {
      credentials = [new Credentials(), new Credentials()];
    }

    const plain = classToPlain(new Account()) as { credentials: Record<string, unknown>[] };

    expect(plain.credentials).toEqual([{ user: 'admin' }, { user: 'admin' }]);
  });

  it('applies a nested @Expose rename', () => {
    class Profile {
      @Expose({ name: 'display_name' })
      displayName = 'Ada';
    }
    class Account {
      profile = new Profile();
    }

    const plain = classToPlain(new Account()) as { profile: Record<string, unknown> };

    expect(plain.profile).toEqual({ display_name: 'Ada' });
  });

  it('descends through more than one level', () => {
    class Level2 {
      kept = 'yes';

      @Exclude()
      dropped = 'no';
    }
    class Level1 {
      level2 = new Level2();
    }
    class Level0 {
      level1 = new Level1();
    }

    const plain = classToPlain(new Level0()) as {
      level1: { level2: Record<string, unknown> };
    };

    expect(plain.level1.level2).toEqual({ kept: 'yes' });
  });

  it('leaves a Date as a Date instead of expanding it', () => {
    class Event {
      at = new Date('2020-01-02T03:04:05.000Z');
    }

    const plain = classToPlain(new Event()) as { at: unknown };

    expect(plain.at).toBeInstanceOf(Date);
  });

  it('leaves primitives, null and arrays of primitives alone', () => {
    class Misc {
      count = 3;
      label = 'x';
      nothing: unknown = null;
      tags = ['a', 'b'];
    }

    expect(classToPlain(new Misc())).toEqual({
      count: 3,
      label: 'x',
      nothing: null,
      tags: ['a', 'b'],
    });
  });

  it('copies a plain object literal through, including undecorated keys', () => {
    class Holder {
      meta: Record<string, unknown> = { a: 1, password: 'not decorated' };
    }

    const plain = classToPlain(new Holder()) as { meta: Record<string, unknown> };

    expect(plain.meta).toEqual({ a: 1, password: 'not decorated' });
  });
});
