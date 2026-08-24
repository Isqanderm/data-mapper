/**
 * Common validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint, markPropertyAsOptional } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Marks property as optional - validation will be skipped if value is undefined or null
 *
 * @param options - Validation options (groups, always)
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
export function IsOptional(options?: Pick<ValidationDecoratorOptions, 'groups' | 'always'>) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      markPropertyAsOptional(this.constructor, propertyKey, options?.groups, options?.always);
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

// ============================================================================
// Comparison Validators
// ============================================================================

/**
 * Checks if value equals the specified value (strict equality)
 *
 * @param comparison - Value to compare against
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class TermsDto {
 *   @Equals(true)
 *   acceptedTerms: boolean;
 * }
 * ```
 */
export function Equals(comparison: any, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'equals',
        value: comparison,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value does not equal the specified value (strict inequality)
 *
 * @param comparison - Value to compare against
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @NotEquals('admin')
 *   username: string;
 * }
 * ```
 */
export function NotEquals(comparison: any, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'notEquals',
        value: comparison,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is in an array of allowed values
 *
 * @param values - Array of allowed values
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsIn(['draft', 'published', 'archived'])
 *   status: string;
 * }
 * ```
 */
export function IsIn(values: readonly any[], options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isIn',
        value: values,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is not in an array of disallowed values
 *
 * @param values - Array of disallowed values
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsNotIn(['admin', 'root', 'superuser'])
 *   username: string;
 * }
 * ```
 */
export function IsNotIn(values: readonly any[], options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isNotIn',
        value: values,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is empty (empty string, empty array, or empty object)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class FilterDto {
 *   @IsEmpty()
 *   tags?: string[];
 * }
 * ```
 */
export function IsEmpty(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isEmpty',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

