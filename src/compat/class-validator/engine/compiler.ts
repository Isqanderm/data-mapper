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

    // String validators - Email & Web
    case 'isEmail':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;`);
      lines.push(`      if (!emailRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isEmail = ${JSON.stringify(getErrorMessage(constraint, 'must be an email'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isURL':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      try {`);
      lines.push(`        new URL(${valueName});`);
      lines.push(`      } catch {`);
      lines.push(`        ${errorsName}.isURL = ${JSON.stringify(getErrorMessage(constraint, 'must be a URL address'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isUUID':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      if (constraint.value === '3') {
        lines.push(`      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else if (constraint.value === '4') {
        lines.push(`      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else if (constraint.value === '5') {
        lines.push(`      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`);
      } else {
        lines.push(`      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;`);
      }
      lines.push(`      if (!uuidRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isUUID = ${JSON.stringify(getErrorMessage(constraint, 'must be a UUID'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isJSON':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      try {`);
      lines.push(`        JSON.parse(${valueName});`);
      lines.push(`      } catch {`);
      lines.push(`        ${errorsName}.isJSON = ${JSON.stringify(getErrorMessage(constraint, 'must be a json string'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // String validators - Format
    case 'isAlpha':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const alphaRegex = /^[a-zA-Z]+$/;`);
      lines.push(`      if (!alphaRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isAlpha = ${JSON.stringify(getErrorMessage(constraint, 'must contain only letters (a-zA-Z)'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isAlphanumeric':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const alphanumericRegex = /^[a-zA-Z0-9]+$/;`);
      lines.push(`      if (!alphanumericRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isAlphanumeric = ${JSON.stringify(getErrorMessage(constraint, 'must contain only letters and numbers'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isHexColor':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;`);
      lines.push(`      if (!hexColorRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isHexColor = ${JSON.stringify(getErrorMessage(constraint, 'must be a hexadecimal color'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isIP':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      if (constraint.value === '4') {
        lines.push(`      const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`);
      } else if (constraint.value === '6') {
        lines.push(`      const ipRegex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;`);
      } else {
        lines.push(`      const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`);
        lines.push(`      const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;`);
        lines.push(`      const ipRegex = { test: (v) => ipv4Regex.test(v) || ipv6Regex.test(v) };`);
      }
      lines.push(`      if (!ipRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isIP = ${JSON.stringify(getErrorMessage(constraint, 'must be an ip address'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // String validators - Specialized
    case 'isCreditCard':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      lines.push(`      if (!/^[0-9]{13,19}$/.test(sanitized)) {`);
      lines.push(`        ${errorsName}.isCreditCard = ${JSON.stringify(getErrorMessage(constraint, 'must be a credit card'))};`);
      lines.push(`      } else {`);
      // Luhn algorithm
      lines.push(`        let sum = 0;`);
      lines.push(`        let isEven = false;`);
      lines.push(`        for (let i = sanitized.length - 1; i >= 0; i--) {`);
      lines.push(`          let digit = parseInt(sanitized[i], 10);`);
      lines.push(`          if (isEven) {`);
      lines.push(`            digit *= 2;`);
      lines.push(`            if (digit > 9) digit -= 9;`);
      lines.push(`          }`);
      lines.push(`          sum += digit;`);
      lines.push(`          isEven = !isEven;`);
      lines.push(`        }`);
      lines.push(`        if (sum % 10 !== 0) {`);
      lines.push(`          ${errorsName}.isCreditCard = ${JSON.stringify(getErrorMessage(constraint, 'must be a credit card'))};`);
      lines.push(`        }`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isISBN':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      if (constraint.value === '10') {
        lines.push(`      if (!/^[0-9]{9}[0-9X]$/i.test(sanitized)) {`);
        lines.push(`        ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`      }`);
      } else if (constraint.value === '13') {
        lines.push(`      if (!/^[0-9]{13}$/.test(sanitized)) {`);
        lines.push(`        ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`      }`);
      } else {
        lines.push(`      const isbn10 = /^[0-9]{9}[0-9X]$/i.test(sanitized);`);
        lines.push(`      const isbn13 = /^[0-9]{13}$/.test(sanitized);`);
        lines.push(`      if (!isbn10 && !isbn13) {`);
        lines.push(`        ${errorsName}.isISBN = ${JSON.stringify(getErrorMessage(constraint, 'must be an ISBN'))};`);
        lines.push(`      }`);
      }
      lines.push(`    }`);
      break;

    case 'isPhoneNumber':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;`);
      lines.push(`      if (!phoneRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isPhoneNumber = ${JSON.stringify(getErrorMessage(constraint, 'must be a valid phone number'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // String validators - Content
    case 'contains':
      lines.push(`    if (typeof ${valueName} === 'string' && !${valueName}.includes(${JSON.stringify(constraint.value)})) {`);
      lines.push(`      ${errorsName}.contains = ${JSON.stringify(getErrorMessage(constraint, `must contain a ${constraint.value} string`))};`);
      lines.push(`    }`);
      break;

    case 'notContains':
      lines.push(`    if (typeof ${valueName} === 'string' && ${valueName}.includes(${JSON.stringify(constraint.value)})) {`);
      lines.push(`      ${errorsName}.notContains = ${JSON.stringify(getErrorMessage(constraint, `should not contain a ${constraint.value} string`))};`);
      lines.push(`    }`);
      break;

    case 'isLowercase':
      lines.push(`    if (typeof ${valueName} === 'string' && ${valueName} !== ${valueName}.toLowerCase()) {`);
      lines.push(`      ${errorsName}.isLowercase = ${JSON.stringify(getErrorMessage(constraint, 'must be a lowercase string'))};`);
      lines.push(`    }`);
      break;

    case 'isUppercase':
      lines.push(`    if (typeof ${valueName} === 'string' && ${valueName} !== ${valueName}.toUpperCase()) {`);
      lines.push(`      ${errorsName}.isUppercase = ${JSON.stringify(getErrorMessage(constraint, 'must be an uppercase string'))};`);
      lines.push(`    }`);
      break;

    case 'matches':
      if (constraint.value && typeof constraint.value === 'object') {
        const pattern = constraint.value.pattern;
        const modifiers = constraint.value.modifiers || '';
        lines.push(`    if (typeof ${valueName} === 'string') {`);
        lines.push(`      const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(modifiers)});`);
        lines.push(`      if (!regex.test(${valueName})) {`);
        lines.push(`        ${errorsName}.matches = ${JSON.stringify(getErrorMessage(constraint, `must match ${pattern} regular expression`))};`);
        lines.push(`      }`);
        lines.push(`    }`);
      }
      break;

    // Number validators
    case 'isDivisibleBy':
      lines.push(`    if (typeof ${valueName} === 'number' && ${valueName} % ${constraint.value} !== 0) {`);
      lines.push(`      ${errorsName}.isDivisibleBy = ${JSON.stringify(getErrorMessage(constraint, `must be divisible by ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'isDecimal':
      lines.push(`    if (typeof ${valueName} === 'number') {`);
      lines.push(`      if (Number.isInteger(${valueName})) {`);
      lines.push(`        ${errorsName}.isDecimal = ${JSON.stringify(getErrorMessage(constraint, 'must be a decimal number'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // Date validators
    case 'minDate':
      if (constraint.value instanceof Date) {
        const minTime = constraint.value.getTime();
        lines.push(`    if (${valueName} instanceof Date) {`);
        lines.push(`      if (${valueName}.getTime() < ${minTime}) {`);
        lines.push(`        ${errorsName}.minDate = ${JSON.stringify(getErrorMessage(constraint, `minimal allowed date is ${constraint.value.toISOString()}`))};`);
        lines.push(`      }`);
        lines.push(`    }`);
      }
      break;

    case 'maxDate':
      if (constraint.value instanceof Date) {
        const maxTime = constraint.value.getTime();
        lines.push(`    if (${valueName} instanceof Date) {`);
        lines.push(`      if (${valueName}.getTime() > ${maxTime}) {`);
        lines.push(`        ${errorsName}.maxDate = ${JSON.stringify(getErrorMessage(constraint, `maximal allowed date is ${constraint.value.toISOString()}`))};`);
        lines.push(`      }`);
        lines.push(`    }`);
      }
      break;

    // Common validators - Comparison
    case 'equals':
      lines.push(`    if (${valueName} !== ${JSON.stringify(constraint.value)}) {`);
      lines.push(`      ${errorsName}.equals = ${JSON.stringify(getErrorMessage(constraint, `must be equal to ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'notEquals':
      lines.push(`    if (${valueName} === ${JSON.stringify(constraint.value)}) {`);
      lines.push(`      ${errorsName}.notEquals = ${JSON.stringify(getErrorMessage(constraint, `should not be equal to ${constraint.value}`))};`);
      lines.push(`    }`);
      break;

    case 'isIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const allowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`    if (!allowedValues.includes(${valueName})) {`);
        lines.push(`      ${errorsName}.isIn = ${JSON.stringify(getErrorMessage(constraint, `must be one of the following values: ${constraint.value.join(', ')}`))};`);
        lines.push(`    }`);
      }
      break;

    case 'isNotIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const disallowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`    if (disallowedValues.includes(${valueName})) {`);
        lines.push(`      ${errorsName}.isNotIn = ${JSON.stringify(getErrorMessage(constraint, `should not be one of the following values: ${constraint.value.join(', ')}`))};`);
        lines.push(`    }`);
      }
      break;

    case 'isEmpty':
      lines.push(`    if (${valueName} !== null && ${valueName} !== undefined) {`);
      lines.push(`      if (typeof ${valueName} === 'string' && ${valueName}.length > 0) {`);
      lines.push(`        ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`      } else if (Array.isArray(${valueName}) && ${valueName}.length > 0) {`);
      lines.push(`        ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`      } else if (typeof ${valueName} === 'object' && Object.keys(${valueName}).length > 0) {`);
      lines.push(`        ${errorsName}.isEmpty = ${JSON.stringify(getErrorMessage(constraint, 'must be empty'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // Object validators
    case 'isNotEmptyObject':
      lines.push(`    if (typeof ${valueName} === 'object' && ${valueName} !== null && !Array.isArray(${valueName})) {`);
      lines.push(`      if (Object.keys(${valueName}).length === 0) {`);
      lines.push(`        ${errorsName}.isNotEmptyObject = ${JSON.stringify(getErrorMessage(constraint, 'must be a non-empty object'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    // Geographic validators
    case 'isLatLong':
      lines.push(`    if (typeof ${valueName} === 'string') {`);
      lines.push(`      const latLongRegex = /^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$/;`);
      lines.push(`      if (!latLongRegex.test(${valueName})) {`);
      lines.push(`        ${errorsName}.isLatLong = ${JSON.stringify(getErrorMessage(constraint, 'must be a latitude,longitude string'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isLatitude':
      lines.push(`    if (typeof ${valueName} === 'number') {`);
      lines.push(`      if (${valueName} < -90 || ${valueName} > 90) {`);
      lines.push(`        ${errorsName}.isLatitude = ${JSON.stringify(getErrorMessage(constraint, 'latitude must be a number between -90 and 90'))};`);
      lines.push(`      }`);
      lines.push(`    } else if (typeof ${valueName} === 'string') {`);
      lines.push(`      const lat = parseFloat(${valueName});`);
      lines.push(`      if (isNaN(lat) || lat < -90 || lat > 90) {`);
      lines.push(`        ${errorsName}.isLatitude = ${JSON.stringify(getErrorMessage(constraint, 'latitude must be a number between -90 and 90'))};`);
      lines.push(`      }`);
      lines.push(`    }`);
      break;

    case 'isLongitude':
      lines.push(`    if (typeof ${valueName} === 'number') {`);
      lines.push(`      if (${valueName} < -180 || ${valueName} > 180) {`);
      lines.push(`        ${errorsName}.isLongitude = ${JSON.stringify(getErrorMessage(constraint, 'longitude must be a number between -180 and 180'))};`);
      lines.push(`      }`);
      lines.push(`    } else if (typeof ${valueName} === 'string') {`);
      lines.push(`      const lon = parseFloat(${valueName});`);
      lines.push(`      if (isNaN(lon) || lon < -180 || lon > 180) {`);
      lines.push(`        ${errorsName}.isLongitude = ${JSON.stringify(getErrorMessage(constraint, 'longitude must be a number between -180 and 180'))};`);
      lines.push(`      }`);
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

