/**
 * Type definitions for class-validator compatibility layer
 * Using TC39 Stage 3 decorators with JIT compilation
 */

/**
 * Validation error for a single property
 */
export interface ValidationError {
  /**
   * Property name that failed validation
   */
  property: string;

  /**
   * Value that failed validation
   */
  value?: any;

  /**
   * Validation constraints that failed
   */
  constraints?: {
    [type: string]: string;
  };

  /**
   * Nested validation errors (for ValidateNested)
   */
  children?: ValidationError[];

  /**
   * Property path (for nested objects)
   */
  target?: any;
}

/**
 * Options for validation
 */
export interface ValidatorOptions {
  /**
   * Skip missing properties
   */
  skipMissingProperties?: boolean;

  /**
   * Skip null properties
   */
  skipNullProperties?: boolean;

  /**
   * Skip undefined properties
   */
  skipUndefinedProperties?: boolean;

  /**
   * Validation groups to use
   */
  groups?: string[];

  /**
   * Always validate even if property is missing
   */
  always?: boolean;

  /**
   * Stop at first error
   */
  stopAtFirstError?: boolean;

  /**
   * Forbid unknown values
   */
  forbidUnknownValues?: boolean;

  /**
   * Whitelist properties (remove unknown)
   */
  whitelist?: boolean;

  /**
   * Forbid non-whitelisted properties
   */
  forbidNonWhitelisted?: boolean;
}

/**
 * Validation constraint metadata
 */
export interface ValidationConstraint {
  /**
   * Constraint type (e.g., 'isString', 'minLength')
   */
  type: string;

  /**
   * Constraint value (e.g., min length value)
   */
  value?: any;

  /**
   * Custom error message
   */
  message?: string | ((args: ValidationArguments) => string);

  /**
   * Validation groups
   */
  groups?: string[];

  /**
   * Always validate
   */
  always?: boolean;

  /**
   * Validation function (for custom validators)
   */
  validator?: (value: any, args?: ValidationArguments) => boolean | Promise<boolean>;
}

/**
 * Arguments passed to validation functions
 */
export interface ValidationArguments {
  /**
   * Value being validated
   */
  value: any;

  /**
   * Constraints array
   */
  constraints: any[];

  /**
   * Target class
   */
  targetName: string;

  /**
   * Object being validated
   */
  object: any;

  /**
   * Property name
   */
  property: string;
}

/**
 * Decorator options for validation decorators
 */
export interface ValidationDecoratorOptions {
  /**
   * Validation groups
   */
  groups?: string[];

  /**
   * Custom error message
   */
  message?: string | ((args: ValidationArguments) => string);

  /**
   * Always validate
   */
  always?: boolean;

  /**
   * Context for validation
   */
  context?: any;
}

/**
 * Compiled validator function
 */
export type CompiledValidator = (object: any, options?: ValidatorOptions) => ValidationError[];

/**
 * Async compiled validator function
 */
export type AsyncCompiledValidator = (
  object: any,
  options?: ValidatorOptions,
) => Promise<ValidationError[]>;

/**
 * Property validation metadata
 */
export interface PropertyValidationMetadata {
  /**
   * Property key
   */
  propertyKey: string | symbol;

  /**
   * Validation constraints
   */
  constraints: ValidationConstraint[];

  /**
   * Is optional
   */
  isOptional?: boolean;

  /**
   * Is conditional
   */
  isConditional?: boolean;

  /**
   * Condition function
   */
  condition?: (object: any) => boolean;

  /**
   * Nested validation class
   */
  nestedType?: () => any;

  /**
   * Is array
   */
  isArray?: boolean;
}

/**
 * Class validation metadata
 */
export interface ClassValidationMetadata {
  /**
   * Target class
   */
  target: any;

  /**
   * Property validations
   */
  properties: Map<string | symbol, PropertyValidationMetadata>;
}

