/**
 * Type definitions for class-transformer compatibility layer
 * Using TC39 Stage 3 decorators
 */

/**
 * Transformation strategy
 */
export type TransformationType = 'plainToClass' | 'classToPlain' | 'classToClass';

/**
 * Transformation strategy for excluding/exposing properties
 */
export type TransformationStrategy = 'excludeAll' | 'exposeAll';

/**
 * Options for class transformation
 */
export interface ClassTransformOptions {
  /**
   * Transformation strategy. Default is 'exposeAll'.
   */
  strategy?: TransformationStrategy;

  /**
   * Only properties with @Expose decorator will be included.
   * Same as strategy: 'excludeAll'
   */
  excludeExtraneousValues?: boolean;

  /**
   * Groups to be used during transformation.
   */
  groups?: string[];

  /**
   * Version to be used during transformation.
   */
  version?: number;

  /**
   * Exclude properties with these prefixes.
   */
  excludePrefixes?: string[];

  /**
   * If set to true, class-transformer will ignore all decorators.
   */
  ignoreDecorators?: boolean;

  /**
   * If true, values of properties decorated with @Type(() => Number/String/Boolean/Date) are
   * coerced from primitive inputs. Requires @Type — implicit conversion from reflected types
   * is impossible with TC39 decorators. For array-valued properties, each element is coerced
   * individually (e.g. `string[]` -> `number[]`), not the array as a whole.
   */
  enableImplicitConversion?: boolean;
}

/**
 * Options for @Expose decorator
 */
export interface ExposeOptions {
  /**
   * Property name to expose under a different name.
   */
  name?: string;

  /**
   * Groups to expose this property in.
   */
  groups?: string[];

  /**
   * Expose this property starting from this version.
   */
  since?: number;

  /**
   * Expose this property until this version.
   */
  until?: number;

  /**
   * Expose this property only when transforming to class.
   */
  toClassOnly?: boolean;

  /**
   * Expose this property only when transforming to plain.
   */
  toPlainOnly?: boolean;
}

/**
 * Options for @Exclude decorator
 */
export interface ExcludeOptions {
  /**
   * Exclude this property only when transforming to class.
   */
  toClassOnly?: boolean;

  /**
   * Exclude this property only when transforming to plain.
   */
  toPlainOnly?: boolean;
}

/**
 * Options for @Type decorator
 */
export interface TypeOptions {
  /**
   * Discriminator for polymorphic types.
   */
  discriminator?: {
    property: string;
    subTypes: Array<{
      value: any;
      name: string;
    }>;
  };

  /**
   * Keep discriminator property in the result.
   */
  keepDiscriminatorProperty?: boolean;
}

/**
 * Type function for @Type decorator
 */
export type TypeHelpFunction = (type?: TypeHelpOptions) => Function;

/**
 * Type help options
 */
export interface TypeHelpOptions {
  newObject: any;
  object: any;
  property: string;
}

/**
 * Transform function parameters
 */
export interface TransformFnParams {
  /**
   * The value to transform.
   */
  value: any;

  /**
   * The key of the property being transformed.
   */
  key: string;

  /**
   * The object being transformed.
   */
  obj: any;

  /**
   * The type of transformation.
   */
  type: TransformationType;

  /**
   * Transformation options.
   */
  options: ClassTransformOptions;
}

/**
 * Transform function type
 */
export type TransformFn = (params: TransformFnParams) => any;
