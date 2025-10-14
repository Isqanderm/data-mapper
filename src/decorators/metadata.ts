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
 * Note: Due to TypeScript limitations with TC39 decorators, you cannot use
 * `implements IMapper<Source, Target>` directly. Instead, use the type assertion
 * pattern or declare the methods in your class using MapperMethods<Source, Target>.
 *
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 *
 *   // Declare methods for TypeScript (implementation added by decorator)
 *   transform!: MapperMethods<UserSource, UserDTO>['transform'];
 *   tryTransform!: MapperMethods<UserSource, UserDTO>['tryTransform'];
 * }
 *
 * // Or use the shorthand:
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper implements MapperMethods<UserSource, UserDTO> {
 *   @Map('name')
 *   fullName!: string;
 * }
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
 * Type helper for declaring mapper methods in your class
 * Use this to get TypeScript type checking without implementation
 *
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper implements MapperMethods<UserSource, UserDTO> {
 *   @Map('name')
 *   fullName!: string;
 * }
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

