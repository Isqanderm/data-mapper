/**
 * Metadata storage for decorator-based mappers
 * Uses WeakMap to avoid memory leaks
 */

export interface MapperOptions {
  unsafe?: boolean;
  useUnsafe?: boolean; // Alias for compatibility with MapperConfig
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
}

export interface PropertyMapping<Source = any, Target = any> {
  propertyKey: string | symbol;
  type: 'path' | 'transform' | 'nested' | 'ignore';
  sourcePath?: string;
  transformer?: (source: Source) => Target;
  nestedMapper?: any;
  defaultValue?: any;
  transformValue?: (value: any) => any;
  condition?: (source: Source) => boolean;
  validator?: (value: any) => boolean | string;
}

export interface MapperMetadata<Source = any, Target = any> {
  options: MapperOptions;
  properties: Map<string | symbol, PropertyMapping<Source, Target>>;
  sourceType?: new (...args: any[]) => Source;
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

