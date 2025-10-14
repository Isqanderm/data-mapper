/**
 * Validation engine - executes validation using compiled validators
 */

import type { ValidationError, ValidatorOptions } from '../types';
import { getClassValidationMetadata } from './metadata';
import { compileValidator } from './compiler';

/**
 * Validate an object asynchronously
 * Compatible with class-validator validate() function
 */
export async function validate(
  object: any,
  options?: ValidatorOptions,
): Promise<ValidationError[]> {
  return validateSync(object, options);
}

/**
 * Validate an object synchronously
 * Compatible with class-validator validateSync() function
 */
export function validateSync(
  object: any,
  options?: ValidatorOptions,
): ValidationError[] {
  // Get validation metadata
  const metadata = getClassValidationMetadata(object);
  
  if (!metadata) {
    // No validation metadata, return empty errors
    return [];
  }
  
  // Compile validator (or get from cache)
  const validator = compileValidator(metadata);
  
  // Execute validation
  const errors = validator(object, options);
  
  return errors;
}

/**
 * Validate an array of objects
 */
export async function validateMany(
  objects: any[],
  options?: ValidatorOptions,
): Promise<ValidationError[][]> {
  return Promise.all(objects.map((obj) => validate(obj, options)));
}

/**
 * Validate an array of objects synchronously
 */
export function validateManySync(
  objects: any[],
  options?: ValidatorOptions,
): ValidationError[][] {
  return objects.map((obj) => validateSync(obj, options));
}

/**
 * Validate and throw error if validation fails
 */
export async function validateOrReject(
  object: any,
  options?: ValidatorOptions,
): Promise<void> {
  const errors = await validate(object, options);
  
  if (errors.length > 0) {
    throw new ValidationFailedError(errors);
  }
}

/**
 * Validate and throw error if validation fails (synchronous)
 */
export function validateOrRejectSync(
  object: any,
  options?: ValidatorOptions,
): void {
  const errors = validateSync(object, options);
  
  if (errors.length > 0) {
    throw new ValidationFailedError(errors);
  }
}

/**
 * Validation failed error
 */
export class ValidationFailedError extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationFailedError';
    
    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, ValidationFailedError.prototype);
  }
  
  /**
   * Get formatted error message
   */
  toString(): string {
    const messages = this.errors.map((error) => {
      const constraints = Object.values(error.constraints || {});
      return `${error.property}: ${constraints.join(', ')}`;
    });
    
    return `Validation failed:\n${messages.join('\n')}`;
  }
}

