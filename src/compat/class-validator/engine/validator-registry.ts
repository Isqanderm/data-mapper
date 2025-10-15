/**
 * Validator registry for custom validator classes
 * Manages validator instances and caching
 */

import type { ValidatorConstraintInterface } from '../decorators/custom';

/**
 * Cache for validator instances
 * Key: validator class constructor
 * Value: validator instance
 */
const validatorInstanceCache = new Map<
  new () => ValidatorConstraintInterface,
  ValidatorConstraintInterface
>();

/**
 * Get or create validator instance
 * Caches instances to avoid repeated instantiation
 *
 * @param validatorClass - Validator class constructor
 * @returns Validator instance
 */
export function getValidatorInstance(
  validatorClass: new () => ValidatorConstraintInterface,
): ValidatorConstraintInterface {
  // Check cache first
  if (validatorInstanceCache.has(validatorClass)) {
    return validatorInstanceCache.get(validatorClass)!;
  }

  // Create new instance
  const instance = new validatorClass();

  // Cache instance
  validatorInstanceCache.set(validatorClass, instance);

  return instance;
}

/**
 * Clear validator instance cache
 */
export function clearValidatorInstanceCache(): void {
  validatorInstanceCache.clear();
}

/**
 * Get validator instance cache size (for debugging)
 */
export function getValidatorInstanceCacheSize(): number {
  return validatorInstanceCache.size;
}

/**
 * Check if validator class is async
 *
 * @param validatorClass - Validator class constructor
 * @returns True if validator is async
 */
export function isAsyncValidator(validatorClass: new () => ValidatorConstraintInterface): boolean {
  const metadata = (validatorClass as any).__validatorMetadata;
  return metadata?.async === true;
}

/**
 * Get validator name
 *
 * @param validatorClass - Validator class constructor
 * @returns Validator name
 */
export function getValidatorName(validatorClass: new () => ValidatorConstraintInterface): string {
  const metadata = (validatorClass as any).__validatorMetadata;
  return metadata?.name || validatorClass.name;
}

