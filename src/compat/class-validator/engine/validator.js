"use strict";
/**
 * Validation engine - executes validation using compiled validators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationFailedError = void 0;
exports.validate = validate;
exports.validateSync = validateSync;
exports.validateMany = validateMany;
exports.validateManySync = validateManySync;
exports.validateOrReject = validateOrReject;
exports.validateOrRejectSync = validateOrRejectSync;
const metadata_1 = require("./metadata");
const compiler_1 = require("./compiler");
/**
 * Validate an object asynchronously
 * Compatible with class-validator validate() function
 */
async function validate(object, options) {
    return validateSync(object, options);
}
/**
 * Validate an object synchronously
 * Compatible with class-validator validateSync() function
 */
function validateSync(object, options) {
    // Get validation metadata
    const metadata = (0, metadata_1.getClassValidationMetadata)(object);
    if (!metadata) {
        // No validation metadata, return empty errors
        return [];
    }
    // Compile validator (or get from cache)
    const validator = (0, compiler_1.compileValidator)(metadata);
    // Execute validation
    const errors = validator(object, options);
    return errors;
}
/**
 * Validate an array of objects
 */
async function validateMany(objects, options) {
    return Promise.all(objects.map((obj) => validate(obj, options)));
}
/**
 * Validate an array of objects synchronously
 */
function validateManySync(objects, options) {
    return objects.map((obj) => validateSync(obj, options));
}
/**
 * Validate and throw error if validation fails
 */
async function validateOrReject(object, options) {
    const errors = await validate(object, options);
    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }
}
/**
 * Validate and throw error if validation fails (synchronous)
 */
function validateOrRejectSync(object, options) {
    const errors = validateSync(object, options);
    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }
}
/**
 * Validation failed error
 */
class ValidationFailedError extends Error {
    errors;
    constructor(errors) {
        super('Validation failed');
        this.errors = errors;
        this.name = 'ValidationFailedError';
        // Set prototype explicitly for proper instanceof checks
        Object.setPrototypeOf(this, ValidationFailedError.prototype);
    }
    /**
     * Get formatted error message
     */
    toString() {
        const messages = this.errors.map((error) => {
            const constraints = Object.values(error.constraints || {});
            return `${error.property}: ${constraints.join(', ')}`;
        });
        return `Validation failed:\n${messages.join('\n')}`;
    }
}
exports.ValidationFailedError = ValidationFailedError;
