/**
 * Metadata management for validation decorators
 * Using TC39 Stage 3 decorators with Symbol-based storage
 */

import type {
  ValidationConstraint,
  PropertyValidationMetadata,
  ClassValidationMetadata,
} from '../types';

/**
 * Symbol for storing validation metadata
 */
const VALIDATION_METADATA = Symbol('validation:metadata');

/**
 * Get or create validation metadata for a class
 */
export function getValidationMetadata(target: any): ClassValidationMetadata {
  if (!target[VALIDATION_METADATA]) {
    target[VALIDATION_METADATA] = {
      target,
      properties: new Map<string | symbol, PropertyValidationMetadata>(),
    };
  }
  return target[VALIDATION_METADATA];
}

/**
 * Get or create property validation metadata
 */
export function getPropertyMetadata(
  target: any,
  propertyKey: string | symbol,
): PropertyValidationMetadata {
  const classMetadata = getValidationMetadata(target);
  
  if (!classMetadata.properties.has(propertyKey)) {
    classMetadata.properties.set(propertyKey, {
      propertyKey,
      constraints: [],
    });
  }
  
  return classMetadata.properties.get(propertyKey)!;
}

/**
 * Add validation constraint to a property
 */
export function addValidationConstraint(
  target: any,
  propertyKey: string | symbol,
  constraint: ValidationConstraint,
): void {
  const propertyMetadata = getPropertyMetadata(target, propertyKey);
  propertyMetadata.constraints.push(constraint);
}

/**
 * Mark property as optional
 */
export function markPropertyAsOptional(
  target: any,
  propertyKey: string | symbol,
): void {
  const propertyMetadata = getPropertyMetadata(target, propertyKey);
  propertyMetadata.isOptional = true;
}

/**
 * Mark property as conditional
 */
export function markPropertyAsConditional(
  target: any,
  propertyKey: string | symbol,
  condition: (object: any) => boolean,
): void {
  const propertyMetadata = getPropertyMetadata(target, propertyKey);
  propertyMetadata.isConditional = true;
  propertyMetadata.condition = condition;
}

/**
 * Set nested validation type
 */
export function setNestedValidationType(
  target: any,
  propertyKey: string | symbol,
  typeFunction: () => any,
): void {
  const propertyMetadata = getPropertyMetadata(target, propertyKey);
  propertyMetadata.nestedType = typeFunction;
}

/**
 * Mark property as array
 */
export function markPropertyAsArray(
  target: any,
  propertyKey: string | symbol,
): void {
  const propertyMetadata = getPropertyMetadata(target, propertyKey);
  propertyMetadata.isArray = true;
}

/**
 * Get all validation metadata for a class instance
 */
export function getClassValidationMetadata(instance: any): ClassValidationMetadata | undefined {
  const constructor = instance.constructor;
  return constructor[VALIDATION_METADATA];
}

/**
 * Check if class has validation metadata
 */
export function hasValidationMetadata(target: any): boolean {
  return !!target[VALIDATION_METADATA];
}

