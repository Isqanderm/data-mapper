/**
 * class-validator compatibility layer for om-data-mapper
 * High-performance validation with JIT compilation
 *
 * @example
 * ```typescript
 * import { IsString, MinLength, validate } from 'om-data-mapper/class-validator-compat';
 *
 * class UserDto {
 *   @IsString()
 *   @MinLength(3)
 *   name: string;
 * }
 *
 * const user = new UserDto();
 * user.name = 'Jo'; // Too short
 *
 * const errors = await validate(user);
 * // [{ property: 'name', constraints: { minLength: 'must be at least 3 characters' } }]
 * ```
 *
 * @packageDocumentation
 */

// Export validation functions
export {
  validate,
  validateSync,
  validateMany,
  validateManySync,
  validateOrReject,
  validateOrRejectSync,
  ValidationFailedError,
} from './engine/validator';

// Export decorators
export * from './decorators';

// Export types
export type {
  ValidationError,
  ValidatorOptions,
  ValidationConstraint,
  ValidationArguments,
  ValidationDecoratorOptions,
  PropertyValidationMetadata,
  ClassValidationMetadata,
} from './types';

// Export utility functions
export { clearValidatorCache, getValidatorCacheSize } from './engine/compiler';

