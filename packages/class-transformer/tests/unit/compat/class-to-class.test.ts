/**
 * `classToClass` / `instanceToInstance` must produce a deep clone.
 *
 * It was implemented as a classToPlain -> plainToClass round trip with the
 * transformation type left at 'classToClass' for both legs, which meant no
 * leg recursed (each descends only for its own direction) and `@Transform`
 * ran twice — once per leg.
 *
 * Behaviour verified against class-transformer 0.5.1: nested values are
 * cloned and keep their class, taken from the value itself rather than from
 * `@Type`; Dates are cloned; `@Transform` runs once; and `@Exclude()` does
 * *not* remove a property in this direction — upstream keeps it, unlike in
 * class->plain.
 */

import { describe, it, expect } from 'vitest';
import { classToClass, instanceToInstance, Exclude, Transform, Type } from '../../../src';

class Inner {
  v = 'V';
}

describe('classToClass', () => {
  it('returns a new instance of the same class', () => {
    class Dto {
      label = 'L';
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone).not.toBe(source);
    expect(clone).toBeInstanceOf(Dto);
    expect(clone.label).toBe('L');
  });

  it('clones a nested instance declared with @Type', () => {
    class Dto {
      @Type(() => Inner)
      inner = new Inner();
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.inner).not.toBe(source.inner);
    expect(clone.inner).toBeInstanceOf(Inner);
    expect(clone.inner.v).toBe('V');
  });

  it('clones a nested instance with no @Type, keeping its class', () => {
    class Dto {
      inner = new Inner();
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.inner).not.toBe(source.inner);
    expect(clone.inner).toBeInstanceOf(Inner);
  });

  it('clones arrays rather than sharing them', () => {
    class Dto {
      tags = ['a', 'b'];
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.tags).not.toBe(source.tags);
    expect(clone.tags).toEqual(['a', 'b']);
  });

  it('clones each element of an array of instances', () => {
    class Dto {
      items = [new Inner(), new Inner()];
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.items[0]).not.toBe(source.items[0]);
    expect(clone.items[0]).toBeInstanceOf(Inner);
    expect(clone.items).toHaveLength(2);
  });

  it('descends through more than one level', () => {
    class Level2 {
      value = 'deep';
    }
    class Level1 {
      level2 = new Level2();
    }
    class Level0 {
      level1 = new Level1();
    }
    const source = new Level0();
    const clone = classToClass(source);

    expect(clone.level1).not.toBe(source.level1);
    expect(clone.level1.level2).not.toBe(source.level1.level2);
    expect(clone.level1.level2).toBeInstanceOf(Level2);
    expect(clone.level1.level2.value).toBe('deep');
  });

  it('clones a Date instead of sharing or flattening it', () => {
    class Dto {
      at = new Date('2020-01-02T03:04:05.000Z');
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.at).not.toBe(source.at);
    expect(clone.at).toBeInstanceOf(Date);
    expect(clone.at.getTime()).toBe(source.at.getTime());
  });

  it('runs @Transform exactly once', () => {
    let calls = 0;
    class Dto {
      @Transform(({ value }) => {
        calls++;
        return (value as number) + 1;
      })
      n = 1;
    }

    const clone = classToClass(new Dto());

    expect(calls).toBe(1);
    expect(clone.n).toBe(2);
  });

  it('keeps an @Exclude()d property, as upstream does in this direction', () => {
    class Dto {
      keep = 'K';

      @Exclude()
      secret = 'S';
    }

    expect(classToClass(new Dto()).secret).toBe('S');
  });

  it('fills an @Exclude()d property from the field initializer, not the source', () => {
    class Dto {
      keep = 'K';

      @Exclude()
      secret = 'DEFAULT';
    }
    const source = new Dto();
    source.secret = 'CHANGED';
    source.keep = 'CHANGED';

    const clone = classToClass(source);

    // Upstream constructs the target and never copies the excluded property,
    // so the initializer's value survives and the source's does not.
    expect(clone.keep).toBe('CHANGED');
    expect(clone.secret).toBe('DEFAULT');
  });

  it('keeps Map and Set as themselves', () => {
    class Dto {
      m = new Map([['a', 1]]);
      s = new Set([1, 2]);
    }
    const source = new Dto();
    const clone = classToClass(source);

    expect(clone.m).toBeInstanceOf(Map);
    expect(clone.m.get('a')).toBe(1);
    expect(clone.s).toBeInstanceOf(Set);
    expect(clone.s.has(2)).toBe(true);
    expect(clone.m).not.toBe(source.m);
  });

  it('leaves primitives and null alone', () => {
    class Dto {
      count = 3;
      nothing: unknown = null;
    }
    const clone = classToClass(new Dto());

    expect(clone.count).toBe(3);
    expect(clone.nothing).toBeNull();
  });

  it('clones an array of instances passed at the top level', () => {
    const source = [new Inner(), new Inner()];
    const clone = classToClass(source);

    expect(clone).toHaveLength(2);
    expect(clone[0]).not.toBe(source[0]);
    expect(clone[0]).toBeInstanceOf(Inner);
  });

  it('is the same function as instanceToInstance', () => {
    expect(instanceToInstance).toBe(classToClass);
  });
});
