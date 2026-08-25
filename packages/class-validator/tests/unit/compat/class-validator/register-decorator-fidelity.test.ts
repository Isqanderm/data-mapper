import { describe, it, expect } from 'vitest';
import { registerDecorator, validateSync, Validate, ValidatorConstraint } from '../../../../src';
import { getValidationMetadata } from '../../../../src/engine/metadata';
import type { ValidationArguments } from '../../../../src';

@ValidatorConstraint({ name: 'isLongerThan' })
class IsLongerThanConstraint {
  validate(value: any, args?: ValidationArguments) {
    const [related] = args!.constraints;
    const other = (args!.object as any)[related];
    return typeof value === 'string' && typeof other === 'string' && value.length > other.length;
  }
}

describe('registerDecorator fidelity', () => {
  it('enforces BOTH unnamed inline validators on one property', () => {
    class Dto {
      v!: string;
    }
    // Two different unnamed inline validators, registered the way the
    // documented TC39 migration pattern does (imperative, per property).
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      validator: { validate: (value: any) => typeof value === 'string' },
    });
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      validator: { validate: (value: any) => typeof value === 'string' && value.length >= 3 },
    });
    const short = Object.assign(new Dto(), { v: 'ab' });
    const errors = validateSync(short);
    expect(errors).toHaveLength(1); // second validator must actually run
  });

  it('enforces the same constraint class registered twice with different constraints', () => {
    class Dto {
      a = 'aaaa';
      b = 'bbbbbb';
      v!: string;
    }
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: IsLongerThanConstraint,
    });
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['b'],
      validator: IsLongerThanConstraint,
    });
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(2);
  });

  it('does not grow metadata when the identical registration repeats', () => {
    class Dto {
      v!: string;
    }
    for (let i = 0; i < 50; i++) {
      registerDecorator({
        target: Dto,
        propertyName: 'v',
        constraints: ['a'],
        validator: IsLongerThanConstraint,
      });
    }
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(1);
  });

  it('reports class-based validators under their registered name', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      name: 'isLongerThan',
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: IsLongerThanConstraint,
    });
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });

  it('@Validate reports under the @ValidatorConstraint name', () => {
    class Dto {
      a = 'aaaa';
      @Validate(IsLongerThanConstraint, ['a'])
      v = 'x';
    }
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });
});
