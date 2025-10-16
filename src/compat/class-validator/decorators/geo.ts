/**
 * Geographic validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if string is a valid latitude,longitude coordinate pair
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class LocationDto {
 *   @IsLatLong()
 *   coordinates: string; // e.g., "40.7128,-74.0060"
 * }
 * ```
 */
export function IsLatLong(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isLatLong',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a valid latitude (-90 to 90)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class LocationDto {
 *   @IsLatitude()
 *   latitude: number; // e.g., 40.7128
 * }
 * ```
 */
export function IsLatitude(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isLatitude',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if value is a valid longitude (-180 to 180)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class LocationDto {
 *   @IsLongitude()
 *   longitude: number; // e.g., -74.0060
 * }
 * ```
 */
export function IsLongitude(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isLongitude',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

