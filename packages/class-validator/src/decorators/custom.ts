/**
 * Custom validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions, ValidationArguments } from '../types';

/**
 * Interface for custom validator classes
 */
export interface ValidatorConstraintInterface {
  /**
   * Validation method
   */
  validate(value: any, args?: ValidationArguments): boolean | Promise<boolean>;

  /**
   * Default error message
   */
  defaultMessage?(args?: ValidationArguments): string;
}

/**
 * Options for @ValidatorConstraint decorator
 */
export interface ValidatorConstraintOptions {
  /**
   * Validator name
   */
  name?: string;

  /**
   * Is async validator
   */
  async?: boolean;
}

/**
 * Decorator to mark a class as a custom validator
 *
 * @param options - Validator options
 *
 * @example
 * ```typescript
 * @ValidatorConstraint({ name: 'isLongerThan', async: false })
 * class IsLongerThanConstraint implements ValidatorConstraintInterface {
 *   validate(value: string, args: ValidationArguments) {
 *     const [relatedPropertyName] = args.constraints;
 *     const relatedValue = (args.object as any)[relatedPropertyName];
 *     return value.length > relatedValue.length;
 *   }
 *
 *   defaultMessage(args: ValidationArguments) {
 *     return 'must be longer than $constraint1';
 *   }
 * }
 * ```
 */
export function ValidatorConstraint(options?: ValidatorConstraintOptions) {
  return function (target: any) {
    // Store validator metadata on the class
    target.__validatorMetadata = {
      name: options?.name || target.name,
      async: options?.async || false,
    };
    return target;
  };
}

/**
 * Validates using a custom validator class
 *
 * @param constraintClass - Custom validator class
 * @param constraints - Additional constraints to pass to validator
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Validate(IsLongerThanConstraint, ['firstName'])
 *   lastName: string;
 * }
 * ```
 */
export function Validate(
  constraintClass: new () => ValidatorConstraintInterface,
  constraints?: any[],
  options?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'custom',
        value: {
          constraintClass,
          constraints: constraints || [],
        },
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Base decorator for creating custom validation decorators
 *
 * @param options - Validation options with custom validation function
 *
 * @example
 * ```typescript
 * function IsEvenNumber(validationOptions?: ValidationDecoratorOptions) {
 *   return ValidateBy({
 *     name: 'isEvenNumber',
 *     validator: {
 *       validate: (value) => typeof value === 'number' && value % 2 === 0,
 *       defaultMessage: () => 'must be an even number',
 *     },
 *   }, validationOptions);
 * }
 * ```
 */
export function ValidateBy(
  options: {
    name: string;
    validator: {
      validate: (value: any, args?: ValidationArguments) => boolean | Promise<boolean>;
      defaultMessage?: (args?: ValidationArguments) => string;
    };
    constraints?: any[];
  },
  validationOptions?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'validateBy',
        value: {
          name: options.name,
          validator: options.validator.validate,
          defaultMessage: options.validator.defaultMessage,
          constraints: options.constraints || [],
        },
        message: validationOptions?.message,
        groups: validationOptions?.groups,
        always: validationOptions?.always,
      });
    });
  };
}

/**
 * Allows any value (used to mark properties that should be included in validation but not validated)
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Allow()
 *   metadata: any;
 * }
 * ```
 */
export function Allow() {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'allow',
      });
    });
  };
}

