/**
 * registerDecorator compat API
 *
 * Lets consumers build custom TC39-decorator-based validators using the
 * same shape as class-validator's `registerDecorator`, without requiring
 * a `@ValidatorConstraint`-decorated class.
 */

import { addValidationConstraint, getValidationMetadata } from './engine/metadata';
import type { ValidationDecoratorOptions, ValidationArguments } from './types';
import type { ValidatorConstraintInterface } from './decorators/custom';

export interface RegisterDecoratorOptions {
  /** Constraint name used as the key in ValidationError.constraints */
  name?: string;
  /** Class constructor the property belongs to */
  target: Function;
  propertyName: string;
  /** Extra constraint arguments, exposed as ValidationArguments.constraints */
  constraints?: any[];
  options?: ValidationDecoratorOptions;
  /** Inline validator object or ValidatorConstraint class */
  validator: ValidatorConstraintInterface | (new () => ValidatorConstraintInterface);
  async?: boolean;
}

export function registerDecorator(args: RegisterDecoratorOptions): void {
  const { validator } = args;

  // addInitializer runs on every instance construction; guard against
  // re-registering the same logical constraint on repeated instantiation.
  const existingConstraints = getValidationMetadata(args.target).properties.get(
    args.propertyName,
  )?.constraints;
  if (existingConstraints) {
    const isDuplicate = existingConstraints.some((existing) => {
      if (typeof validator === 'function') {
        return existing.type === 'custom' && existing.value?.constraintClass === validator;
      }
      return (
        existing.type === 'validateBy' && existing.value?.name === (args.name || 'customValidation')
      );
    });
    if (isDuplicate) return;
  }

  if (typeof validator === 'function') {
    // ValidatorConstraint class → compiled via the 'custom' constraint path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'custom',
      value: {
        constraintClass: validator,
        constraints: args.constraints || [],
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
    });
  } else {
    // Inline validator object → compiled via the 'validateBy' path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'validateBy',
      value: {
        name: args.name || 'customValidation',
        validator: (value: any, validationArgs?: ValidationArguments) =>
          validator.validate(value, validationArgs),
        defaultMessage: validator.defaultMessage?.bind(validator),
        constraints: args.constraints || [],
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
    });
  }
}
