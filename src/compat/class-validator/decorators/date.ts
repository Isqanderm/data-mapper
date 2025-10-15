/**
 * Date validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is a date that's not before the specified date
 *
 * @param date - Minimum date
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @MinDate(new Date('2024-01-01'))
 *   startDate: Date;
 * }
 * ```
 */
export function MinDate(date: Date, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'minDate',
        value: date,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a date that's not after the specified date
 *
 * @param date - Maximum date
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @MaxDate(new Date('2025-12-31'))
 *   endDate: Date;
 * }
 * ```
 */
export function MaxDate(date: Date, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'maxDate',
        value: date,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

