/**
 * A subclass must validate its own constraints as well as the ones it inherits.
 *
 * Metadata is stored on the constructor, which subclasses see through the
 * static prototype chain. Without an own-property check a subclass writes into
 * its parent's metadata, and since compiled validators are cached by
 * `metadata.target`, the subclass then gets served the parent's validator —
 * so its own constraints never run. Which of the two classes is instantiated
 * first decides whether that happens, so both orders are covered here.
 *
 * Behaviour verified against class-validator 0.14.4.
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../../../src';
import { IsNotEmpty, MinLength } from '../../../../src/decorators';

describe('constraint inheritance', () => {
  it('validates own and inherited constraints when the parent is used first', () => {
    class Parent {
      @IsNotEmpty()
      a = '';
    }
    class Child extends Parent {
      @IsNotEmpty()
      b = '';
    }

    validateSync(new Parent());

    const properties = validateSync(new Child())
      .map((e) => e.property)
      .sort();

    expect(properties).toEqual(['a', 'b']);
  });

  it('validates own and inherited constraints when the subclass is used first', () => {
    class Parent {
      @IsNotEmpty()
      a = '';
    }
    class Child extends Parent {
      @IsNotEmpty()
      b = '';
    }

    const properties = validateSync(new Child())
      .map((e) => e.property)
      .sort();

    expect(properties).toEqual(['a', 'b']);
  });

  it('does not leak a subclass constraint into the parent', () => {
    class Parent {
      @IsNotEmpty()
      a = '';
    }
    class Child extends Parent {
      @IsNotEmpty()
      b = '';
    }

    validateSync(new Child());

    expect(validateSync(new Parent()).map((e) => e.property)).toEqual(['a']);
  });

  it('collects constraints from every level of a three-deep chain', () => {
    class A {
      @IsNotEmpty()
      a = '';
    }
    class B extends A {
      @IsNotEmpty()
      b = '';
    }
    class C extends B {
      @IsNotEmpty()
      c = '';
    }

    const properties = validateSync(new C())
      .map((e) => e.property)
      .sort();

    expect(properties).toEqual(['a', 'b', 'c']);
  });

  it('applies both constraints when parent and subclass decorate the same property', () => {
    class Parent {
      @MinLength(2)
      value = 'ok';
    }
    class Child extends Parent {
      @MinLength(10)
      value = 'ok';
    }

    // 'ok' clears the parent's minimum of 2 and fails the subclass's 10.
    const errors = validateSync(new Child());

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('inherits constraints into a subclass that declares none', () => {
    class Parent {
      @IsNotEmpty()
      a = '';
    }
    class Child extends Parent {}

    expect(validateSync(new Child()).map((e) => e.property)).toEqual(['a']);
  });

  it('validates own and inherited constraints on the async path', async () => {
    class Parent {
      @IsNotEmpty()
      a = '';
    }
    class Child extends Parent {
      @IsNotEmpty()
      b = '';
    }

    await validate(new Parent());

    const properties = (await validate(new Child())).map((e) => e.property).sort();

    expect(properties).toEqual(['a', 'b']);
  });

  it('reports a valid subclass instance as valid', () => {
    class Parent {
      @IsNotEmpty()
      a = 'set';
    }
    class Child extends Parent {
      @IsNotEmpty()
      b = 'set';
    }

    expect(validateSync(new Child())).toHaveLength(0);
  });
});
