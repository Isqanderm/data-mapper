import { describe, it, expect } from 'vitest';
import { registerDecorator, getMetadataStorage, validateSync } from '../../../../src';
import type { ValidationArguments, ValidationDecoratorOptions } from '../../../../src';

// TC39-adapted custom decorator, the documented migration pattern
function IsLongerThan(property: string, options?: ValidationDecoratorOptions) {
  return function (_: undefined, context: ClassFieldDecoratorContext) {
    context.addInitializer(function (this: any) {
      registerDecorator({
        name: 'isLongerThan',
        target: this.constructor,
        propertyName: String(context.name),
        constraints: [property],
        options,
        validator: {
          validate(value: any, args?: ValidationArguments) {
            const [related] = args!.constraints;
            const other = (args!.object as any)[related];
            return (
              typeof value === 'string' && typeof other === 'string' && value.length > other.length
            );
          },
          defaultMessage(args?: ValidationArguments) {
            return `${args!.property} must be longer than ${args!.constraints[0]}`;
          },
        },
      });
    });
  };
}

describe('registerDecorator', () => {
  class Dto {
    firstName: string = 'Alexander';
    @IsLongerThan('firstName')
    lastName: string = 'Li';
  }

  it('registers a working object-validator decorator', () => {
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('lastName');
    expect(errors[0].constraints!.isLongerThan).toBe('lastName must be longer than firstName');
  });

  it('does not duplicate constraints across instances', () => {
    new Dto();
    new Dto();
    const errors = validateSync(new Dto());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['isLongerThan']);
  });

  it('honors explicit message option', () => {
    class Dto2 {
      firstName = 'Long name';
      @IsLongerThan('firstName', { message: 'custom msg' })
      lastName = 'x';
    }
    expect(validateSync(new Dto2())[0].constraints!.isLongerThan).toBe('custom msg');
  });
});

describe('getMetadataStorage', () => {
  it('exposes registered metadata for a target', () => {
    class Dto3 {
      firstName = 'abc';
      @IsLongerThan('firstName')
      lastName = 'x';
    }
    new Dto3(); // metadata attaches on first instantiation (TC39 addInitializer)
    const entries = getMetadataStorage().getTargetValidationMetadatas(Dto3);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    const entry = entries.find((e) => e.propertyName === 'lastName')!;
    expect(entry.target).toBe(Dto3);
    expect(entry.type).toBe('validateBy');
    expect(entry.constraints).toEqual(['firstName']);
  });
});
