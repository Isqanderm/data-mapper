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
  AsyncCompiledValidator,
} from '../types';
import { getValidationMetadata, hasValidationMetadata } from './metadata';
import {
  getValidatorInstance,
  clearValidatorInstanceCache,
} from './validator-registry';

/**
 * Cache for compiled validators
 */
const compiledValidatorsCache = new Map<any, CompiledValidator>();

/**
 * Cache for compiled async validators
 */
const compiledAsyncValidatorsCache = new Map<any, AsyncCompiledValidator>();

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

  // Create compiled function with access to helper functions
  const compiledFn = new Function(
    'object',
    'options',
    'getValidationMetadata',
    'hasValidationMetadata',
    'compileValidator',
    'getValidatorInstance',
    'metadata',
    code,
  ) as any;

  // Wrap to provide helper functions
  const wrappedFn = (object: any, options?: ValidatorOptions) => {
    return compiledFn(object, options, getValidationMetadata, hasValidationMetadata, compileValidator, getValidatorInstance, metadata);
  };

  // Cache it
  compiledValidatorsCache.set(metadata.target, wrappedFn as CompiledValidator);

  return wrappedFn as CompiledValidator;
}

/**
 * Compile async validation function for a class
 */
export function compileAsyncValidator(metadata: ClassValidationMetadata): AsyncCompiledValidator {
  // Check cache first
  if (compiledAsyncValidatorsCache.has(metadata.target)) {
    return compiledAsyncValidatorsCache.get(metadata.target)!;
  }

  // Generate async validation code
  const code = generateAsyncValidationCode(metadata);

  // Create compiled async function with access to helper functions and constraints
  const compiledFn = new Function(
    'object',
    'options',
    'getValidationMetadata',
    'hasValidationMetadata',
    'compileValidator',
    'compileAsyncValidator',
    'getValidatorInstance',
    'metadata',
    code,
  ) as any;

  // Wrap to provide helper functions
  const wrappedFn = async (object: any, options?: ValidatorOptions) => {
    return compiledFn(object, options, getValidationMetadata, hasValidationMetadata, compileValidator, compileAsyncValidator, getValidatorInstance, metadata);
  };

  // Cache it
  compiledAsyncValidatorsCache.set(metadata.target, wrappedFn as AsyncCompiledValidator);

  return wrappedFn as AsyncCompiledValidator;
}

/**
 * Generate validation code for JIT compilation
 */
function generateValidationCode(metadata: ClassValidationMetadata): string {
  const lines: string[] = [];

  lines.push('const errors = [];');
  lines.push('const opts = options || {};');
  lines.push('');

  // Helper function to get nested validator
  lines.push('// Helper to get nested validator');
  lines.push('const getNestedValidator = (obj) => {');
  lines.push('  if (!obj || !obj.constructor) return null;');
  lines.push('  if (!hasValidationMetadata(obj.constructor)) return null;');
  lines.push('  const metadata = getValidationMetadata(obj.constructor);');
  lines.push('  if (!metadata || metadata.properties.size === 0) return null;');
  lines.push('  return compileValidator(metadata);');
  lines.push('};');
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
 * Generate async validation code for JIT compilation
 */
function generateAsyncValidationCode(metadata: ClassValidationMetadata): string {
  const lines: string[] = [];

  // Wrap everything in an async function
  lines.push('return (async () => {');
  lines.push('  const errors = [];');
  lines.push('  const opts = options || {};');
  lines.push('  const asyncTasks = [];');
  lines.push('');

  // Helper function to get nested async validator
  lines.push('  // Helper to get nested async validator');
  lines.push('  const getNestedAsyncValidator = (obj) => {');
  lines.push('    if (!obj || !obj.constructor) return null;');
  lines.push('    if (!hasValidationMetadata(obj.constructor)) return null;');
  lines.push('    const metadata = getValidationMetadata(obj.constructor);');
  lines.push('    if (!metadata || metadata.properties.size === 0) return null;');
  lines.push('    return compileAsyncValidator(metadata);');
  lines.push('  };');
  lines.push('');

  // Generate validation code for each property
  for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
    const propName = String(propertyKey);
    lines.push(`  // Validate property: ${propName}`);
    lines.push(generateAsyncPropertyValidation(propName, propertyMeta));
    lines.push('');
  }

  // Wait for all async validations to complete
  lines.push('  // Wait for all async validations');
  lines.push('  if (asyncTasks.length > 0) {');
  lines.push('    await Promise.all(asyncTasks);');
  lines.push('  }');
  lines.push('');
  lines.push('  return errors;');
  lines.push('})();');

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
  lines.push(`  let nestedErrors = [];`);

  // Handle conditional validation (ValidateIf)
  if (metadata.isConditional && metadata.condition) {
    lines.push(`  // Conditional validation (ValidateIf)`);
    lines.push(`  const condition = metadata.properties.get(${safePropName}).condition;`);
    lines.push(`  if (!condition || !condition(object)) {`);
    lines.push(`    // Skip validation - condition not met`);
    lines.push(`  } else {`);
  }

  // Handle optional properties
  if (metadata.isOptional) {
    // Check if optional has groups
    if (metadata.optionalGroups && metadata.optionalGroups.length > 0) {
      const groupsJson = JSON.stringify(metadata.optionalGroups);
      lines.push(`  // Optional with groups - only skip if groups match`);
      lines.push(`  if ((value === undefined || value === null) && opts.groups && opts.groups.length > 0 && opts.groups.some(g => ${groupsJson}.includes(g))) {`);
      lines.push(`    // Skip validation for optional property in matching group`);
      lines.push(`  } else {`);
    } else {
      // No groups - always optional
      lines.push(`  if (value === undefined || value === null) {`);
      lines.push(`    // Skip validation for optional property`);
      lines.push(`  } else {`);
    }
  }

  // Generate validation checks for each constraint
  for (let i = 0; i < metadata.constraints.length; i++) {
    const constraint = metadata.constraints[i];
    // Check if constraint should be validated based on groups
    if (constraint.groups && constraint.groups.length > 0) {
      // Constraint has groups - only validate if options.groups matches
      const groupsJson = JSON.stringify(constraint.groups);
      lines.push(`  // Check validation groups`);
      lines.push(`  if (opts.groups && opts.groups.length > 0 && opts.groups.some(g => ${groupsJson}.includes(g))) {`);
      lines.push(generateConstraintCheck(constraint, i, propertyName, 'value', 'propertyErrors', '    '));
      lines.push(`  }`);
    } else {
      // No groups specified on constraint - always validate
      lines.push(generateConstraintCheck(constraint, i, propertyName, 'value', 'propertyErrors'));
    }
  }

  // Handle nested validation
  if (metadata.isNested) {
    lines.push(`  // Nested validation`);
    lines.push(`  if (value !== null && value !== undefined) {`);

    // Check if it's an array of nested objects
    lines.push(`    if (Array.isArray(value)) {`);
    lines.push(`      // Validate array of nested objects`);
    lines.push(`      for (let i = 0; i < value.length; i++) {`);
    lines.push(`        const nestedValue = value[i];`);
    lines.push(`        if (nestedValue && typeof nestedValue === 'object') {`);
    lines.push(`          const nestedValidator = getNestedValidator(nestedValue);`);
    lines.push(`          if (nestedValidator) {`);
    lines.push(`            const nestedValidationErrors = nestedValidator(nestedValue, opts);`);
    lines.push(`            if (nestedValidationErrors.length > 0) {`);
    lines.push(`              nestedErrors.push(...nestedValidationErrors.map(err => ({`);
    lines.push(`                ...err,`);
    lines.push(`                property: \`[\${i}].\${err.property}\``);
    lines.push(`              })));`);
    lines.push(`            }`);
    lines.push(`          }`);
    lines.push(`        }`);
    lines.push(`      }`);
    lines.push(`    } else if (typeof value === 'object') {`);
    lines.push(`      // Validate single nested object`);
    lines.push(`      const nestedValidator = getNestedValidator(value);`);
    lines.push(`      if (nestedValidator) {`);
    lines.push(`        nestedErrors = nestedValidator(value, opts);`);
    lines.push(`      }`);
    lines.push(`    }`);
    lines.push(`  }`);
  }

  if (metadata.isOptional) {
    lines.push(`  }`);
  }

  // Close conditional validation block
  if (metadata.isConditional && metadata.condition) {
    lines.push(`  }`);
  }

  // Add error if any constraints failed or nested errors exist
  lines.push(`  if (Object.keys(propertyErrors).length > 0 || nestedErrors.length > 0) {`);
  lines.push(`    const error = {`);
  lines.push(`      property: ${safePropName},`);
  lines.push(`      value: value,`);
  lines.push(`      target: object`);
  lines.push(`    };`);
  lines.push(`    if (Object.keys(propertyErrors).length > 0) {`);
  lines.push(`      error.constraints = propertyErrors;`);
  lines.push(`    }`);
  lines.push(`    if (nestedErrors.length > 0) {`);
  lines.push(`      error.children = nestedErrors;`);
  lines.push(`    }`);
  lines.push(`    errors.push(error);`);
  lines.push(`  }`);
  lines.push(`}`);

  return lines.join('\n');
}

/**
 * Generate async validation code for a single property
 */
function generateAsyncPropertyValidation(
  propertyName: string,
  metadata: PropertyValidationMetadata,
): string {
  const lines: string[] = [];
  const safePropName = JSON.stringify(propertyName);

  lines.push(`  {`);
  lines.push(`    const value = object[${safePropName}];`);
  lines.push(`    const propertyErrors = {};`);
  lines.push(`    let nestedErrors = [];`);
  lines.push(`    const propertyAsyncTasks = [];`);

    // Handle conditional validation (ValidateIf)
    if (metadata.isConditional && metadata.condition) {
      lines.push(`  // Conditional validation (ValidateIf)`);
      lines.push(`  const condition = metadata.properties.get(${safePropName}).condition;`);
      lines.push(`  if (!condition || !condition(object)) {`);
      lines.push(`    // Skip validation - condition not met`);
      lines.push(`  } else {`);
    }

    // Handle optional properties
    if (metadata.isOptional) {
      // Check if optional has groups
      if (metadata.optionalGroups && metadata.optionalGroups.length > 0) {
        const groupsJson = JSON.stringify(metadata.optionalGroups);
        lines.push(`  // Optional with groups - only skip if groups match`);
        lines.push(`  if ((value === undefined || value === null) && opts.groups && opts.groups.length > 0 && opts.groups.some(g => ${groupsJson}.includes(g))) {`);
        lines.push(`    // Skip validation for optional property in matching group`);
        lines.push(`  } else {`);
      } else {
        // No groups - always optional
        lines.push(`  if (value === undefined || value === null) {`);
        lines.push(`    // Skip validation for optional property`);
        lines.push(`  } else {`);
      }
    }

    // Generate validation checks for each constraint
    for (let i = 0; i < metadata.constraints.length; i++) {
      const constraint = metadata.constraints[i];
      // Check if constraint should be validated based on groups
      if (constraint.groups && constraint.groups.length > 0) {
        // Constraint has groups - only validate if options.groups matches
        const groupsJson = JSON.stringify(constraint.groups);
        lines.push(`    // Check validation groups`);
        lines.push(`    if (opts.groups && opts.groups.length > 0 && opts.groups.some(g => ${groupsJson}.includes(g))) {`);
        lines.push(generateAsyncConstraintCheck(constraint, i, propertyName, 'value', 'propertyErrors', 'propertyAsyncTasks', '      '));
        lines.push(`    }`);
      } else {
        // No groups specified on constraint - always validate
        lines.push(generateAsyncConstraintCheck(constraint, i, propertyName, 'value', 'propertyErrors', 'propertyAsyncTasks', '    '));
      }
    }

    // Handle nested validation
    if (metadata.isNested) {
      lines.push(`  // Nested async validation`);
      lines.push(`  if (value !== null && value !== undefined) {`);

      // Check if it's an array of nested objects
      lines.push(`    if (Array.isArray(value)) {`);
      lines.push(`      // Validate array of nested objects asynchronously`);
      lines.push(`      const arrayAsyncTask = (async () => {`);
      lines.push(`        for (let i = 0; i < value.length; i++) {`);
      lines.push(`          const nestedValue = value[i];`);
      lines.push(`          if (nestedValue && typeof nestedValue === 'object') {`);
      lines.push(`            const nestedValidator = getNestedAsyncValidator(nestedValue);`);
      lines.push(`            if (nestedValidator) {`);
      lines.push(`              const nestedValidationErrors = await nestedValidator(nestedValue, opts);`);
      lines.push(`              if (nestedValidationErrors.length > 0) {`);
      lines.push(`                nestedErrors.push(...nestedValidationErrors.map(err => ({`);
      lines.push(`                  ...err,`);
      lines.push(`                  property: \`[\${i}].\${err.property}\``);
      lines.push(`                })));`);
      lines.push(`              }`);
      lines.push(`            }`);
      lines.push(`          }`);
      lines.push(`        }`);
      lines.push(`      })();`);
      lines.push(`      propertyAsyncTasks.push(arrayAsyncTask);`);
      lines.push(`    } else if (typeof value === 'object') {`);
      lines.push(`      // Validate single nested object asynchronously`);
      lines.push(`      const nestedAsyncTask = (async () => {`);
      lines.push(`        const nestedValidator = getNestedAsyncValidator(value);`);
      lines.push(`        if (nestedValidator) {`);
      lines.push(`          nestedErrors = await nestedValidator(value, opts);`);
      lines.push(`        }`);
      lines.push(`      })();`);
      lines.push(`      propertyAsyncTasks.push(nestedAsyncTask);`);
      lines.push(`    }`);
      lines.push(`  }`);
    }

    if (metadata.isOptional) {
      lines.push(`  }`);
    }

    // Close conditional validation block
    if (metadata.isConditional && metadata.condition) {
      lines.push(`  }`);
    }

    // Wait for property async tasks and add errors
    lines.push(`  // Wait for property async validations`);
    lines.push(`  const propertyTask = (async () => {`);
    lines.push(`    if (propertyAsyncTasks.length > 0) {`);
    lines.push(`      await Promise.all(propertyAsyncTasks);`);
    lines.push(`    }`);
    lines.push(`    if (Object.keys(propertyErrors).length > 0 || nestedErrors.length > 0) {`);
    lines.push(`      const error = {`);
    lines.push(`        property: ${safePropName},`);
    lines.push(`        value: value,`);
    lines.push(`        target: object`);
    lines.push(`      };`);
    lines.push(`      if (Object.keys(propertyErrors).length > 0) {`);
    lines.push(`        error.constraints = propertyErrors;`);
    lines.push(`      }`);
    lines.push(`      if (nestedErrors.length > 0) {`);
    lines.push(`        error.children = nestedErrors;`);
    lines.push(`      }`);
    lines.push(`      errors.push(error);`);
    lines.push(`    }`);
    lines.push(`  })();`);
    lines.push(`  asyncTasks.push(propertyTask);`);
    lines.push(`}`);

    return lines.join('\n');
}

/**
 * Generate validation check code for a constraint
 */
function generateConstraintCheck(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  errorsName: string,
  indent: string = '  ',
): string {
  const lines: string[] = [];
  const safePropName = JSON.stringify(propertyName);

  switch (constraint.type) {
    case 'isString':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(`${indent}    ${errorsName}.isString = ${JSON.stringify(getErrorMessage(constraint, 'must be a string'))};`);
      lines.push(`${indent}  }`);
      break;

    case 'minLength':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && ${valueName}.length < ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.minLength = ${JSON.stringify(getErrorMessage(constraint, `must be at least ${constraint.value} characters`))};`);
      lines.push(`${indent}  }`);
      break;

    case 'maxLength':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && ${valueName}.length > ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.maxLength = ${JSON.stringify(getErrorMessage(constraint, `must be at most ${constraint.value} characters`))};`);
      lines.push(`${indent}  }`);
      break;

    case 'isNumber':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number' || isNaN(${valueName})) {`);
      lines.push(`${indent}    ${errorsName}.isNumber = ${JSON.stringify(getErrorMessage(constraint, 'must be a number'))};`);
      lines.push(`    }`);
      break;

    case 'min':
      lines.push(`${indent}  if (typeof ${valueName} === 'number' && ${valueName} < ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.min = ${JSON.stringify(getErrorMessage(constraint, `must not be less than ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'max':
      lines.push(`${indent}  if (typeof ${valueName} === 'number' && ${valueName} > ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.max = ${JSON.stringify(getErrorMessage(constraint, `must not be greater than ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'isInt':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number' || !Number.isInteger(${valueName})) {`);
      lines.push(`${indent}    ${errorsName}.isInt = ${JSON.stringify(getErrorMessage(constraint, 'must be an integer'))};`);
      lines.push(`    }`);
      break;

    case 'isBoolean':
      lines.push(`${indent}  if (typeof ${valueName} !== 'boolean') {`);
      lines.push(`${indent}    ${errorsName}.isBoolean = ${JSON.stringify(getErrorMessage(constraint, 'must be a boolean'))};`);
      lines.push(`    }`);
      break;

    case 'isNotEmpty':
      lines.push(`${indent}  if (${valueName} === null || ${valueName} === undefined || ${valueName} === '' || (Array.isArray(${valueName}) && ${valueName}.length === 0)) {`);
      lines.push(`${indent}    ${errorsName}.isNotEmpty = ${JSON.stringify(getErrorMessage(constraint, 'should not be empty'))};`);
      lines.push(`    }`);
      break;

    case 'isDefined':
      lines.push(`${indent}  if (${valueName} === undefined || ${valueName} === null) {`);
      lines.push(`${indent}    ${errorsName}.isDefined = ${JSON.stringify(getErrorMessage(constraint, 'should not be null or undefined'))};`);
      lines.push(`    }`);
      break;

    // Array validators
    case 'isArray':
      lines.push(`${indent}  if (!Array.isArray(${valueName})) {`);
      lines.push(`${indent}    ${errorsName}.isArray = ${JSON.stringify(getErrorMessage(constraint, 'must be an array'))};`);
      lines.push(`    }`);
      break;

    case 'arrayNotEmpty':
      lines.push(`${indent}  if (!Array.isArray(${valueName}) || ${valueName}.length === 0) {`);
      lines.push(`${indent}    ${errorsName}.arrayNotEmpty = ${JSON.stringify(getErrorMessage(constraint, 'should not be empty'))};`);
      lines.push(`    }`);
      break;

    case 'arrayMinSize':
      lines.push(`${indent}  if (Array.isArray(${valueName}) && ${valueName}.length < ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.arrayMinSize = ${JSON.stringify(getErrorMessage(constraint, `must contain at least ${constraint.value} elements`))};`);
      lines.push(`    }`);
      break;

    case 'arrayMaxSize':
      lines.push(`${indent}  if (Array.isArray(${valueName}) && ${valueName}.length > ${constraint.value}) {`);
      lines.push(`${indent}    ${errorsName}.arrayMaxSize = ${JSON.stringify(getErrorMessage(constraint, `must contain no more than ${constraint.value} elements`))};`);
      lines.push(`    }`);
      break;

    case 'arrayContains':
      lines.push(`${indent}  if (Array.isArray(${valueName})) {`);
      lines.push(`${indent}    const requiredValues = ${JSON.stringify(constraint.value)};`);
      lines.push(`${indent}    const hasAll = requiredValues.every(v => ${valueName}.includes(v));`);
      lines.push(`${indent}    if (!hasAll) {`);
      lines.push(`${indent}      ${errorsName}.arrayContains = ${JSON.stringify(getErrorMessage(constraint, 'must contain required values'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'arrayNotContains':
      lines.push(`${indent}  if (Array.isArray(${valueName})) {`);
      lines.push(`${indent}    const forbiddenValues = ${JSON.stringify(constraint.value)};`);
      lines.push(`${indent}    const hasAny = forbiddenValues.some(v => ${valueName}.includes(v));`);
      lines.push(`${indent}    if (hasAny) {`);
      lines.push(`${indent}      ${errorsName}.arrayNotContains = ${JSON.stringify(getErrorMessage(constraint, 'must not contain forbidden values'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'arrayUnique':
      lines.push(`${indent}  if (Array.isArray(${valueName})) {`);
      lines.push(`${indent}    const uniqueSet = new Set(${valueName});`);
      lines.push(`${indent}    if (uniqueSet.size !== ${valueName}.length) {`);
      lines.push(`${indent}      ${errorsName}.arrayUnique = ${JSON.stringify(getErrorMessage(constraint, 'all elements must be unique'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Type checkers
    case 'isDate':
      lines.push(`${indent}  if (!(${valueName} instanceof Date) || isNaN(${valueName}.getTime())) {`);
      lines.push(`${indent}    ${errorsName}.isDate = ${JSON.stringify(getErrorMessage(constraint, 'must be a Date instance'))};`);
      lines.push(`    }`);
      break;

    case 'isObject':
      lines.push(`${indent}  if (typeof ${valueName} !== 'object' || ${valueName} === null || Array.isArray(${valueName})) {`);
      lines.push(`${indent}    ${errorsName}.isObject = ${JSON.stringify(getErrorMessage(constraint, 'must be an object'))};`);
      lines.push(`    }`);
      break;

    case 'isEnum':
      lines.push(`    const enumValues = Object.values(${JSON.stringify(constraint.value)});`);
      lines.push(`${indent}  if (!enumValues.includes(${valueName})) {`);
      lines.push(`${indent}    ${errorsName}.isEnum = ${JSON.stringify(getErrorMessage(constraint, 'must be a valid enum value'))};`);
      lines.push(`    }`);
      break;

    // String validators - Email & Web
    case 'isEmail':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;`);
      lines.push(`${indent}    if (!emailRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isEmail = ${JSON.stringify(getErrorMessage(constraint, 'must be an email'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isURL':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    try {`);
      lines.push(`${indent}      new URL(${valueName});`);
      lines.push(`${indent}    } catch {`);
      lines.push(`${indent}      ${errorsName}.isURL = ${JSON.stringify(getErrorMessage(constraint, 'must be a URL address'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isUUID':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      if (constraint.value === '3') {
        lines.push(`${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else if (constraint.value === '4') {
        lines.push(`${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else if (constraint.value === '5') {
        lines.push(`${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else {
        lines.push(`${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;`);
      }
      lines.push(`${indent}    if (!uuidRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isUUID = ${JSON.stringify(getErrorMessage(constraint, 'must be a UUID'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isJSON':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    try {`);
      lines.push(`${indent}      JSON.parse(${valueName});`);
      lines.push(`${indent}    } catch {`);
      lines.push(`${indent}      ${errorsName}.isJSON = ${JSON.stringify(getErrorMessage(constraint, 'must be a json string'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Format
    case 'isAlpha':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const alphaRegex = /^[a-zA-Z]+$/;`);
      lines.push(`${indent}    if (!alphaRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isAlpha = ${JSON.stringify(getErrorMessage(constraint, 'must contain only letters (a-zA-Z)'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isAlphanumeric':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const alphanumericRegex = /^[a-zA-Z0-9]+$/;`);
      lines.push(`${indent}    if (!alphanumericRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isAlphanumeric = ${JSON.stringify(getErrorMessage(constraint, 'must contain only letters and numbers'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isHexColor':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;`);
      lines.push(`${indent}    if (!hexColorRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isHexColor = ${JSON.stringify(getErrorMessage(constraint, 'must be a hexadecimal color'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIP':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      if (constraint.value === '4') {
        lines.push(`${indent}    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`);
      } else if (constraint.value === '6') {
        lines.push(`${indent}    const ipRegex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;`);
      } else {
        lines.push(`${indent}    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`);
        lines.push(`${indent}    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;`);
        lines.push(`${indent}    const ipRegex = { test: (v) => ipv4Regex.test(v) || ipv6Regex.test(v) };`);
      }
      lines.push(`${indent}    if (!ipRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isIP = ${JSON.stringify(getErrorMessage(constraint, 'must be an ip address'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Specialized
    case 'isCreditCard':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      lines.push(`${indent}    if (!/^[0-9]{13,19}$/.test(sanitized)) {`);
      lines.push(`${indent}      ${errorsName}.isCreditCard = ${JSON.stringify(getErrorMessage(constraint, 'must be a credit card'))};`);
      lines.push(`${indent}    } else {`);
      // Luhn algorithm
      lines.push(`${indent}      let sum = 0;`);
      lines.push(`${indent}      let isEven = false;`);
      lines.push(`${indent}      for (let i = sanitized.length - 1; i >= 0; i--) {`);
      lines.push(`${indent}        let digit = parseInt(sanitized[i], 10);`);
      lines.push(`${indent}        if (isEven) {`);
      lines.push(`${indent}          digit *= 2;`);
      lines.push(`${indent}          if (digit > 9) digit -= 9;`);
      lines.push(`${indent}        }`);
      lines.push(`${indent}        sum += digit;`);
      lines.push(`${indent}        isEven = !isEven;`);
      lines.push(`${indent}      }`);
      lines.push(`${indent}      if (sum % 10 !== 0) {`);
      lines.push(`${indent}        ${errorsName}.isCreditCard = ${JSON.stringify(getErrorMessage(constraint, 'must be a credit card'))};`);
      lines.push(`${indent}      }`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isISBN':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      if (constraint.value === '10') {
        lines.push(`${indent}    if (!/^[0-9]{9}[0-9X]$/i.test(sanitized)) {`);
        lines.push(`${indent}      ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`${indent}    }`);
      } else if (constraint.value === '13') {
        lines.push(`${indent}    if (!/^[0-9]{13}$/.test(sanitized)) {`);
        lines.push(`${indent}      ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`${indent}    }`);
      } else {
        lines.push(`${indent}    const isbn10 = /^[0-9]{9}[0-9X]$/i.test(sanitized);`);
        lines.push(`${indent}    const isbn13 = /^[0-9]{13}$/.test(sanitized);`);
        lines.push(`${indent}    if (!isbn10 && !isbn13) {`);
        lines.push(`${indent}      ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`${indent}    }`);
      }
      lines.push(`    }`);
      break;

    case 'isPhoneNumber':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;`);
      lines.push(`${indent}    if (!phoneRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isPhoneNumber = ${JSON.stringify(getErrorMessage(constraint, 'must be a valid phone number'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Content
    case 'contains':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && !${valueName}.includes(${JSON.stringify(constraint.value)})) {`);
      lines.push(`${indent}    ${errorsName}.contains = ${JSON.stringify(getErrorMessage(constraint, `must contain a ${constraint.value} string`))};`);
      lines.push(`    }`);
      break;

    case 'notContains':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && ${valueName}.includes(${JSON.stringify(constraint.value)})) {`);
      lines.push(`${indent}    ${errorsName}.notContains = ${JSON.stringify(getErrorMessage(constraint, `should not contain a ${constraint.value} string`))};`);
      lines.push(`    }`);
      break;

    case 'isLowercase':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && ${valueName} !== ${valueName}.toLowerCase()) {`);
      lines.push(`${indent}    ${errorsName}.isLowercase = ${JSON.stringify(getErrorMessage(constraint, 'must be a lowercase string'))};`);
      lines.push(`    }`);
      break;

    case 'isUppercase':
      lines.push(`${indent}  if (typeof ${valueName} === 'string' && ${valueName} !== ${valueName}.toUpperCase()) {`);
      lines.push(`${indent}    ${errorsName}.isUppercase = ${JSON.stringify(getErrorMessage(constraint, 'must be an uppercase string'))};`);
      lines.push(`    }`);
      break;

    case 'matches':
      if (constraint.value && typeof constraint.value === 'object') {
        const pattern = constraint.value.pattern;
        const modifiers = constraint.value.modifiers || '';
        lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
        lines.push(`${indent}    const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(modifiers)});`);
        lines.push(`${indent}    if (!regex.test(${valueName})) {`);
        lines.push(`${indent}      ${errorsName}.matches = ${JSON.stringify(getErrorMessage(constraint, `must match ${pattern} regular expression`))};`);
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    // Number validators
    case 'isDivisibleBy':
      lines.push(`${indent}  if (typeof ${valueName} === 'number' && ${valueName} % ${constraint.value} !== 0) {`);
      lines.push(`${indent}    ${errorsName}.isDivisibleBy = ${JSON.stringify(getErrorMessage(constraint, `must be divisible by ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'isDecimal':
      lines.push(`${indent}  if (typeof ${valueName} === 'number') {`);
      lines.push(`${indent}    if (Number.isInteger(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isDecimal = ${JSON.stringify(getErrorMessage(constraint, 'must be a decimal number'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Date validators
    case 'minDate':
      if (constraint.value instanceof Date) {
        const minTime = constraint.value.getTime();
        lines.push(`${indent}  if (${valueName} instanceof Date) {`);
        lines.push(`${indent}    if (${valueName}.getTime() < ${minTime}) {`);
        lines.push(`${indent}      ${errorsName}.minDate = ${JSON.stringify(getErrorMessage(constraint, `minimal allowed date is ${constraint.value.toISOString()}`))};`);
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    case 'maxDate':
      if (constraint.value instanceof Date) {
        const maxTime = constraint.value.getTime();
        lines.push(`${indent}  if (${valueName} instanceof Date) {`);
        lines.push(`${indent}    if (${valueName}.getTime() > ${maxTime}) {`);
        lines.push(`${indent}      ${errorsName}.maxDate = ${JSON.stringify(getErrorMessage(constraint, `maximal allowed date is ${constraint.value.toISOString()}`))};`);
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    // Common validators - Comparison
    case 'equals':
      lines.push(`${indent}  if (${valueName} !== ${JSON.stringify(constraint.value)}) {`);
      lines.push(`${indent}    ${errorsName}.equals = ${JSON.stringify(getErrorMessage(constraint, `must be equal to ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'notEquals':
      lines.push(`${indent}  if (${valueName} === ${JSON.stringify(constraint.value)}) {`);
      lines.push(`${indent}    ${errorsName}.notEquals = ${JSON.stringify(getErrorMessage(constraint, `should not be equal to ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'isIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const allowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`${indent}  if (!allowedValues.includes(${valueName})) {`);
        lines.push(`${indent}    ${errorsName}.isIn = ${JSON.stringify(getErrorMessage(constraint, `must be one of the following values: ${constraint.value.join(', ')}`))};`);
        lines.push(`    }`);
      }
      break;

    case 'isNotIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const disallowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`${indent}  if (disallowedValues.includes(${valueName})) {`);
        lines.push(`${indent}    ${errorsName}.isNotIn = ${JSON.stringify(getErrorMessage(constraint, `should not be one of the following values: ${constraint.value.join(', ')}`))};`);
        lines.push(`    }`);
      }
      break;

    case 'isEmpty':
      lines.push(`${indent}  if (${valueName} !== null && ${valueName} !== undefined) {`);
      lines.push(`${indent}    if (typeof ${valueName} === 'string' && ${valueName}.length > 0) {`);
      lines.push(`${indent}      ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`${indent}    } else if (Array.isArray(${valueName}) && ${valueName}.length > 0) {`);
      lines.push(`${indent}      ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`${indent}    } else if (typeof ${valueName} === 'object' && Object.keys(${valueName}).length > 0) {`);
      lines.push(`${indent}      ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Object validators
    case 'isNotEmptyObject':
      lines.push(`${indent}  if (typeof ${valueName} === 'object' && ${valueName} !== null && !Array.isArray(${valueName})) {`);
      lines.push(`${indent}    if (Object.keys(${valueName}).length === 0) {`);
      lines.push(`${indent}      ${errorsName}.isNotEmptyObject = ${JSON.stringify(getErrorMessage(constraint, 'must be a non-empty object'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Geographic validators
    case 'isLatLong':
      lines.push(`${indent}  if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const latLongRegex = /^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$/;`);
      lines.push(`${indent}    if (!latLongRegex.test(${valueName})) {`);
      lines.push(`${indent}      ${errorsName}.isLatLong = ${JSON.stringify(getErrorMessage(constraint, 'must be a latitude,longitude string'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isLatitude':
      lines.push(`${indent}  if (typeof ${valueName} === 'number') {`);
      lines.push(`${indent}    if (${valueName} < -90 || ${valueName} > 90) {`);
      lines.push(`${indent}      ${errorsName}.isLatitude = ${JSON.stringify(getErrorMessage(constraint, 'latitude must be a number between -90 and 90'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    } else if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const lat = parseFloat(${valueName});`);
      lines.push(`${indent}    if (isNaN(lat) || lat < -90 || lat > 90) {`);
      lines.push(`${indent}      ${errorsName}.isLatitude = ${JSON.stringify(getErrorMessage(constraint, 'latitude must be a number between -90 and 90'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isLongitude':
      lines.push(`${indent}  if (typeof ${valueName} === 'number') {`);
      lines.push(`${indent}    if (${valueName} < -180 || ${valueName} > 180) {`);
      lines.push(`${indent}      ${errorsName}.isLongitude = ${JSON.stringify(getErrorMessage(constraint, 'longitude must be a number between -180 and 180'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    } else if (typeof ${valueName} === 'string') {`);
      lines.push(`${indent}    const lon = parseFloat(${valueName});`);
      lines.push(`${indent}    if (isNaN(lon) || lon < -180 || lon > 180) {`);
      lines.push(`${indent}      ${errorsName}.isLongitude = ${JSON.stringify(getErrorMessage(constraint, 'longitude must be a number between -180 and 180'))};`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'custom':
      // Handle @Validate decorator with validator class
      // Note: validator class is accessed from metadata at runtime
      if (constraint.value && constraint.value.constraintClass) {
        const errorMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'));
        lines.push(`${indent}// Custom validator class`);
        lines.push(`${indent}{`);
        lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
        lines.push(`${indent}  const constraintValue = constraint.value;`);
        lines.push(`${indent}  const validatorInstance = getValidatorInstance(constraintValue.constraintClass);`);
        lines.push(`${indent}  const args = {`);
        lines.push(`${indent}    value: ${valueName},`);
        lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
        lines.push(`${indent}    targetName: object.constructor.name,`);
        lines.push(`${indent}    object: object,`);
        lines.push(`${indent}    property: ${safePropName}`);
        lines.push(`${indent}  };`);
        lines.push(`${indent}  const result = validatorInstance.validate(${valueName}, args);`);
        lines.push(`${indent}  if (!result) {`);
        lines.push(`${indent}    if (validatorInstance.defaultMessage) {`);
        lines.push(`${indent}      ${errorsName}.custom = validatorInstance.defaultMessage(args);`);
        lines.push(`${indent}    } else {`);
        lines.push(`${indent}      ${errorsName}.custom = ${errorMsg};`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      }
      break;

    case 'validateBy':
      // Handle ValidateBy decorator
      if (constraint.value && constraint.value.validator) {
        const validatorName = constraint.value.name || 'custom';
        const defaultMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'));
        lines.push(`${indent}// ValidateBy: ${validatorName}`);
        lines.push(`${indent}{`);
        lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
        lines.push(`${indent}  const constraintValue = constraint.value;`);
        lines.push(`${indent}  const args = {`);
        lines.push(`${indent}    value: ${valueName},`);
        lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
        lines.push(`${indent}    targetName: object.constructor.name,`);
        lines.push(`${indent}    object: object,`);
        lines.push(`${indent}    property: ${safePropName}`);
        lines.push(`${indent}  };`);
        lines.push(`${indent}  const result = constraintValue.validator(${valueName}, args);`);
        lines.push(`${indent}  if (!result) {`);
        lines.push(`${indent}    if (constraintValue.defaultMessage) {`);
        lines.push(`${indent}      ${errorsName}.${validatorName} = constraintValue.defaultMessage(args);`);
        lines.push(`${indent}    } else {`);
        lines.push(`${indent}      ${errorsName}.${validatorName} = ${defaultMsg};`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      }
      break;

    // Type checker - IsInstance
    case 'isInstance':
      if (constraint.value) {
        lines.push(`${indent}// IsInstance validator`);
        lines.push(`${indent}{`);
        lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
        lines.push(`${indent}  const targetType = constraint.value;`);
        lines.push(`${indent}  if (!(${valueName} instanceof targetType)) {`);
        lines.push(`${indent}    ${errorsName}.isInstance = ${JSON.stringify(getErrorMessage(constraint, 'must be an instance of the specified class'))};`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      }
      break;

    // Conditional validation - ValidateIf
    case 'validateIf':
      // ValidateIf is handled at the property level, not as a constraint check
      // The condition is evaluated before other constraints are checked
      // This is a no-op in constraint checking
      break;

    // Allow decorator - no validation needed
    case 'allow':
      // Allow decorator marks property as allowed without validation
      // This is a no-op in constraint checking
      break;

    // ValidatePromise - handled in async validation
    case 'validatePromise':
      // ValidatePromise is handled in async validation flow
      // This is a no-op in sync constraint checking
      break;

    default:
      // For unknown constraint types, skip (will be handled by runtime validators)
      break;
  }

  return lines.join('\n');
}

/**
 * Generate async validation check code for a constraint
 */
let asyncTaskCounter = 0;
function generateAsyncConstraintCheck(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  errorsName: string,
  asyncTasksName: string,
  indent: string = '  ',
): string {
  const lines: string[] = [];
  const safePropName = JSON.stringify(propertyName);

  // For custom validators with async support (inline validator function)
  if (constraint.type === 'custom' && constraint.validator) {
    const taskVarName = `customTask_${asyncTaskCounter++}`;
    const errorMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'));
    lines.push(`${indent}// Custom async validator (inline)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
    lines.push(`${indent}  if (constraint.validator) {`);
    lines.push(`${indent}    const result = await constraint.validator(${valueName});`);
    lines.push(`${indent}    if (!result) {`);
    lines.push(`${indent}      ${errorsName}.${constraint.type} = ${errorMsg};`);
    lines.push(`${indent}    }`);
    lines.push(`${indent}  }`);
    lines.push(`${indent}})();`);
    lines.push(`${indent}${asyncTasksName}.push(${taskVarName});`);
  } else if (constraint.type === 'custom' && constraint.value && constraint.value.constraintClass) {
    // For custom validator classes (may be async)
    const taskVarName = `customTask_${asyncTaskCounter++}`;
    const errorMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'));
    lines.push(`${indent}// Custom validator class (potentially async)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
    lines.push(`${indent}  const constraintValue = constraint.value;`);
    lines.push(`${indent}  const validatorInstance = getValidatorInstance(constraintValue.constraintClass);`);
    lines.push(`${indent}  const args = {`);
    lines.push(`${indent}    value: ${valueName},`);
    lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
    lines.push(`${indent}    targetName: object.constructor.name,`);
    lines.push(`${indent}    object: object,`);
    lines.push(`${indent}    property: ${safePropName}`);
    lines.push(`${indent}  };`);
    lines.push(`${indent}  const result = await validatorInstance.validate(${valueName}, args);`);
    lines.push(`${indent}  if (!result) {`);
    lines.push(`${indent}    if (validatorInstance.defaultMessage) {`);
    lines.push(`${indent}      ${errorsName}.custom = validatorInstance.defaultMessage(args);`);
    lines.push(`${indent}    } else {`);
    lines.push(`${indent}      ${errorsName}.custom = ${errorMsg};`);
    lines.push(`${indent}    }`);
    lines.push(`${indent}  }`);
    lines.push(`${indent}})();`);
    lines.push(`${indent}${asyncTasksName}.push(${taskVarName});`);
  } else if (constraint.type === 'validateBy' && constraint.value && constraint.value.validator) {
    // For ValidateBy decorators (may be async)
    const taskVarName = `customTask_${asyncTaskCounter++}`;
    const validatorName = constraint.value.name || 'custom';
    const defaultMsg = JSON.stringify(getErrorMessage(constraint, 'validation failed'));
    lines.push(`${indent}// ValidateBy: ${validatorName} (potentially async)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(`${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`);
    lines.push(`${indent}  const constraintValue = constraint.value;`);
    lines.push(`${indent}  const args = {`);
    lines.push(`${indent}    value: ${valueName},`);
    lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
    lines.push(`${indent}    targetName: object.constructor.name,`);
    lines.push(`${indent}    object: object,`);
    lines.push(`${indent}    property: ${safePropName}`);
    lines.push(`${indent}  };`);
    lines.push(`${indent}  const result = await constraintValue.validator(${valueName}, args);`);
    lines.push(`${indent}  if (!result) {`);
    lines.push(`${indent}    if (constraintValue.defaultMessage) {`);
    lines.push(`${indent}      ${errorsName}.${validatorName} = constraintValue.defaultMessage(args);`);
    lines.push(`${indent}    } else {`);
    lines.push(`${indent}      ${errorsName}.${validatorName} = ${defaultMsg};`);
    lines.push(`${indent}    }`);
    lines.push(`${indent}  }`);
    lines.push(`${indent}})();`);
    lines.push(`${indent}${asyncTasksName}.push(${taskVarName});`);
  } else {
    // For built-in validators, use sync validation (they don't support async)
    lines.push(generateConstraintCheck(constraint, constraintIndex, propertyName, valueName, errorsName, indent));
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
  compiledAsyncValidatorsCache.clear();
  clearValidatorInstanceCache();
}

/**
 * Get cache size (for debugging)
 */
export function getValidatorCacheSize(): number {
  return compiledValidatorsCache.size + compiledAsyncValidatorsCache.size;
}

