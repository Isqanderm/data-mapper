/**
 * Metadata storage for class-transformer compatibility layer
 * Using WeakMap to avoid memory leaks
 */

import type {
  ExposeOptions,
  ExcludeOptions,
  TypeOptions,
  TypeHelpFunction,
  TransformFn,
  ClassTransformOptions,
  TransformationType,
} from './types';

/**
 * Property metadata for class-transformer compatibility
 */
export interface PropertyMetadata {
  /**
   * Whether this property is exposed
   */
  expose?: boolean;

  /**
   * Whether this property is excluded
   */
  exclude?: boolean;

  /**
   * Expose options
   */
  exposeOptions?: ExposeOptions;

  /**
   * Exclude options
   */
  excludeOptions?: ExcludeOptions;

  /**
   * Type function for nested transformations
   */
  typeFunction?: TypeHelpFunction;

  /**
   * Type options
   */
  typeOptions?: TypeOptions;

  /**
   * Transform function
   */
  transformFn?: TransformFn;

  /**
   * Transform options
   */
  transformOptions?: {
    toClassOnly?: boolean;
    toPlainOnly?: boolean;
  };

  /**
   * Property name mapping (for @Expose({ name: 'otherName' }))
   */
  name?: string;
}

/**
 * Class metadata for class-transformer compatibility
 */
export interface ClassMetadata {
  /**
   * Property metadata map
   */
  properties: Map<string | symbol, PropertyMetadata>;

  /**
   * Class-level options
   */
  classOptions?: {
    expose?: boolean;
    exclude?: boolean;
  };
}

/**
 * WeakMap to store metadata for each class
 */
const metadataStorage = new WeakMap<Function, ClassMetadata>();

/**
 * Get metadata for a class constructor
 */
export function getCompatMetadata(target: Function): ClassMetadata {
  let metadata = metadataStorage.get(target);
  if (!metadata) {
    metadata = {
      properties: new Map(),
      classOptions: {},
    };
    metadataStorage.set(target, metadata);
  }
  return metadata;
}

/**
 * Set metadata for a class constructor
 */
export function setCompatMetadata(target: Function, metadata: ClassMetadata): void {
  metadataStorage.set(target, metadata);
}

/**
 * Update property metadata
 */
export function updateCompatMetadata(
  target: Function,
  propertyKey: string | symbol,
  updates: Partial<PropertyMetadata>,
): void {
  const metadata = getCompatMetadata(target);
  const existing = metadata.properties.get(propertyKey) || {};
  metadata.properties.set(propertyKey, { ...existing, ...updates });
}

/**
 * Check if a property should be exposed based on metadata and options
 */
export function shouldExposeProperty(
  propertyMeta: PropertyMetadata | undefined,
  propertyKey: string | symbol,
  transformationType: TransformationType,
  options: ClassTransformOptions = {},
): boolean {
  // If ignoring decorators, expose all properties
  if (options.ignoreDecorators) {
    return true;
  }

  // Check exclude prefixes
  if (options.excludePrefixes && typeof propertyKey === 'string') {
    for (const prefix of options.excludePrefixes) {
      if (propertyKey.startsWith(prefix)) {
        return false;
      }
    }
  }

  // If no metadata, use strategy
  if (!propertyMeta) {
    const strategy = options.excludeExtraneousValues ? 'excludeAll' : options.strategy || 'exposeAll';
    return strategy === 'exposeAll';
  }

  // Check if explicitly excluded
  if (propertyMeta.exclude) {
    const excludeOpts = propertyMeta.excludeOptions || {};
    if (transformationType === 'plainToClass' && excludeOpts.toClassOnly) {
      return false;
    }
    if (transformationType === 'classToPlain' && excludeOpts.toPlainOnly) {
      return false;
    }
    if (!excludeOpts.toClassOnly && !excludeOpts.toPlainOnly) {
      return false;
    }
  }

  // Check if explicitly exposed
  if (propertyMeta.expose) {
    const exposeOpts = propertyMeta.exposeOptions || {};

    // Check transformation type restrictions
    if (transformationType === 'plainToClass' && exposeOpts.toPlainOnly) {
      return false;
    }
    if (transformationType === 'classToPlain' && exposeOpts.toClassOnly) {
      return false;
    }

    // Check groups
    if (options.groups && exposeOpts.groups) {
      const hasMatchingGroup = exposeOpts.groups.some((g) => options.groups!.includes(g));
      if (!hasMatchingGroup) {
        return false;
      }
    }

    // Check version
    if (options.version !== undefined) {
      if (exposeOpts.since !== undefined && options.version < exposeOpts.since) {
        return false;
      }
      if (exposeOpts.until !== undefined && options.version >= exposeOpts.until) {
        return false;
      }
    }

    return true;
  }

  // Use strategy
  const strategy = options.excludeExtraneousValues ? 'excludeAll' : options.strategy || 'exposeAll';
  return strategy === 'exposeAll';
}

/**
 * Get the source property name for a target property
 * Handles @Expose({ name: 'sourceName' })
 */
export function getSourcePropertyName(
  propertyMeta: PropertyMetadata | undefined,
  propertyKey: string | symbol,
): string {
  if (propertyMeta?.name) {
    return propertyMeta.name;
  }
  return String(propertyKey);
}

