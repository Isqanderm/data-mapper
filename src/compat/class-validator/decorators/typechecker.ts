/**
 * Type checker validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is a boolean
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsBoolean()
 *   isActive: boolean;
 * }
 * ```
 */
export function IsBoolean(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isBoolean',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a Date
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsDate()
 *   startDate: Date;
 * }
 * ```
 */
export function IsDate(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isDate',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is an object
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsObject()
 *   metadata: Record<string, any>;
 * }
 * ```
 */
export function IsObject(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isObject',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is an enum
 *
 * @param entity - Enum object
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * enum UserRole {
 *   Admin = 'admin',
 *   User = 'user'
 * }
 *
 * class UserDto {
 *   @IsEnum(UserRole)
 *   role: UserRole;
 * }
 * ```
 */
export function IsEnum(entity: object, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isEnum',
        value: entity,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is an instance of a class
 *
 * @param targetType - Class constructor
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class Address {
 *   street: string;
 * }
 *
 * class UserDto {
 *   @IsInstance(Address)
 *   address: Address;
 * }
 * ```
 */
export function IsInstance(targetType: any, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isInstance',
        value: targetType,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

