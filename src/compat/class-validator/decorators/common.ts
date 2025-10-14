/**
 * Common validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint, markPropertyAsOptional } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Marks property as optional - validation will be skipped if value is undefined or null
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsOptional()
 *   @IsString()
 *   middleName?: string;
 * }
 * ```
 */
export function IsOptional() {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      markPropertyAsOptional(this.constructor, propertyKey);
    });
  };
}

/**
 * Checks if value is defined (!== undefined, !== null)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsDefined()
 *   name: string;
 * }
 * ```
 */
export function IsDefined(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isDefined',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is not empty (not null, not undefined, not empty string, not empty array)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsNotEmpty()
 *   name: string;
 * }
 * ```
 */
export function IsNotEmpty(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isNotEmpty',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

