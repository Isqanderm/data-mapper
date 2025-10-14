"use strict";
/**
 * Metadata management for validation decorators
 * Using TC39 Stage 3 decorators with Symbol-based storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidationMetadata = getValidationMetadata;
exports.getPropertyMetadata = getPropertyMetadata;
exports.addValidationConstraint = addValidationConstraint;
exports.markPropertyAsOptional = markPropertyAsOptional;
exports.markPropertyAsConditional = markPropertyAsConditional;
exports.setNestedValidationType = setNestedValidationType;
exports.markPropertyAsArray = markPropertyAsArray;
exports.getClassValidationMetadata = getClassValidationMetadata;
exports.hasValidationMetadata = hasValidationMetadata;
/**
 * Symbol for storing validation metadata
 */
const VALIDATION_METADATA = Symbol('validation:metadata');
/**
 * Get or create validation metadata for a class
 */
function getValidationMetadata(target) {
    if (!target[VALIDATION_METADATA]) {
        target[VALIDATION_METADATA] = {
            target,
            properties: new Map(),
        };
    }
    return target[VALIDATION_METADATA];
}
/**
 * Get or create property validation metadata
 */
function getPropertyMetadata(target, propertyKey) {
    const classMetadata = getValidationMetadata(target);
    if (!classMetadata.properties.has(propertyKey)) {
        classMetadata.properties.set(propertyKey, {
            propertyKey,
            constraints: [],
        });
    }
    return classMetadata.properties.get(propertyKey);
}
/**
 * Add validation constraint to a property
 */
function addValidationConstraint(target, propertyKey, constraint) {
    const propertyMetadata = getPropertyMetadata(target, propertyKey);
    propertyMetadata.constraints.push(constraint);
}
/**
 * Mark property as optional
 */
function markPropertyAsOptional(target, propertyKey) {
    const propertyMetadata = getPropertyMetadata(target, propertyKey);
    propertyMetadata.isOptional = true;
}
/**
 * Mark property as conditional
 */
function markPropertyAsConditional(target, propertyKey, condition) {
    const propertyMetadata = getPropertyMetadata(target, propertyKey);
    propertyMetadata.isConditional = true;
    propertyMetadata.condition = condition;
}
/**
 * Set nested validation type
 */
function setNestedValidationType(target, propertyKey, typeFunction) {
    const propertyMetadata = getPropertyMetadata(target, propertyKey);
    propertyMetadata.nestedType = typeFunction;
}
/**
 * Mark property as array
 */
function markPropertyAsArray(target, propertyKey) {
    const propertyMetadata = getPropertyMetadata(target, propertyKey);
    propertyMetadata.isArray = true;
}
/**
 * Get all validation metadata for a class instance
 */
function getClassValidationMetadata(instance) {
    const constructor = instance.constructor;
    return constructor[VALIDATION_METADATA];
}
/**
 * Check if class has validation metadata
 */
function hasValidationMetadata(target) {
    return !!target[VALIDATION_METADATA];
}
