/**
 * Nested validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint, markPropertyAsNested, markPropertyAsConditional } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Validates nested object or array of objects
 * Must be used with @Type() decorator from class-transformer
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class Address {
 *   @IsString()
 *   street: string;
 * }
 *
 * class UserDto {
 *   @ValidateNested()
 *   @Type(() => Address)
 *   address: Address;
 * }
 * ```
 */
export function ValidateNested(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      markPropertyAsNested(this.constructor, propertyKey);
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'validateNested',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Validates nested object conditionally
 *
 * @param condition - Condition function
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @ValidateIf(o => o.hasAddress)
 *   @ValidateNested()
 *   @Type(() => Address)
 *   address?: Address;
 * }
 * ```
 */
export function ValidateIf(
  condition: (object: any) => boolean,
  options?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      // Mark property as conditional with the condition function
      markPropertyAsConditional(this.constructor, propertyKey, condition);

      // Also add as a constraint for metadata completeness
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'validateIf',
        value: condition,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Validates a promise value
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @ValidatePromise()
 *   @IsString()
 *   asyncValue: Promise<string>;
 * }
 * ```
 */
export function ValidatePromise(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'validatePromise',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

