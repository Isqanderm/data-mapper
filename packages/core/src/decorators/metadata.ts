/**
 * Metadata storage for decorator-based mappers
 * Uses WeakMap to avoid memory leaks and ensure proper garbage collection
 *
 * @packageDocumentation
 */

/**
 * Configuration options for the @Mapper decorator
 *
 * Controls the behavior and performance characteristics of the mapper.
 * These options are set when decorating a class with @Mapper() and affect
 * how the mapper compiles and executes transformations.
 *
 * @example Basic usage
 * ```typescript
 * @Mapper<Source, Target>({ unsafe: true })
 * class FastMapper {
 *   @Map('name')
 *   name!: string;
 * }
 * ```
 *
 * @see {@link Mapper} for the decorator that uses these options
 */
export interface MapperOptions {
  /**
   * If true, disables try-catch error handling for maximum performance.
   * Use only when you're certain the source data is valid and well-formed.
   * @default false
   */
  unsafe?: boolean;

  /**
   * Alias for `unsafe` option, provided for compatibility with MapperConfig.
   * @default false
   */
  useUnsafe?: boolean;

  /**
   * If true, enables strict mode validation (future feature).
   * @default false
   */
  strict?: boolean;
}

/**
 * Interface for mapper instances
 * Classes decorated with @Mapper() will have these methods added at runtime
 *
 * Note: Due to TypeScript limitations with TC39 decorators, the methods are added
 * at runtime by the decorator. For TypeScript type safety, cast the mapper instance
 * to the MapperMethods type or use type assertions.
 *
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 *
 * // Type-safe usage with type assertion
 * const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
 * const result = mapper.transform(source); // ✅ TypeScript knows the types
 *
 * // Or use a helper function
 * function createMapper<S, T>(MapperClass: new () => any): MapperMethods<S, T> {
 *   return new MapperClass();
 * }
 * const mapper = createMapper<UserSource, UserDTO>(UserMapper);
 * ```
 */
export interface IMapper<Source = any, Target = any> {
  /**
   * Transform source object to target object
   * Optimized for performance - skips error checking in hot path
   * @param source - Source object to transform
   * @returns Transformed target object
   */
  transform(source: Source): Target;

  /**
   * Transform source object to target object (safe mode)
   * Returns both result and errors
   * @param source - Source object to transform
   * @returns Object containing result and errors array
   */
  tryTransform(source: Source): { result: Target; errors: string[] };
}

/**
 * Type helper for mapper methods
 * Use this for type assertions to get TypeScript type checking
 *
 * IMPORTANT: Do NOT use `implements MapperMethods` in your class declaration
 * as it will interfere with the decorator. Instead, use type assertions.
 *
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 *
 * // Type-safe usage
 * const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
 * const result = mapper.transform(source);
 * ```
 */
export type MapperMethods<Source = any, Target = any> = {
  transform: (source: Source) => Target;
  tryTransform: (source: Source) => { result: Target; errors: string[] };
};

/**
 * Metadata for a single property mapping
 *
 * Describes how a single property should be mapped from source to target,
 * including the mapping type, transformation functions, and additional options.
 * This metadata is collected by property decorators and used during JIT compilation.
 *
 * @template Source - The source object type
 * @template Target - The target property type
 *
 * @example Path mapping metadata
 * ```typescript
 * const mapping: PropertyMapping = {
 *   propertyKey: 'fullName',
 *   type: 'path',
 *   sourcePath: 'user.name'
 * };
 * ```
 *
 * @example Transform mapping metadata
 * ```typescript
 * const mapping: PropertyMapping<User, string> = {
 *   propertyKey: 'fullName',
 *   type: 'transform',
 *   transformer: (src: User) => `${src.firstName} ${src.lastName}`
 * };
 * ```
 */
export interface PropertyMapping<Source = any, Target = any> {
  /** The name of the target property */
  propertyKey: string | symbol;

  /** The type of mapping to perform */
  type: 'path' | 'transform' | 'nested' | 'ignore';

  /** Path to the source property (for 'path' type mappings) */
  sourcePath?: string;

  /** Transformation function (for 'transform' type mappings) */
  transformer?: (source: Source) => Target;

  /** Nested mapper class (for 'nested' type mappings) */
  nestedMapper?: any;

  /** Default value to use if source value is undefined */
  defaultValue?: any;

  /** Value transformation function applied after mapping */
  transformValue?: (value: any) => any;

  /** Conditional function to determine if mapping should occur */
  condition?: (source: Source) => boolean;

  /** Validation function for the mapped value */
  validator?: (value: any) => boolean | string;
}

/**
 * Complete metadata for a mapper class
 *
 * Contains all the information needed to compile and execute a mapper,
 * including configuration options and property mappings. This metadata
 * is stored in a WeakMap and accessed during mapper compilation.
 *
 * @template Source - The source object type
 * @template Target - The target object type
 *
 * @example
 * ```typescript
 * const metadata: MapperMetadata<UserSource, UserDTO> = {
 *   options: { unsafe: false },
 *   properties: new Map([
 *     ['name', { propertyKey: 'name', type: 'path', sourcePath: 'firstName' }],
 *     ['email', { propertyKey: 'email', type: 'path', sourcePath: 'email' }]
 *   ])
 * };
 * ```
 */
export interface MapperMetadata<Source = any, Target = any> {
  /** Configuration options for the mapper */
  options: MapperOptions;

  /** Map of property names to their mapping configurations */
  properties: Map<string | symbol, PropertyMapping<Source, Target>>;

  /** Optional source type constructor (for runtime type checking) */
  sourceType?: new (...args: any[]) => Source;

  /** Optional target type constructor (for runtime type checking) */
  targetType?: new (...args: any[]) => Target;
}

// Global metadata storage
const metadataStore = new WeakMap<Function, MapperMetadata>();

/**
 * Get or create metadata for a mapper class
 */
export function getMapperMetadata<Source = any, Target = any>(
  target: Function,
): MapperMetadata<Source, Target> {
  if (!metadataStore.has(target)) {
    metadataStore.set(target, {
      options: {},
      properties: new Map(),
    });
  }
  return metadataStore.get(target)!;
}

/**
 * Set mapper metadata
 */
export function setMapperMetadata<Source = any, Target = any>(
  target: Function,
  metadata: MapperMetadata<Source, Target>,
): void {
  metadataStore.set(target, metadata);
}

/**
 * Get property mapping metadata
 */
export function getPropertyMapping<Source = any, Target = any>(
  target: Function,
  propertyKey: string | symbol,
): PropertyMapping<Source, Target> | undefined {
  const metadata = getMapperMetadata<Source, Target>(target);
  return metadata.properties.get(propertyKey);
}

/**
 * Set property mapping metadata
 */
export function setPropertyMapping<Source = any, Target = any>(
  target: Function,
  propertyKey: string | symbol,
  mapping: PropertyMapping<Source, Target>,
): void {
  const metadata = getMapperMetadata<Source, Target>(target);
  metadata.properties.set(propertyKey, mapping);
}

/**
 * Update property mapping metadata
 */
export function updatePropertyMapping<Source = any, Target = any>(
  target: Function,
  propertyKey: string | symbol,
  updates: Partial<PropertyMapping<Source, Target>>,
): void {
  const metadata = getMapperMetadata<Source, Target>(target);
  const existing = metadata.properties.get(propertyKey) || {
    propertyKey,
    type: 'path' as const,
  };
  metadata.properties.set(propertyKey, { ...existing, ...updates });
}
