"use strict";
/**
 * JIT Compilation engine for validation
 * Generates optimized validation functions using new Function()
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileValidator = compileValidator;
exports.clearValidatorCache = clearValidatorCache;
exports.getValidatorCacheSize = getValidatorCacheSize;
/**
 * Cache for compiled validators
 */
const compiledValidatorsCache = new Map();
/**
 * Compile validation function for a class
 */
function compileValidator(metadata) {
    // Check cache first
    if (compiledValidatorsCache.has(metadata.target)) {
        return compiledValidatorsCache.get(metadata.target);
    }
    // Generate validation code
    const code = generateValidationCode(metadata);
    // Create compiled function
    const compiledFn = new Function('object', 'options', code);
    // Cache it
    compiledValidatorsCache.set(metadata.target, compiledFn);
    return compiledFn;
}
/**
 * Generate validation code for JIT compilation
 */
function generateValidationCode(metadata) {
    const lines = [];
    lines.push('const errors = [];');
    lines.push('const opts = options || {};');
    lines.push('');
    // Generate validation code for each property
    for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
        const propName = String(propertyKey);
        lines.push(`// Validate property: ${propName}`);
        lines.push(generatePropertyValidation(propName, propertyMeta));
        lines.push('');
    }
    lines.push('return errors;');
    return lines.join('\n');
}
/**
 * Generate validation code for a single property
 */
function generatePropertyValidation(propertyName, metadata) {
    const lines = [];
    const safePropName = JSON.stringify(propertyName);
    lines.push(`{`);
    lines.push(`  const value = object[${safePropName}];`);
    lines.push(`  const propertyErrors = {};`);
    // Handle optional properties
    if (metadata.isOptional) {
        lines.push(`  if (value === undefined || value === null) {`);
        lines.push(`    // Skip validation for optional property`);
        lines.push(`  } else {`);
    }
    // Generate validation checks for each constraint
    for (const constraint of metadata.constraints) {
        lines.push(generateConstraintCheck(constraint, 'value', 'propertyErrors'));
    }
    if (metadata.isOptional) {
        lines.push(`  }`);
    }
    // Add error if any constraints failed
    lines.push(`  if (Object.keys(propertyErrors).length > 0) {`);
    lines.push(`    errors.push({`);
    lines.push(`      property: ${safePropName},`);
    lines.push(`      value: value,`);
    lines.push(`      constraints: propertyErrors,`);
    lines.push(`      target: object`);
    lines.push(`    });`);
    lines.push(`  }`);
    lines.push(`}`);
    return lines.join('\n');
}
/**
 * Generate validation check code for a constraint
 */
function generateConstraintCheck(constraint, valueName, errorsName) {
    const lines = [];
    switch (constraint.type) {
        case 'isString':
            lines.push(`    if (typeof ${valueName} !== 'string') {`);
            lines.push(`      ${errorsName}.isString = ${JSON.stringify(getErrorMessage(constraint, 'must be a string'))};`);
            lines.push(`    }`);
            break;
        case 'minLength':
            lines.push(`    if (typeof ${valueName} === 'string' && ${valueName}.length < ${constraint.value}) {`);
            lines.push(`      ${errorsName}.minLength = ${JSON.stringify(getErrorMessage(constraint, `must be at least ${constraint.value} characters`))};`);
            lines.push(`    }`);
            break;
        case 'maxLength':
            lines.push(`    if (typeof ${valueName} === 'string' && ${valueName}.length > ${constraint.value}) {`);
            lines.push(`      ${errorsName}.maxLength = ${JSON.stringify(getErrorMessage(constraint, `must be at most ${constraint.value} characters`))};`);
            lines.push(`    }`);
            break;
        case 'isNumber':
            lines.push(`    if (typeof ${valueName} !== 'number' || isNaN(${valueName})) {`);
            lines.push(`      ${errorsName}.isNumber = ${JSON.stringify(getErrorMessage(constraint, 'must be a number'))};`);
            lines.push(`    }`);
            break;
        case 'min':
            lines.push(`    if (typeof ${valueName} === 'number' && ${valueName} < ${constraint.value}) {`);
            lines.push(`      ${errorsName}.min = ${JSON.stringify(getErrorMessage(constraint, `must not be less than ${constraint.value}`))};`);
            lines.push(`    }`);
            break;
        case 'max':
            lines.push(`    if (typeof ${valueName} === 'number' && ${valueName} > ${constraint.value}) {`);
            lines.push(`      ${errorsName}.max = ${JSON.stringify(getErrorMessage(constraint, `must not be greater than ${constraint.value}`))};`);
            lines.push(`    }`);
            break;
        case 'isInt':
            lines.push(`    if (typeof ${valueName} !== 'number' || !Number.isInteger(${valueName})) {`);
            lines.push(`      ${errorsName}.isInt = ${JSON.stringify(getErrorMessage(constraint, 'must be an integer'))};`);
            lines.push(`    }`);
            break;
        case 'isBoolean':
            lines.push(`    if (typeof ${valueName} !== 'boolean') {`);
            lines.push(`      ${errorsName}.isBoolean = ${JSON.stringify(getErrorMessage(constraint, 'must be a boolean'))};`);
            lines.push(`    }`);
            break;
        case 'isNotEmpty':
            lines.push(`    if (${valueName} === null || ${valueName} === undefined || ${valueName} === '' || (Array.isArray(${valueName}) && ${valueName}.length === 0)) {`);
            lines.push(`      ${errorsName}.isNotEmpty = ${JSON.stringify(getErrorMessage(constraint, 'should not be empty'))};`);
            lines.push(`    }`);
            break;
        default:
            // For unknown constraint types, skip (will be handled by runtime validators)
            break;
    }
    return lines.join('\n');
}
/**
 * Get error message from constraint
 */
function getErrorMessage(constraint, defaultMessage) {
    if (typeof constraint.message === 'string') {
        return constraint.message;
    }
    return defaultMessage;
}
/**
 * Clear compiled validators cache
 */
function clearValidatorCache() {
    compiledValidatorsCache.clear();
}
/**
 * Get cache size (for debugging)
 */
function getValidatorCacheSize() {
    return compiledValidatorsCache.size;
}
