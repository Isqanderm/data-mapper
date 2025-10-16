/**
 * Number validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is a number
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsNumber()
 *   price: number;
 * }
 * ```
 */
export function IsNumber(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isNumber',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is an integer
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsInt()
 *   quantity: number;
 * }
 * ```
 */
export function IsInt(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isInt',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is not less than given number
 *
 * @param min - Minimum value
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @Min(0)
 *   price: number;
 * }
 * ```
 */
export function Min(min: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'min',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is not greater than given number
 *
 * @param max - Maximum value
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @Max(1000)
 *   price: number;
 * }
 * ```
 */
export function Max(max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'max',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a positive number (> 0)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsPositive()
 *   price: number;
 * }
 * ```
 */
export function IsPositive(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'min',
        value: 0.000001, // Slightly above 0
        message: options?.message || 'must be a positive number',
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a negative number (< 0)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class TransactionDto {
 *   @IsNegative()
 *   debit: number;
 * }
 * ```
 */
export function IsNegative(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'max',
        value: -0.000001, // Slightly below 0
        message: options?.message || 'must be a negative number',
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is divisible by a number
 *
 * @param num - Number to divide by
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsDivisibleBy(5)
 *   quantity: number;
 * }
 * ```
 */
export function IsDivisibleBy(num: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isDivisibleBy',
        value: num,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a decimal number
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PriceDto {
 *   @IsDecimal()
 *   amount: number;
 * }
 * ```
 */
export function IsDecimal(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isDecimal',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

