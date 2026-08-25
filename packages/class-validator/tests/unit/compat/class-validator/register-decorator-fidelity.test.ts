import { describe, it, expect } from 'vitest';
import {
  registerDecorator,
  validate,
  validateSync,
  Validate,
  ValidatorConstraint,
} from '../../../../src';
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

// Deliberately undecorated: exercises the compat-only lowerFirst(class name)
// fallback and the "explicit name wins when there is no class metadata" path.
class BareLongerThanConstraint {
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

    // Accepted by the first validator, rejected only by the second one:
    // if the second registration were dropped this would validate clean.
    const short = Object.assign(new Dto(), { v: 'ab' });
    const shortErrors = validateSync(short);
    expect(shortErrors).toHaveLength(1);
    // Both unnamed inline validators share the default key by design.
    expect(Object.keys(shortErrors[0].constraints!)).toEqual(['customValidation']);

    // Rejected only by the first validator.
    expect(validateSync(Object.assign(new Dto(), { v: 42 as any }))).toHaveLength(1);

    // Accepted by both.
    expect(validateSync(Object.assign(new Dto(), { v: 'abc' }))).toHaveLength(0);
  });

  it('enforces the same constraint class registered twice with different constraints', () => {
    class Dto {
      a = 'aaaa'; // 4
      b = 'bbbbbb'; // 6
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

    // Longer than `a` but not longer than `b`: only the second registration
    // rejects it, so this is red if the second registration is dropped.
    const errors = validateSync(Object.assign(new Dto(), { v: 'xxxxx' }));
    expect(errors).toHaveLength(1);
    // Both registrations resolve to the same name, so they collide on one key.
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);

    expect(validateSync(Object.assign(new Dto(), { v: 'xxxxxxx' }))).toHaveLength(0);
  });

  it('enforces registrations that differ only by options.groups', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      options: { groups: ['create'] },
      validator: IsLongerThanConstraint,
    });
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      options: { groups: ['update'] },
      validator: IsLongerThanConstraint,
    });
    // Behavioural assertion first: if the 'update' registration is dropped as a
    // duplicate, nothing runs for the 'update' group and an invalid value
    // silently passes.
    expect(validateSync(new Dto(), { groups: ['update'] })).toHaveLength(1);
    expect(validateSync(new Dto(), { groups: ['create'] })).toHaveLength(1);
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
        options: { groups: ['create'], message: 'nope' },
        validator: IsLongerThanConstraint,
      });
    }
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(1);
  });

  it('lets the class @ValidatorConstraint name win over an explicit name (upstream precedence)', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      name: 'explicitlyPassedName',
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: IsLongerThanConstraint,
    });
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });

  it('uses the explicit name when the constraint class has no @ValidatorConstraint metadata', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      name: 'explicitlyPassedName',
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: BareLongerThanConstraint,
    });
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['explicitlyPassedName']);
  });

  it('falls back to the lower-cased class name for an undecorated, unnamed constraint class', () => {
    class Dto {
      a = 'aaaa';
      v = 'x';
    }
    registerDecorator({
      target: Dto,
      propertyName: 'v',
      constraints: ['a'],
      validator: BareLongerThanConstraint,
    });
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['bareLongerThanConstraint']);
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

  it('does not lose a failing validator named __proto__', () => {
    @ValidatorConstraint({ name: '__proto__' })
    class ProtoNamedConstraint {
      validate() {
        return false;
      }
    }
    class ClassDto {
      v = 'x';
    }
    registerDecorator({ target: ClassDto, propertyName: 'v', validator: ProtoNamedConstraint });
    const classErrors = validateSync(new ClassDto());
    expect(classErrors).toHaveLength(1);
    expect(Object.keys(classErrors[0].constraints!)).toEqual(['custom']);

    class InlineDto {
      v = 'x';
    }
    registerDecorator({
      name: '__proto__',
      target: InlineDto,
      propertyName: 'v',
      validator: { validate: () => false },
    });
    const inlineErrors = validateSync(new InlineDto());
    expect(inlineErrors).toHaveLength(1);
    expect(Object.keys(inlineErrors[0].constraints!)).toEqual(['custom']);
  });

  it('stopAtFirstError keeps the first declared named custom constraint', async () => {
    @ValidatorConstraint({ name: 'slowFail' })
    class SlowFailConstraint {
      async validate() {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return false;
      }
    }
    @ValidatorConstraint({ name: 'fastFail' })
    class FastFailConstraint {
      validate() {
        return false;
      }
    }
    class Dto {
      v = 'x';
    }
    // Declared first, but records its error last — so keeping the first
    // *declared* key requires the compiled order map to know both names.
    registerDecorator({ target: Dto, propertyName: 'v', validator: SlowFailConstraint });
    registerDecorator({ target: Dto, propertyName: 'v', validator: FastFailConstraint });

    const all = await validate(new Dto());
    expect(Object.keys(all[0].constraints!).sort()).toEqual(['fastFail', 'slowFail']);

    const trimmed = await validate(new Dto(), { stopAtFirstError: true });
    expect(Object.keys(trimmed[0].constraints!)).toEqual(['slowFail']);
  });

  it('treats two applications of one inline validator factory as one registration', () => {
    // Known limitation: inline validator objects that are not reference-equal
    // are compared by the source text of `validate`, which is identical for
    // two applications of the same parameterized factory.
    const minLen = (n: number) => ({ validate: (value: any) => value.length >= n });
    class Dto {
      v = 'ab';
    }
    registerDecorator({ target: Dto, propertyName: 'v', validator: minLen(3) });
    registerDecorator({ target: Dto, propertyName: 'v', validator: minLen(5) });

    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(1);

    // Distinct names are the documented way to keep both.
    class NamedDto {
      v = 'abcd';
    }
    registerDecorator({
      name: 'minLen3',
      target: NamedDto,
      propertyName: 'v',
      validator: minLen(3),
    });
    registerDecorator({
      name: 'minLen5',
      target: NamedDto,
      propertyName: 'v',
      validator: minLen(5),
    });
    const errors = validateSync(new NamedDto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['minLen5']);
  });

  it('dedupes a reference-equal inline validator across repeated registrations', () => {
    const hoisted = { validate: (value: any) => typeof value === 'string' };
    class Dto {
      v = 'ok';
    }
    for (let i = 0; i < 50; i++) {
      registerDecorator({ target: Dto, propertyName: 'v', validator: hoisted });
    }
    expect(getValidationMetadata(Dto).properties.get('v')!.constraints).toHaveLength(1);
  });
});
