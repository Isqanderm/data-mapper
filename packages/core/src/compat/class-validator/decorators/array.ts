/**
 * Array validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is an array
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsArray()
 *   tags: string[];
 * }
 * ```
 */
export function IsArray(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isArray',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if array is not empty
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayNotEmpty()
 *   tags: string[];
 * }
 * ```
 */
export function ArrayNotEmpty(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayNotEmpty',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if array has minimum size
 *
 * @param min - Minimum array size
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayMinSize(1)
 *   tags: string[];
 * }
 * ```
 */
export function ArrayMinSize(min: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayMinSize',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if array has maximum size
 *
 * @param max - Maximum array size
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayMaxSize(10)
 *   tags: string[];
 * }
 * ```
 */
export function ArrayMaxSize(max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayMaxSize',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if array contains specific values
 *
 * @param values - Values that must be present
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayContains(['featured'])
 *   tags: string[];
 * }
 * ```
 */
export function ArrayContains(values: any[], options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayContains',
        value: values,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if array does not contain specific values
 *
 * @param values - Values that must not be present
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayNotContains(['banned'])
 *   tags: string[];
 * }
 * ```
 */
export function ArrayNotContains(values: any[], options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayNotContains',
        value: values,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if all array values are unique
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @ArrayUnique()
 *   tags: string[];
 * }
 * ```
 */
export function ArrayUnique(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'arrayUnique',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

