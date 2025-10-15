/**
 * JIT Compilation engine for validation
 * Generates optimized validation functions using new Function()
 */

import type {
  ClassValidationMetadata,
  PropertyValidationMetadata,
  ValidationConstraint,
  ValidationError,
  ValidatorOptions,
  CompiledValidator,
} from '../types';

/**
 * Cache for compiled validators
 */
const compiledValidatorsCache = new Map<any, CompiledValidator>();

/**
 * Compile validation function for a class
 */
export function compileValidator(metadata: ClassValidationMetadata): CompiledValidator {
  // Check cache first
  if (compiledValidatorsCache.has(metadata.target)) {
    return compiledValidatorsCache.get(metadata.target)!;
  }

  // Generate validation code
  const code = generateValidationCode(metadata);

  // Create compiled function
  const compiledFn = new Function('object', 'options', code) as CompiledValidator;

  // Cache it
  compiledValidatorsCache.set(metadata.target, compiledFn);

  return compiledFn;
}

/**
 * Generate validation code for JIT compilation
 */
function generateValidationCode(metadata: ClassValidationMetadata): string {
  const lines: string[] = [];

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
function generatePropertyValidation(
  propertyName: string,
  metadata: PropertyValidationMetadata,
): string {
  const lines: string[] = [];
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
function generateConstraintCheck(
  constraint: ValidationConstraint,
  valueName: string,
  errorsName: string,
): string {
  const lines: string[] = [];

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

    // Array validators
    case 'isArray':
      lines.push(`    if (!Array.isArray(${valueName})) {`);
      lines.push(`      ${errorsName}.isArray = ${JSON.stringify(getErrorMessage(constraint, 'must be an array'))};`);
      lines.push(`    }`);
      break;

    case 'arrayNotEmpty':
      lines.push(`    if (!Array.isArray(${valueName}) || ${valueName}.length === 0) {`);
      lines.push(`      ${errorsName}.arrayNotEmpty = ${JSON.stringify(getErrorMessage(constraint, 'should not be empty'))};`);
      lines.push(`    }`);
      break;

    case 'arrayMinSize':
      lines.push(`    if (Array.isArray(${valueName}) && ${valueName}.length < ${constraint.value}) {`);
      lines.push(`      ${errorsName}.arrayMinSize = ${JSON.stringify(getErrorMessage(constraint, `must contain at least ${constraint.value} elements`))};`);
      lines.push(`    }`);
      break;

    case 'arrayMaxSize':
      lines.push(`    if (Array.isArray(${valueName}) && ${valueName}.length > ${constraint.value}) {`);
      lines.push(`      ${errorsName}.arrayMaxSize = ${JSON.stringify(getErrorMessage(constraint, `must contain no more than ${constraint.value} elements`))};`);
      lines.push(`    }`);
      break;

    case 'arrayContains':
      lines.push(`    if (Array.isArray(${valueName})) {`);
      lines.push(`      const requiredValues = ${JSON.stringify(constraint.value)};`);
      lines.push(`      const hasAll = requiredValues.every(v => ${valueName}.includes(v));`);
      lines.push(`      if (!hasAll) {`);
      lines.push(`        ${errorsName}.arrayContains = ${JSON.stringify(getErrorMessage(constraint, 'must contain required values'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'arrayNotContains':
      lines.push(`    if (Array.isArray(${valueName})) {`);
      lines.push(`      const forbiddenValues = ${JSON.stringify(constraint.value)};`);
      lines.push(`      const hasAny = forbiddenValues.some(v => ${valueName}.includes(v));`);
      lines.push(`      if (hasAny) {`);
      lines.push(`        ${errorsName}.arrayNotContains = ${JSON.stringify(getErrorMessage(constraint, 'must not contain forbidden values'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'arrayUnique':
      lines.push(`    if (Array.isArray(${valueName})) {`);
      lines.push(`      const uniqueSet = new Set(${valueName});`);
      lines.push(`      if (uniqueSet.size !== ${valueName}.length) {`);
      lines.push(`        ${errorsName}.arrayUnique = ${JSON.stringify(getErrorMessage(constraint, 'all elements must be unique'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // Type checkers
    case 'isDate':
      lines.push(`    if (!(${valueName} instanceof Date) || isNaN(${valueName}.getTime())) {`);
      lines.push(`      ${errorsName}.isDate = ${JSON.stringify(getErrorMessage(constraint, 'must be a Date instance'))};`);
      lines.push(`    }`);
      break;

    case 'isObject':
      lines.push(`    if (typeof ${valueName} !== 'object' || ${valueName} === null || Array.isArray(${valueName})) {`);
      lines.push(`      ${errorsName}.isObject = ${JSON.stringify(getErrorMessage(constraint, 'must be an object'))};`);
      lines.push(`    }`);
      break;

    case 'isEnum':
      lines.push(`    const enumValues = Object.values(${JSON.stringify(constraint.value)});`);
      lines.push(`    if (!enumValues.includes(${valueName})) {`);
      lines.push(`      ${errorsName}.isEnum = ${JSON.stringify(getErrorMessage(constraint, 'must be a valid enum value'))};`);
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
function getErrorMessage(constraint: ValidationConstraint, defaultMessage: string): string {
  if (typeof constraint.message === 'string') {
    return constraint.message;
  }
  return defaultMessage;
}

/**
 * Clear compiled validators cache
 */
export function clearValidatorCache(): void {
  compiledValidatorsCache.clear();
}

/**
 * Get cache size (for debugging)
 */
export function getValidatorCacheSize(): number {
  return compiledValidatorsCache.size;
}

