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
import { getValidatorInstance, clearValidatorInstanceCache } from './validator-registry';

/**
 * Cache for compiled validators
 */
const compiledValidatorsCache = new Map<any, CompiledValidator>();

/**
 * Cache for compiled async validators
 */
const compiledAsyncValidatorsCache = new Map<any, AsyncCompiledValidator>();

/**
 * Matches a valid JS identifier, used to decide whether a validateBy or
 * custom constraint's raw name is safe to use as an error-object property key.
 */
const IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Sanitize a custom/validateBy validator's raw name into the key that will
 * actually be used on the generated error object: the name itself when
 * it's a valid identifier, otherwise the 'custom' fallback. Must be kept
 * in sync between the emitted error keys and the stopAtFirstError order
 * array — both need to agree on which key a given constraint lands on.
 *
 * `__proto__` is rejected even though it is a valid identifier: assigning to
 * it hits the Object.prototype setter instead of creating an own property,
 * which would make a failing constraint look like a passing one.
 */
function sanitizeValidatorName(rawName: string): string {
  if (rawName === '__proto__') return 'custom';
  return IDENTIFIER_REGEX.test(rawName) ? rawName : 'custom';
}

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
    return compiledFn(
      object,
      options,
      getValidationMetadata,
      hasValidationMetadata,
      compileValidator,
      getValidatorInstance,
      metadata,
    );
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
    return compiledFn(
      object,
      options,
      getValidationMetadata,
      hasValidationMetadata,
      compileValidator,
      compileAsyncValidator,
      getValidatorInstance,
      metadata,
    );
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

  // whitelist / forbidNonWhitelisted
  const knownKeys = JSON.stringify([...metadata.properties.keys()].map(String));
  lines.push('// whitelist / forbidNonWhitelisted');
  lines.push('if (opts.whitelist) {');
  lines.push(`  const knownProps = new Set(${knownKeys});`);
  lines.push('  for (const key of Object.keys(object)) {');
  lines.push('    if (!knownProps.has(key)) {');
  lines.push('      if (opts.forbidNonWhitelisted) {');
  lines.push('        errors.push({');
  lines.push('          property: key,');
  lines.push('          value: object[key],');
  lines.push('          target: object,');
  lines.push(
    "          constraints: { whitelistValidation: 'property ' + key + ' should not exist' },",
  );
  lines.push('        });');
  lines.push('      } else {');
  lines.push('        delete object[key];');
  lines.push('      }');
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  lines.push('');

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

  // whitelist / forbidNonWhitelisted
  const knownKeysAsync = JSON.stringify([...metadata.properties.keys()].map(String));
  lines.push('  // whitelist / forbidNonWhitelisted');
  lines.push('  if (opts.whitelist) {');
  lines.push(`    const knownProps = new Set(${knownKeysAsync});`);
  lines.push('    for (const key of Object.keys(object)) {');
  lines.push('      if (!knownProps.has(key)) {');
  lines.push('        if (opts.forbidNonWhitelisted) {');
  lines.push('          errors.push({');
  lines.push('            property: key,');
  lines.push('            value: object[key],');
  lines.push('            target: object,');
  lines.push(
    "            constraints: { whitelistValidation: 'property ' + key + ' should not exist' },",
  );
  lines.push('          });');
  lines.push('        } else {');
  lines.push('          delete object[key];');
  lines.push('        }');
  lines.push('      }');
  lines.push('    }');
  lines.push('  }');
  lines.push('');

  lines.push('  return errors;');
  lines.push('})();');

  return lines.join('\n');
}

/**
 * Generate validation code for a single property
 */
/**
 * JavaScript expression deciding whether a constraint runs under the caller's
 * group filter.
 *
 * Upstream's rule, measured against class-validator 0.14.4: with no filter
 * (option absent or empty) everything runs; with a filter only constraints
 * whose groups intersect it run, and an ungrouped constraint is skipped;
 * `always` ignores the filter entirely. `always` can be set per decorator or
 * defaulted for the whole call through ValidatorOptions.
 */
function groupGateExpression(groups: string[] | undefined, always: boolean | undefined): string {
  const alwaysExpr = always ? 'true' : 'opts.always === true';
  const noFilter = '!opts.groups || opts.groups.length === 0';
  if (!groups || groups.length === 0) {
    return `${alwaysExpr} || (${noFilter})`;
  }
  const groupsJson = JSON.stringify(groups);
  return `${alwaysExpr} || (${noFilter}) || opts.groups.some(g => ${groupsJson}.includes(g))`;
}

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
  lines.push(`  const skipProp =`);
  lines.push(`    (opts.skipUndefinedProperties && value === undefined) ||`);
  lines.push(`    (opts.skipNullProperties && value === null) ||`);
  lines.push(`    (opts.skipMissingProperties && (value === undefined || value === null));`);

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
      // Same gate as a constraint's: optionality applies unless the caller
      // filtered this group out.
      const gate = groupGateExpression(metadata.optionalGroups, metadata.optionalAlways);
      lines.push(`  // Optional with groups`);
      lines.push(`  if ((value === undefined || value === null) && (${gate})) {`);
      lines.push(`    // Skip validation for optional property in an active group`);
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
    const skipGuard = constraint.type !== 'isDefined';
    // Group filter (see groupGateExpression)
    const gate = groupGateExpression(constraint.groups, constraint.always);
    lines.push(`  if (${gate}) {`);
    {
      const check = emitConstraintCheck(
        constraint,
        i,
        propertyName,
        'value',
        'propertyErrors',
        '    ',
      );
      const guardedCheck = [
        `    if (!(opts.stopAtFirstError && Object.keys(propertyErrors).length > 0)) {`,
        check,
        `    }`,
      ].join('\n');
      if (skipGuard) {
        lines.push(`    if (!skipProp) {`);
        lines.push(guardedCheck);
        lines.push(`    }`);
      } else {
        lines.push(guardedCheck);
      }
    }
    lines.push(`  }`);
  }

  // Handle nested validation
  if (metadata.isNested) {
    lines.push(`  // Nested validation`);
    lines.push(`  if (!skipProp && value !== null && value !== undefined) {`);

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
  lines.push(`    const skipProp =`);
  lines.push(`      (opts.skipUndefinedProperties && value === undefined) ||`);
  lines.push(`      (opts.skipNullProperties && value === null) ||`);
  lines.push(`      (opts.skipMissingProperties && (value === undefined || value === null));`);

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
      // Same gate as the sync path and as a constraint's.
      const gate = groupGateExpression(metadata.optionalGroups, metadata.optionalAlways);
      lines.push(`  // Optional with groups`);
      lines.push(`  if ((value === undefined || value === null) && (${gate})) {`);
      lines.push(`    // Skip validation for optional property in an active group`);
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
    const skipGuard = constraint.type !== 'isDefined';
    // Group filter (see groupGateExpression)
    const gate = groupGateExpression(constraint.groups, constraint.always);
    lines.push(`    if (${gate}) {`);
    {
      const check = emitAsyncConstraintCheck(
        constraint,
        i,
        propertyName,
        'value',
        'propertyErrors',
        'propertyAsyncTasks',
        '      ',
      );
      const guardedCheck = [
        `      if (!(opts.stopAtFirstError && Object.keys(propertyErrors).length > 0)) {`,
        check,
        `      }`,
      ].join('\n');
      if (skipGuard) {
        lines.push(`      if (!skipProp) {`);
        lines.push(guardedCheck);
        lines.push(`      }`);
      } else {
        lines.push(guardedCheck);
      }
    }
    lines.push(`    }`);
  }

  // Handle nested validation
  if (metadata.isNested) {
    lines.push(`  // Nested async validation`);
    lines.push(`  if (!skipProp && value !== null && value !== undefined) {`);

    // Check if it's an array of nested objects
    lines.push(`    if (Array.isArray(value)) {`);
    lines.push(`      // Validate array of nested objects asynchronously`);
    lines.push(`      const arrayAsyncTask = (async () => {`);
    lines.push(`        for (let i = 0; i < value.length; i++) {`);
    lines.push(`          const nestedValue = value[i];`);
    lines.push(`          if (nestedValue && typeof nestedValue === 'object') {`);
    lines.push(`            const nestedValidator = getNestedAsyncValidator(nestedValue);`);
    lines.push(`            if (nestedValidator) {`);
    lines.push(
      `              const nestedValidationErrors = await nestedValidator(nestedValue, opts);`,
    );
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
  // stopAtFirstError post-trim: async constraint tasks are fired without
  // intermediate awaits, so the synchronous per-check guard above cannot see
  // errors recorded by other async constraints on this property. Once all
  // async tasks have settled, trim propertyErrors down to a single entry
  // (the first constraint in declaration order that actually failed).
  const stopAtFirstErrorOrder = JSON.stringify(
    metadata.constraints.map((c) => {
      if (c.type === 'validateBy')
        return sanitizeValidatorName((c.value && c.value.name) || 'custom');
      if (c.type === 'custom') return sanitizeValidatorName((c.value && c.value.name) || 'custom');
      return c.type;
    }),
  );
  lines.push(`    if (opts.stopAtFirstError) {`);
  lines.push(`      const keys = Object.keys(propertyErrors);`);
  lines.push(`      if (keys.length > 1) {`);
  lines.push(`        const order = ${stopAtFirstErrorOrder};`);
  lines.push(
    `        const firstKey = order.find(k => Object.hasOwn(propertyErrors, k)) || keys[0];`,
  );
  lines.push(`        for (const k of keys) { if (k !== firstKey) delete propertyErrors[k]; }`);
  lines.push(`      }`);
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
/**
 * Emit a constraint check, looping over the property's elements when the
 * constraint carries `each`.
 */
function emitConstraintCheck(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  errorsName: string,
  indent: string = '  ',
): string {
  if (!constraint.each) {
    return generateConstraintCheck(
      constraint,
      constraintIndex,
      propertyName,
      valueName,
      errorsName,
      indent,
    );
  }
  const itemName = `eachItem${constraintIndex}`;
  const check = generateConstraintCheck(
    constraint,
    constraintIndex,
    propertyName,
    itemName,
    errorsName,
    `${indent}    `,
  );
  return wrapEachLoop(check, valueName, itemName, `eachIdx${constraintIndex}`, indent);
}

/**
 * Async twin of {@link emitConstraintCheck}.
 */
function emitAsyncConstraintCheck(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  errorsName: string,
  asyncTasksName: string,
  indent: string = '  ',
): string {
  if (!constraint.each) {
    return generateAsyncConstraintCheck(
      constraint,
      constraintIndex,
      propertyName,
      valueName,
      errorsName,
      asyncTasksName,
      indent,
    );
  }
  const itemName = `eachItem${constraintIndex}`;
  const check = generateAsyncConstraintCheck(
    constraint,
    constraintIndex,
    propertyName,
    itemName,
    errorsName,
    asyncTasksName,
    `${indent}    `,
  );
  return wrapEachLoop(check, valueName, itemName, `eachIdx${constraintIndex}`, indent);
}

/**
 * Wrap a generated constraint check in a loop over the property's elements.
 *
 * The check is emitted against `itemName` rather than the property value, so
 * every element is measured. Errors are keyed by constraint name, so an
 * element that fails writes the same key as any other — which yields one error
 * for the property, matching upstream, rather than one per element. A value
 * that is neither an array nor a Set is left alone (upstream skips it too).
 */
function wrapEachLoop(
  check: string,
  valueName: string,
  itemName: string,
  loopVar: string,
  indent: string,
): string {
  const itemsVar = `${itemName}s`;
  return [
    `${indent}if (Array.isArray(${valueName}) || ${valueName} instanceof Set) {`,
    `${indent}  const ${itemsVar} = Array.isArray(${valueName}) ? ${valueName} : Array.from(${valueName});`,
    `${indent}  for (let ${loopVar} = 0; ${loopVar} < ${itemsVar}.length; ${loopVar}++) {`,
    `${indent}    const ${itemName} = ${itemsVar}[${loopVar}];`,
    check,
    `${indent}  }`,
    `${indent}}`,
  ].join('\n');
}

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
      lines.push(
        `${indent}    ${errorsName}.isString = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a string')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'minLength':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName}.length < ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.minLength = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be at least ${constraint.value} characters`)};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'maxLength':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName}.length > ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.maxLength = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be at most ${constraint.value} characters`)};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isNumber':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number' || isNaN(${valueName})) {`);
      lines.push(
        `${indent}    ${errorsName}.isNumber = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number')};`,
      );
      lines.push(`    }`);
      break;

    case 'min':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' || ${valueName} < ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.min = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be less than ${constraint.value}`)};`,
      );
      lines.push(`    }`);
      break;

    case 'max':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' || ${valueName} > ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.max = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be greater than ${constraint.value}`)};`,
      );
      lines.push(`    }`);
      break;

    case 'isInt':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' || !Number.isInteger(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isInt = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an integer')};`,
      );
      lines.push(`    }`);
      break;

    case 'isBoolean':
      lines.push(`${indent}  if (typeof ${valueName} !== 'boolean') {`);
      lines.push(
        `${indent}    ${errorsName}.isBoolean = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a boolean')};`,
      );
      lines.push(`    }`);
      break;

    case 'isNotEmpty':
      lines.push(
        `${indent}  if (${valueName} === null || ${valueName} === undefined || ${valueName} === '' || (Array.isArray(${valueName}) && ${valueName}.length === 0)) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isNotEmpty = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'should not be empty')};`,
      );
      lines.push(`    }`);
      break;

    case 'isDefined':
      lines.push(`${indent}  if (${valueName} === undefined || ${valueName} === null) {`);
      lines.push(
        `${indent}    ${errorsName}.isDefined = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'should not be null or undefined')};`,
      );
      lines.push(`    }`);
      break;

    // Array validators
    case 'isArray':
      lines.push(`${indent}  if (!Array.isArray(${valueName})) {`);
      lines.push(
        `${indent}    ${errorsName}.isArray = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an array')};`,
      );
      lines.push(`    }`);
      break;

    case 'arrayNotEmpty':
      lines.push(`${indent}  if (!Array.isArray(${valueName}) || ${valueName}.length === 0) {`);
      lines.push(
        `${indent}    ${errorsName}.arrayNotEmpty = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'should not be empty')};`,
      );
      lines.push(`    }`);
      break;

    case 'arrayMinSize':
      lines.push(
        `${indent}  if (!Array.isArray(${valueName}) || ${valueName}.length < ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.arrayMinSize = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must contain at least ${constraint.value} elements`)};`,
      );
      lines.push(`    }`);
      break;

    case 'arrayMaxSize':
      lines.push(
        `${indent}  if (!Array.isArray(${valueName}) || ${valueName}.length > ${constraint.value}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.arrayMaxSize = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must contain no more than ${constraint.value} elements`)};`,
      );
      lines.push(`    }`);
      break;

    case 'arrayContains':
      lines.push(`${indent}  if (!Array.isArray(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayContains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain required values')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const requiredValues = ${JSON.stringify(constraint.value)};`);
      lines.push(
        `${indent}    const hasAll = requiredValues.every(v => ${valueName}.includes(v));`,
      );
      lines.push(`${indent}    if (!hasAll) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayContains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain required values')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'arrayNotContains':
      lines.push(`${indent}  if (!Array.isArray(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayNotContains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must not contain forbidden values')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const forbiddenValues = ${JSON.stringify(constraint.value)};`);
      lines.push(
        `${indent}    const hasAny = forbiddenValues.some(v => ${valueName}.includes(v));`,
      );
      lines.push(`${indent}    if (hasAny) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayNotContains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must not contain forbidden values')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'arrayUnique':
      lines.push(`${indent}  if (!Array.isArray(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayUnique = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only unique values')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const uniqueSet = new Set(${valueName});`);
      lines.push(`${indent}    if (uniqueSet.size !== ${valueName}.length) {`);
      lines.push(
        `${indent}      ${errorsName}.arrayUnique = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only unique values')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Type checkers
    case 'isDate':
      lines.push(
        `${indent}  if (!(${valueName} instanceof Date) || isNaN(${valueName}.getTime())) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isDate = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a Date instance')};`,
      );
      lines.push(`    }`);
      break;

    case 'isObject':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'object' || ${valueName} === null || Array.isArray(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isObject = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an object')};`,
      );
      lines.push(`    }`);
      break;

    case 'isEnum':
      lines.push(`    const enumValues = Object.values(${JSON.stringify(constraint.value)});`);
      lines.push(`${indent}  if (!enumValues.includes(${valueName})) {`);
      lines.push(
        `${indent}    ${errorsName}.isEnum = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid enum value')};`,
      );
      lines.push(`    }`);
      break;

    // String validators - Email & Web
    case 'isEmail':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isEmail = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an email')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;`);
      lines.push(`${indent}    if (!emailRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isEmail = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an email')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isUrl':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isUrl = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a URL address')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    try {`);
      lines.push(`${indent}      new URL(${valueName});`);
      lines.push(`${indent}    } catch {`);
      lines.push(
        `${indent}      ${errorsName}.isUrl = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a URL address')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isUuid':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isUuid = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a UUID')};`,
      );
      lines.push(`${indent}  } else {`);
      if (constraint.value === '3') {
        lines.push(
          `${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`,
        );
      } else if (constraint.value === '4') {
        lines.push(
          `${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`,
        );
      } else if (constraint.value === '5') {
        lines.push(
          `${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`,
        );
      } else {
        lines.push(
          `${indent}    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;`,
        );
      }
      lines.push(`${indent}    if (!uuidRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isUuid = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a UUID')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isJson':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isJson = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a json string')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    try {`);
      lines.push(`${indent}      JSON.parse(${valueName});`);
      lines.push(`${indent}    } catch {`);
      lines.push(
        `${indent}      ${errorsName}.isJson = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a json string')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Format
    case 'isAlpha':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isAlpha = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only letters (a-zA-Z)')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const alphaRegex = /^[a-zA-Z]+$/;`);
      lines.push(`${indent}    if (!alphaRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isAlpha = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only letters (a-zA-Z)')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isAlphanumeric':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isAlphanumeric = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only letters and numbers')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const alphanumericRegex = /^[a-zA-Z0-9]+$/;`);
      lines.push(`${indent}    if (!alphanumericRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isAlphanumeric = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only letters and numbers')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isHexColor':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isHexColor = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a hexadecimal color')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;`);
      lines.push(`${indent}    if (!hexColorRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isHexColor = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a hexadecimal color')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIp':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIp = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ip address')};`,
      );
      lines.push(`${indent}  } else {`);
      if (constraint.value === '4') {
        lines.push(
          `${indent}    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`,
        );
      } else if (constraint.value === '6') {
        lines.push(
          `${indent}    const ipRegex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;`,
        );
      } else {
        lines.push(
          `${indent}    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;`,
        );
        lines.push(
          `${indent}    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;`,
        );
        lines.push(
          `${indent}    const ipRegex = { test: (v) => ipv4Regex.test(v) || ipv6Regex.test(v) };`,
        );
      }
      lines.push(`${indent}    if (!ipRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isIp = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ip address')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Specialized
    case 'isCreditCard':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isCreditCard = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a credit card')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      lines.push(`${indent}    if (!/^[0-9]{13,19}$/.test(sanitized)) {`);
      lines.push(
        `${indent}      ${errorsName}.isCreditCard = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a credit card')};`,
      );
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
      lines.push(
        `${indent}        ${errorsName}.isCreditCard = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a credit card')};`,
      );
      lines.push(`${indent}      }`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIsbn':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIsbn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ISBN')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const sanitized = ${valueName}.replace(/[- ]/g, '');`);
      if (constraint.value === '10') {
        lines.push(`${indent}    if (!/^[0-9]{9}[0-9X]$/i.test(sanitized)) {`);
        lines.push(
          `${indent}      ${errorsName}.isIsbn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ISBN')};`,
        );
        lines.push(`${indent}    }`);
      } else if (constraint.value === '13') {
        lines.push(`${indent}    if (!/^[0-9]{13}$/.test(sanitized)) {`);
        lines.push(
          `${indent}      ${errorsName}.isIsbn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ISBN')};`,
        );
        lines.push(`${indent}    }`);
      } else {
        lines.push(`${indent}    const isbn10 = /^[0-9]{9}[0-9X]$/i.test(sanitized);`);
        lines.push(`${indent}    const isbn13 = /^[0-9]{13}$/.test(sanitized);`);
        lines.push(`${indent}    if (!isbn10 && !isbn13) {`);
        lines.push(
          `${indent}      ${errorsName}.isIsbn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ISBN')};`,
        );
        lines.push(`${indent}    }`);
      }
      lines.push(`    }`);
      break;

    case 'isPhoneNumber':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isPhoneNumber = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid phone number')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;`,
      );
      lines.push(`${indent}    if (!phoneRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isPhoneNumber = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid phone number')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // String validators - Content
    case 'contains':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !${valueName}.includes(${JSON.stringify(constraint.value)})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.contains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must contain a ${constraint.value} string`)};`,
      );
      lines.push(`    }`);
      break;

    case 'notContains':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName}.includes(${JSON.stringify(constraint.value)})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.notContains = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `should not contain a ${constraint.value} string`)};`,
      );
      lines.push(`    }`);
      break;

    case 'isLowercase':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName} !== ${valueName}.toLowerCase()) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isLowercase = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a lowercase string')};`,
      );
      lines.push(`    }`);
      break;

    case 'isUppercase':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName} !== ${valueName}.toUpperCase()) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isUppercase = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an uppercase string')};`,
      );
      lines.push(`    }`);
      break;

    case 'matches':
      if (constraint.value && typeof constraint.value === 'object') {
        const pattern = constraint.value.pattern;
        const modifiers = constraint.value.modifiers || '';
        lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
        lines.push(
          `${indent}      ${errorsName}.matches = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must match ${pattern} regular expression`)};`,
        );
        lines.push(`${indent}  } else {`);
        lines.push(
          `${indent}    const regex = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(modifiers)});`,
        );
        lines.push(`${indent}    if (!regex.test(${valueName})) {`);
        lines.push(
          `${indent}      ${errorsName}.matches = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must match ${pattern} regular expression`)};`,
        );
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    // High Priority Validators
    case 'isFqdn':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isFqdn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid domain name')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const fqdnRegex = /^([a-zA-Z0-9-_]+\\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\\.[a-zA-Z]{2,11}$/;`,
      );
      lines.push(`${indent}    if (!fqdnRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isFqdn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid domain name')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isAscii':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^[\\x00-\\x7F]+$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isAscii = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain only ASCII characters')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isBase32':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName}.length % 8 !== 0 || !/^[A-Z2-7]+=*$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isBase32 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be base32 encoded')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isBase58':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^[A-HJ-NP-Za-km-z1-9]+$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isBase58 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be base58 encoded')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isBooleanString':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !['true', 'false', '0', '1'].includes(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isBooleanString = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a boolean string')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isFullWidth':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/[^\\u0000-\\u007F\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE]/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isFullWidth = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain a full-width character')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isHalfWidth':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE]/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isHalfWidth = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain a half-width character')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isVariableWidth':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE]/.test(${valueName}) || !/[^\\u0000-\\u007F\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE]/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isVariableWidth = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain both half-width and full-width characters')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isHexadecimal':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^(0[xX])?[0-9A-Fa-f]+$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isHexadecimal = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a hexadecimal number')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isMultibyte':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/[^\\x00-\\x7F]/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isMultibyte = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain one or more multibyte chars')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isSurrogatePair':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isSurrogatePair = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must contain any surrogate pairs chars')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isNumberString':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^[+-]?(\\d+(\\.\\d*)?|\\.\\d+)$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isNumberString = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number string')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isOctal':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^(0o)?[0-7]+$/i.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isOctal = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be valid octal number')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isMilitaryTime':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isMilitaryTime = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid representation of military time in the format HH:MM')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isISRC':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^[A-Z]{2}[0-9A-Z]{3}\\d{7}$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isISRC = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an ISRC')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'IsFirebasePushId':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^[-\\w]{20}$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.IsFirebasePushId = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a Firebase Push Id')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isTaxId':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^\\d{2}[- ]?\\d{7}$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isTaxId = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a Tax Identification Number')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isHSL':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^hsla?\\(\\s*[+-]?\\d+(\\.\\d+)?(deg|grad|rad|turn)?\\s*,\\s*[+-]?\\d+(\\.\\d+)?%\\s*,\\s*[+-]?\\d+(\\.\\d+)?%\\s*(,\\s*[+-]?\\d*(\\.\\d+)?%?\\s*)?\\)$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isHSL = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a HSL color')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isRgbColor':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^rgba?\\((((0|1?\\d?\\d|2[0-4]\\d|25[0-5]),){2}(0|1?\\d?\\d|2[0-4]\\d|25[0-5])|((0|1?\\d?\\d|2[0-4]\\d|25[0-5]),){3}(0|0?\\.\\d+|1(\\.0)?))\\)$/.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isRgbColor = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be RGB color')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isByteLength': {
      // Bytes, not characters: upstream measures the UTF-8 encoding.
      const byteMin = constraint.value?.min ?? 0;
      const byteMax = constraint.value?.max;
      const overByteMax = byteMax === undefined ? '' : ` || byteLen > ${JSON.stringify(byteMax)}`;
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}    ${errorsName}.isByteLength = ${emitMessage(constraint, constraintIndex, propertyName, valueName, "'s byte length must fall into (" + byteMin + ', ' + (byteMax ?? '') + ') range')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const byteLen = new TextEncoder().encode(${valueName}).length;`);
      lines.push(`${indent}    if (byteLen < ${JSON.stringify(byteMin)}${overByteMax}) {`);
      lines.push(
        `${indent}      ${errorsName}.isByteLength = ${emitMessage(constraint, constraintIndex, propertyName, valueName, "'s byte length must fall into (" + byteMin + ', ' + (byteMax ?? '') + ') range')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  }`);
      break;
    }

    case 'isHash': {
      // Hex digits, count fixed by the algorithm.
      const hashLengths: Record<string, number> = {
        md5: 32,
        md4: 32,
        ripemd128: 32,
        tiger128: 32,
        sha1: 40,
        ripemd160: 40,
        tiger160: 40,
        tiger192: 48,
        sha256: 64,
        'sha3-256': 64,
        sha384: 96,
        'sha3-384': 96,
        sha512: 128,
        'sha3-512': 128,
        crc32: 8,
        crc32b: 8,
      };
      const hashLength = hashLengths[String(constraint.value).toLowerCase()] ?? 0;
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !new RegExp('^[a-fA-F0-9]{' + ${JSON.stringify(hashLength)} + '}$').test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isHash = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be a hash of type ${constraint.value}`)};`,
      );
      lines.push(`${indent}  }`);
      break;
    }

    case 'isISSN':
      // Eight digits, hyphen optional, last position a mod-11 check digit
      // that may be 'X'.
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || !/^\\d{4}-?\\d{3}[\\dX]$/i.test(${valueName})) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isISSN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a ISSN')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const issnDigits = ${valueName}.replace('-', '').toUpperCase();`);
      lines.push(`${indent}    let issnSum = 0;`);
      lines.push(`${indent}    for (let i = 0; i < 8; i++) {`);
      lines.push(
        `${indent}      const issnChar = issnDigits[i] === 'X' ? 10 : Number(issnDigits[i]);`,
      );
      lines.push(`${indent}      issnSum += issnChar * (8 - i);`);
      lines.push(`${indent}    }`);
      lines.push(`${indent}    if (issnSum % 11 !== 0) {`);
      lines.push(
        `${indent}      ${errorsName}.isISSN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a ISSN')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  }`);
      break;

    case 'isPositive':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number' || ${valueName} <= 0) {`);
      lines.push(
        `${indent}    ${errorsName}.isPositive = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a positive number')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isNegative':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number' || ${valueName} >= 0) {`);
      lines.push(
        `${indent}    ${errorsName}.isNegative = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a negative number')};`,
      );
      lines.push(`${indent}  }`);
      break;

    case 'isLength': {
      const lengthMin = constraint.value?.min ?? 0;
      const lengthMax = constraint.value?.max;
      const lengthMessage =
        lengthMax === undefined
          ? `must be longer than or equal to ${lengthMin} characters`
          : `must be longer than or equal to ${lengthMin} and shorter than or equal to ${lengthMax} characters`;
      const overMax =
        lengthMax === undefined ? '' : ` || ${valueName}.length > ${JSON.stringify(lengthMax)}`;
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'string' || ${valueName}.length < ${JSON.stringify(lengthMin)}${overMax}) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isLength = ${emitMessage(constraint, constraintIndex, propertyName, valueName, lengthMessage)};`,
      );
      lines.push(`${indent}  }`);
      break;
    }

    case 'isDateString':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isDateString = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 8601 date string')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const dateStringRegex = /^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?(Z|[+-]\\d{2}:\\d{2})?)?$/;`,
      );
      lines.push(`${indent}    if (!dateStringRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isDateString = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 8601 date string')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIso8601':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIso8601 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 8601 date string')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const iso8601Regex = /^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?(Z|[+-]\\d{2}:\\d{2})?)?$/;`,
      );
      lines.push(`${indent}    if (!iso8601Regex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isIso8601 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 8601 date string')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isMobilePhone':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isMobilePhone = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid phone number')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.()]?[0-9]{1,4}[-\\s.()]?[0-9]{1,4}[-\\s.()]?[0-9]{1,9}$/;`,
      );
      lines.push(`${indent}    if (!phoneRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isMobilePhone = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid phone number')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isPostalCode':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isPostalCode = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid postal code')};`,
      );
      lines.push(`${indent}  } else {`);
      if (constraint.value === 'US') {
        lines.push(`${indent}    const postalRegex = /^\\d{5}(-\\d{4})?$/;`);
      } else if (constraint.value === 'RU') {
        lines.push(`${indent}    const postalRegex = /^\\d{6}$/;`);
      } else if (constraint.value === 'GB') {
        lines.push(
          `${indent}    const postalRegex = /^[A-Z]{1,2}\\d{1,2}[A-Z]?\\s?\\d[A-Z]{2}$/i;`,
        );
      } else {
        lines.push(`${indent}    const postalRegex = /^[A-Z0-9]{3,10}$/i;`);
      }
      lines.push(`${indent}    if (!postalRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isPostalCode = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid postal code')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isMongoId':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isMongoId = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a mongodb id')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;`);
      lines.push(`${indent}    if (!mongoIdRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isMongoId = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a mongodb id')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isJwt':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isJwt = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a jwt string')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const parts = ${valueName}.split('.');`);
      lines.push(`${indent}    if (parts.length !== 3 || !parts[0] || !parts[1]) {`);
      lines.push(
        `${indent}      ${errorsName}.isJwt = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a jwt string')};`,
      );
      lines.push(`${indent}    } else {`);
      lines.push(`${indent}      const jwtRegex = /^[A-Za-z0-9-_]+$/;`);
      lines.push(
        `${indent}      if (!jwtRegex.test(parts[0]) || !jwtRegex.test(parts[1]) || (parts[2] && !jwtRegex.test(parts[2]))) {`,
      );
      lines.push(
        `${indent}        ${errorsName}.isJwt = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a jwt string')};`,
      );
      lines.push(`${indent}      }`);
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isStrongPassword':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isStrongPassword = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a strong password (min 8 chars, uppercase, lowercase, number, special char)')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const hasLower = /[a-z]/.test(${valueName});`);
      lines.push(`${indent}    const hasUpper = /[A-Z]/.test(${valueName});`);
      lines.push(`${indent}    const hasNumber = /[0-9]/.test(${valueName});`);
      lines.push(`${indent}    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(${valueName});`);
      lines.push(`${indent}    const isLongEnough = ${valueName}.length >= 8;`);
      lines.push(
        `${indent}    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial || !isLongEnough) {`,
      );
      lines.push(
        `${indent}      ${errorsName}.isStrongPassword = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a strong password (min 8 chars, uppercase, lowercase, number, special char)')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isPort':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isPort = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid port number')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const port = parseInt(${valueName}, 10);`);
      lines.push(`${indent}    if (isNaN(port) || port < 0 || port > 65535) {`);
      lines.push(
        `${indent}      ${errorsName}.isPort = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid port number')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isMacAddress':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isMacAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a MAC Address')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;`);
      lines.push(`${indent}    if (!macRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isMacAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a MAC Address')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isBase64':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isBase64 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be base64 encoded')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const base64Regex = /^(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\\/]{3}=)?$/;`,
      );
      lines.push(`${indent}    if (!base64Regex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isBase64 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be base64 encoded')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Banking & Financial
    case 'isIBAN':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIBAN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid IBAN')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;`);
      lines.push(`${indent}    if (!ibanRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isIBAN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid IBAN')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isBIC':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isBIC = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid BIC or SWIFT code')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;`);
      lines.push(`${indent}    if (!bicRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isBIC = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid BIC or SWIFT code')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isCurrency':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isCurrency = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid currency amount')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const currencyRegex = /^[\\$€£¥₽]?\\s?[0-9]{1,3}(,[0-9]{3})*(\\.\\d{2})?$/;`,
      );
      lines.push(`${indent}    if (!currencyRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isCurrency = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid currency amount')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isISO4217CurrencyCode':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isISO4217CurrencyCode = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 4217 currency code')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const currencyCodeRegex = /^[A-Z]{3}$/;`);
      lines.push(`${indent}    if (!currencyCodeRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isISO4217CurrencyCode = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 4217 currency code')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Cryptocurrency
    case 'isEthereumAddress':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isEthereumAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Ethereum address')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const ethRegex = /^0x[a-fA-F0-9]{39,40}$/;`);
      lines.push(`${indent}    if (!ethRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isEthereumAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Ethereum address')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isBtcAddress':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isBtcAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Bitcoin address')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const btcRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;`);
      lines.push(`${indent}    if (!btcRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isBtcAddress = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Bitcoin address')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Documents & Identifiers
    case 'isPassportNumber':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isPassportNumber = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid passport number')};`,
      );
      lines.push(`${indent}  } else {`);
      if (constraint.value === 'US') {
        lines.push(`${indent}    const passportRegex = /^[0-9]{9}$/;`);
      } else {
        lines.push(`${indent}    const passportRegex = /^[A-Z0-9]{6,12}$/;`);
      }
      lines.push(`${indent}    if (!passportRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isPassportNumber = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid passport number')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIdentityCard':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIdentityCard = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid identity card')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const idRegex = /^[A-Z0-9]{5,20}$/;`);
      lines.push(`${indent}    if (!idRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isIdentityCard = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid identity card')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isEAN':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isEAN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid EAN')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const eanRegex = /^[0-9]{8}$|^[0-9]{13}$/;`);
      lines.push(`${indent}    if (!eanRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isEAN = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid EAN')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isIsin':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isIsin = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISIN')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const isinRegex = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;`);
      lines.push(`${indent}    if (!isinRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isIsin = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISIN')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Network & URI
    case 'isMagnetURI':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isMagnetURI = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Magnet URI')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const magnetRegex = /^magnet:\\?xt=urn:[a-z0-9]+:[a-z0-9]{32,40}/i;`,
      );
      lines.push(`${indent}    if (!magnetRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isMagnetURI = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Magnet URI')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isDataURI':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isDataURI = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Data URI')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const dataUriRegex = /^data:([a-z]+\\/[a-z0-9-+.]+)?;base64,/i;`);
      lines.push(`${indent}    if (!dataUriRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isDataURI = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid Data URI')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Localization
    case 'isISO31661Alpha2':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isISO31661Alpha2 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 3166-1 alpha-2 country code')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const alpha2Regex = /^[A-Z]{2}$/;`);
      lines.push(`${indent}    if (!alpha2Regex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isISO31661Alpha2 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 3166-1 alpha-2 country code')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isISO31661Alpha3':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isISO31661Alpha3 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 3166-1 alpha-3 country code')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const alpha3Regex = /^[A-Z]{3}$/;`);
      lines.push(`${indent}    if (!alpha3Regex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isISO31661Alpha3 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid ISO 3166-1 alpha-3 country code')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isLocale':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isLocale = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid locale')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;`);
      lines.push(`${indent}    if (!localeRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isLocale = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid locale')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Medium Priority Validators - Formats & Standards
    case 'isSemVer':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isSemVer = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid semantic version')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const semverRegex = /^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$/;`,
      );
      lines.push(`${indent}    if (!semverRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isSemVer = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid semantic version')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isMimeType':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isMimeType = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid MIME type')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const mimeRegex = /^[a-z]+\\/[a-z0-9\\-+.]+$/i;`);
      lines.push(`${indent}    if (!mimeRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isMimeType = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid MIME type')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isTimeZone':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isTimeZone = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid timezone')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const timezoneRegex = /^[A-Z][a-zA-Z]+\\/[A-Z][a-zA-Z_]+$/;`);
      lines.push(`${indent}    if (!timezoneRegex.test(${valueName}) && ${valueName} !== 'UTC') {`);
      lines.push(
        `${indent}      ${errorsName}.isTimeZone = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid timezone')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isRFC3339':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isRFC3339 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid RFC 3339 date')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const rfc3339Regex = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$/;`,
      );
      lines.push(`${indent}    if (!rfc3339Regex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isRFC3339 = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a valid RFC 3339 date')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Number validators
    case 'isDivisibleBy':
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' || ${valueName} % ${constraint.value} !== 0) {`,
      );
      lines.push(
        `${indent}    ${errorsName}.isDivisibleBy = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be divisible by ${constraint.value}`)};`,
      );
      lines.push(`    }`);
      break;

    case 'isDecimal':
      lines.push(`${indent}  if (typeof ${valueName} !== 'number') {`);
      lines.push(
        `${indent}      ${errorsName}.isDecimal = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a decimal number')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    if (Number.isInteger(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isDecimal = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a decimal number')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Date validators
    case 'minDate':
      if (constraint.value instanceof Date) {
        const minTime = constraint.value.getTime();
        lines.push(`${indent}  if (!(${valueName} instanceof Date)) {`);
        lines.push(
          `${indent}      ${errorsName}.minDate = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be before ${constraint.value.toISOString()}`)};`,
        );
        lines.push(`${indent}  } else {`);
        lines.push(`${indent}    if (${valueName}.getTime() < ${minTime}) {`);
        lines.push(
          `${indent}      ${errorsName}.minDate = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be before ${constraint.value.toISOString()}`)};`,
        );
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    case 'maxDate':
      if (constraint.value instanceof Date) {
        const maxTime = constraint.value.getTime();
        lines.push(`${indent}  if (!(${valueName} instanceof Date)) {`);
        lines.push(
          `${indent}      ${errorsName}.maxDate = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be after ${constraint.value.toISOString()}`)};`,
        );
        lines.push(`${indent}  } else {`);
        lines.push(`${indent}    if (${valueName}.getTime() > ${maxTime}) {`);
        lines.push(
          `${indent}      ${errorsName}.maxDate = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must not be after ${constraint.value.toISOString()}`)};`,
        );
        lines.push(`${indent}    }`);
        lines.push(`    }`);
      }
      break;

    // Common validators - Comparison
    case 'equals':
      lines.push(`${indent}  if (${valueName} !== ${JSON.stringify(constraint.value)}) {`);
      lines.push(
        `${indent}    ${errorsName}.equals = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be equal to ${constraint.value}`)};`,
      );
      lines.push(`    }`);
      break;

    case 'notEquals':
      lines.push(`${indent}  if (${valueName} === ${JSON.stringify(constraint.value)}) {`);
      lines.push(
        `${indent}    ${errorsName}.notEquals = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `should not be equal to ${constraint.value}`)};`,
      );
      lines.push(`    }`);
      break;

    case 'isIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const allowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`${indent}  if (!allowedValues.includes(${valueName})) {`);
        lines.push(
          `${indent}    ${errorsName}.isIn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `must be one of the following values: ${constraint.value.join(', ')}`)};`,
        );
        lines.push(`    }`);
      }
      break;

    case 'isNotIn':
      if (Array.isArray(constraint.value)) {
        lines.push(`    const disallowedValues = ${JSON.stringify(constraint.value)};`);
        lines.push(`${indent}  if (disallowedValues.includes(${valueName})) {`);
        lines.push(
          `${indent}    ${errorsName}.isNotIn = ${emitMessage(constraint, constraintIndex, propertyName, valueName, `should not be one of the following values: ${constraint.value.join(', ')}`)};`,
        );
        lines.push(`    }`);
      }
      break;

    case 'isEmpty':
      lines.push(`${indent}  if (${valueName} !== null && ${valueName} !== undefined) {`);
      lines.push(`${indent}    if (typeof ${valueName} === 'string' && ${valueName}.length > 0) {`);
      lines.push(
        `${indent}      ${errorsName}.isEmpty = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be empty')};`,
      );
      lines.push(
        `${indent}    } else if (Array.isArray(${valueName}) && ${valueName}.length > 0) {`,
      );
      lines.push(
        `${indent}      ${errorsName}.isEmpty = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be empty')};`,
      );
      lines.push(
        `${indent}    } else if (typeof ${valueName} === 'object' && Object.keys(${valueName}).length > 0) {`,
      );
      lines.push(
        `${indent}      ${errorsName}.isEmpty = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be empty')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Object validators
    case 'isNotEmptyObject':
      lines.push(
        `${indent}  if (typeof ${valueName} === 'object' && ${valueName} !== null && !Array.isArray(${valueName})) {`,
      );
      lines.push(`${indent}    if (Object.keys(${valueName}).length === 0) {`);
      lines.push(
        `${indent}      ${errorsName}.isNotEmptyObject = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a non-empty object')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    // Geographic validators
    case 'isLatLong':
      lines.push(`${indent}  if (typeof ${valueName} !== 'string') {`);
      lines.push(
        `${indent}      ${errorsName}.isLatLong = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a latitude,longitude string')};`,
      );
      lines.push(`${indent}  } else {`);
      lines.push(
        `${indent}    const latLongRegex = /^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$/;`,
      );
      lines.push(`${indent}    if (!latLongRegex.test(${valueName})) {`);
      lines.push(
        `${indent}      ${errorsName}.isLatLong = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a latitude,longitude string')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`    }`);
      break;

    case 'isLatitude':
      // Accepts a number or a numeric string; anything else cannot be measured.
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' && typeof ${valueName} !== 'string') {`,
      );
      lines.push(
        `${indent}      ${errorsName}.isLatitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -90 and 90')};`,
      );
      lines.push(`${indent}  } else if (typeof ${valueName} === 'number') {`);
      lines.push(`${indent}    if (${valueName} < -90 || ${valueName} > 90) {`);
      lines.push(
        `${indent}      ${errorsName}.isLatitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -90 and 90')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const parsed = parseFloat(${valueName});`);
      lines.push(`${indent}    if (isNaN(parsed) || parsed < -90 || parsed > 90) {`);
      lines.push(
        `${indent}      ${errorsName}.isLatitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -90 and 90')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  }`);
      break;

    case 'isLongitude':
      // Accepts a number or a numeric string; anything else cannot be measured.
      lines.push(
        `${indent}  if (typeof ${valueName} !== 'number' && typeof ${valueName} !== 'string') {`,
      );
      lines.push(
        `${indent}      ${errorsName}.isLongitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -180 and 180')};`,
      );
      lines.push(`${indent}  } else if (typeof ${valueName} === 'number') {`);
      lines.push(`${indent}    if (${valueName} < -180 || ${valueName} > 180) {`);
      lines.push(
        `${indent}      ${errorsName}.isLongitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -180 and 180')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  } else {`);
      lines.push(`${indent}    const parsed = parseFloat(${valueName});`);
      lines.push(`${indent}    if (isNaN(parsed) || parsed < -180 || parsed > 180) {`);
      lines.push(
        `${indent}      ${errorsName}.isLongitude = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be a number between -180 and 180')};`,
      );
      lines.push(`${indent}    }`);
      lines.push(`${indent}  }`);
      break;

    case 'custom':
      // Handle @Validate decorator with validator class
      // Note: validator class is accessed from metadata at runtime
      if (constraint.value && constraint.value.constraintClass) {
        const errorMsg = emitMessage(
          constraint,
          constraintIndex,
          propertyName,
          valueName,
          'validation failed',
        );
        const hasExplicitMessage = constraint.message != null;
        // Error key mirrors upstream class-validator: the registered
        // constraint name, not a hard-coded 'custom'.
        const customKey = sanitizeValidatorName(
          (constraint.value && constraint.value.name) || 'custom',
        );
        lines.push(`${indent}// Custom validator class`);
        lines.push(`${indent}{`);
        lines.push(
          `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
        );
        lines.push(`${indent}  const constraintValue = constraint.value;`);
        lines.push(
          `${indent}  const validatorInstance = getValidatorInstance(constraintValue.constraintClass);`,
        );
        lines.push(`${indent}  const args = {`);
        lines.push(`${indent}    value: ${valueName},`);
        lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
        lines.push(`${indent}    targetName: object.constructor.name,`);
        lines.push(`${indent}    object: object,`);
        lines.push(`${indent}    property: ${safePropName}`);
        lines.push(`${indent}  };`);
        lines.push(`${indent}  const result = validatorInstance.validate(${valueName}, args);`);
        lines.push(`${indent}  if (!result) {`);
        if (hasExplicitMessage) {
          lines.push(`${indent}    ${errorsName}.${customKey} = ${errorMsg};`);
        } else {
          lines.push(`${indent}    if (validatorInstance.defaultMessage) {`);
          lines.push(
            `${indent}      ${errorsName}.${customKey} = validatorInstance.defaultMessage(args);`,
          );
          lines.push(`${indent}    } else {`);
          lines.push(`${indent}      ${errorsName}.${customKey} = ${errorMsg};`);
          lines.push(`${indent}    }`);
        }
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      }
      break;

    case 'validateBy':
      // Handle ValidateBy decorator
      if (constraint.value && constraint.value.validator) {
        const rawValidatorName = constraint.value.name || 'custom';
        const validatorName = sanitizeValidatorName(rawValidatorName);
        const defaultMsg = emitMessage(
          constraint,
          constraintIndex,
          propertyName,
          valueName,
          'validation failed',
        );
        const hasExplicitMessage = constraint.message != null;
        lines.push(`${indent}// ValidateBy: ${validatorName}`);
        lines.push(`${indent}{`);
        lines.push(
          `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
        );
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
        if (hasExplicitMessage) {
          lines.push(`${indent}    ${errorsName}.${validatorName} = ${defaultMsg};`);
        } else {
          lines.push(`${indent}    if (constraintValue.defaultMessage) {`);
          lines.push(
            `${indent}      ${errorsName}.${validatorName} = constraintValue.defaultMessage(args);`,
          );
          lines.push(`${indent}    } else {`);
          lines.push(`${indent}      ${errorsName}.${validatorName} = ${defaultMsg};`);
          lines.push(`${indent}    }`);
        }
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      }
      break;

    // Type checker - IsInstance
    case 'isInstance':
      if (constraint.value) {
        lines.push(`${indent}// IsInstance validator`);
        lines.push(`${indent}{`);
        lines.push(
          `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
        );
        lines.push(`${indent}  const targetType = constraint.value;`);
        lines.push(`${indent}  if (!(${valueName} instanceof targetType)) {`);
        lines.push(
          `${indent}    ${errorsName}.isInstance = ${emitMessage(constraint, constraintIndex, propertyName, valueName, 'must be an instance of the specified class')};`,
        );
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
    const errorMsg = emitMessage(
      constraint,
      constraintIndex,
      propertyName,
      valueName,
      'validation failed',
    );
    lines.push(`${indent}// Custom async validator (inline)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(
      `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
    );
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
    const errorMsg = emitMessage(
      constraint,
      constraintIndex,
      propertyName,
      valueName,
      'validation failed',
    );
    const hasExplicitMessage = constraint.message != null;
    // Error key mirrors upstream class-validator: the registered
    // constraint name, not a hard-coded 'custom'.
    const customKey = sanitizeValidatorName(
      (constraint.value && constraint.value.name) || 'custom',
    );
    lines.push(`${indent}// Custom validator class (potentially async)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(
      `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
    );
    lines.push(`${indent}  const constraintValue = constraint.value;`);
    lines.push(
      `${indent}  const validatorInstance = getValidatorInstance(constraintValue.constraintClass);`,
    );
    lines.push(`${indent}  const args = {`);
    lines.push(`${indent}    value: ${valueName},`);
    lines.push(`${indent}    constraints: constraintValue.constraints || [],`);
    lines.push(`${indent}    targetName: object.constructor.name,`);
    lines.push(`${indent}    object: object,`);
    lines.push(`${indent}    property: ${safePropName}`);
    lines.push(`${indent}  };`);
    lines.push(`${indent}  const result = await validatorInstance.validate(${valueName}, args);`);
    lines.push(`${indent}  if (!result) {`);
    if (hasExplicitMessage) {
      lines.push(`${indent}    ${errorsName}.${customKey} = ${errorMsg};`);
    } else {
      lines.push(`${indent}    if (validatorInstance.defaultMessage) {`);
      lines.push(
        `${indent}      ${errorsName}.${customKey} = validatorInstance.defaultMessage(args);`,
      );
      lines.push(`${indent}    } else {`);
      lines.push(`${indent}      ${errorsName}.${customKey} = ${errorMsg};`);
      lines.push(`${indent}    }`);
    }
    lines.push(`${indent}  }`);
    lines.push(`${indent}})();`);
    lines.push(`${indent}${asyncTasksName}.push(${taskVarName});`);
  } else if (constraint.type === 'validateBy' && constraint.value && constraint.value.validator) {
    // For ValidateBy decorators (may be async)
    const taskVarName = `customTask_${asyncTaskCounter++}`;
    const rawValidatorName = constraint.value.name || 'custom';
    const validatorName = sanitizeValidatorName(rawValidatorName);
    const defaultMsg = emitMessage(
      constraint,
      constraintIndex,
      propertyName,
      valueName,
      'validation failed',
    );
    const hasExplicitMessage = constraint.message != null;
    lines.push(`${indent}// ValidateBy: ${validatorName} (potentially async)`);
    lines.push(`${indent}const ${taskVarName} = (async () => {`);
    lines.push(
      `${indent}  const constraint = metadata.properties.get(${safePropName}).constraints[${constraintIndex}];`,
    );
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
    if (hasExplicitMessage) {
      lines.push(`${indent}    ${errorsName}.${validatorName} = ${defaultMsg};`);
    } else {
      lines.push(`${indent}    if (constraintValue.defaultMessage) {`);
      lines.push(
        `${indent}      ${errorsName}.${validatorName} = constraintValue.defaultMessage(args);`,
      );
      lines.push(`${indent}    } else {`);
      lines.push(`${indent}      ${errorsName}.${validatorName} = ${defaultMsg};`);
      lines.push(`${indent}    }`);
    }
    lines.push(`${indent}  }`);
    lines.push(`${indent}})();`);
    lines.push(`${indent}${asyncTasksName}.push(${taskVarName});`);
  } else {
    // For built-in validators, use sync validation (they don't support async)
    lines.push(
      generateConstraintCheck(
        constraint,
        constraintIndex,
        propertyName,
        valueName,
        errorsName,
        indent,
      ),
    );
  }

  return lines.join('\n');
}

/**
 * Get error message from constraint
 */
function getErrorMessage(
  constraint: ValidationConstraint,
  propertyName: string,
  defaultMessage: string,
): string {
  if (typeof constraint.message === 'string') {
    return constraint.message;
  }
  // Default messages name the property they are about, as upstream's do
  // ("username must be ..."), so a message shown on its own still says which
  // field it belongs to. A message the caller supplied is left exactly as
  // written. Under `each` the property follows upstream's "each value in "
  // prefix.
  const subject = constraint.each ? `each value in ${propertyName}` : propertyName;
  return `${subject} ${defaultMessage}`;
}

/**
 * Emit a JS expression (as a string) for a constraint's error message.
 * String messages are inlined as literals; function messages are called
 * at runtime with ValidationArguments looked up from `metadata`.
 */
function emitMessage(
  constraint: ValidationConstraint,
  constraintIndex: number,
  propertyName: string,
  valueName: string,
  defaultMessage: string,
): string {
  if (typeof constraint.message === 'function') {
    const safeProp = JSON.stringify(propertyName);
    // The stored constraint `value` is sometimes a scalar (e.g. MinLength(5)
    // stores value: 5) and sometimes an envelope object for custom/validateBy
    // constraints (e.g. { name, validator, defaultMessage, constraints: [...] }).
    // Unwrap the envelope's `.constraints` array when present so a function
    // message sees the same `constraints` shape as the custom/validateBy sync
    // and async branches build (`constraintValue.constraints || []`); a
    // scalar value falls back to a single-element array, and an absent value
    // becomes an empty array (no constraint args to report).
    const constraintValueExpr = `metadata.properties.get(${safeProp}).constraints[${constraintIndex}].value`;
    return (
      `(metadata.properties.get(${safeProp}).constraints[${constraintIndex}].message({ ` +
      `value: ${valueName}, ` +
      `constraints: (function(v){ return v === undefined ? [] : (v && Array.isArray(v.constraints) ? v.constraints : [v]); })(${constraintValueExpr}), ` +
      `targetName: object && object.constructor ? object.constructor.name : '', ` +
      `object: object, ` +
      `property: ${safeProp} }))`
    );
  }
  return JSON.stringify(getErrorMessage(constraint, propertyName, defaultMessage));
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
