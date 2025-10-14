/**
 * String validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is a string
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 * ```
 */
export function IsString(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isString',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length is not less than given number
 *
 * @param min - Minimum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MinLength(3)
 *   name: string;
 * }
 * ```
 */
export function MinLength(min: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'minLength',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length is not more than given number
 *
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MaxLength(50)
 *   name: string;
 * }
 * ```
 */
export function MaxLength(max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'maxLength',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length falls in a range
 *
 * @param min - Minimum length
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Length(3, 50)
 *   name: string;
 * }
 * ```
 */
export function Length(min: number, max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      // Add both min and max constraints
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'minLength',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });

      addValidationConstraint(this.constructor, propertyKey, {
        type: 'maxLength',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

