/**
 * Core decorators for om-data-mapper
 * Using TC39 Stage 3 decorator proposal
 */

import {
  getMapperMetadata,
  setMapperMetadata,
  updatePropertyMapping,
  MapperOptions,
  PropertyMapping,
} from './metadata';
import { Mapper as BaseMapper } from '../core/Mapper';

// Symbol for storing metadata initialization flag on class
const METADATA_INITIALIZED = Symbol('om-data-mapper:initialized');

/**
 * Class decorator to mark a class as a mapper
 * @param options - Mapper configuration options
 *
 * @example
 * ```typescript
 * @Mapper({ unsafe: true })
 * class UserDTOMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * ```
 */
export function Mapper(options: MapperOptions = {}) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext,
  ): T {
    // Validate context
    if (context.kind !== 'class') {
      throw new Error('@Mapper can only be applied to classes');
    }

    // Create enhanced class with transform method
    const EnhancedClass = class extends target {
      private _compiledMapper?: BaseMapper<any, any>;

      /**
       * Transform source object to target object
       */
      transform<Source = any>(source: Source): any {
        if (!this._compiledMapper) {
          this._compiledMapper = this._compileMapper();
        }

        const { result, errors } = this._compiledMapper.execute(source);

        if (errors.length > 0 && !options.unsafe) {
          throw new Error(`Mapping errors: ${errors.join(', ')}`);
        }

        return result;
      }

      /**
       * Transform source object to target object (safe mode)
       * Returns both result and errors
       */
      tryTransform<Source = any>(source: Source): { result: any; errors: string[] } {
        if (!this._compiledMapper) {
          this._compiledMapper = this._compileMapper();
        }

        return this._compiledMapper.execute(source);
      }

      /**
       * Compile the mapper from decorator metadata
       */
      private _compileMapper(): BaseMapper<any, any> {
        // Get metadata from this.constructor (where decorators actually stored metadata)
        const metadata = getMapperMetadata(this.constructor);
        const mappingConfig: any = {};
        const defaultValues: any = {};

        // Build mapping configuration from property metadata
        for (const [propertyKey, mapping] of metadata.properties) {
          const key = String(propertyKey);

          if (mapping.type === 'ignore') {
            continue;
          }

          if (mapping.type === 'path' && mapping.sourcePath) {
            // Simple path mapping
            if (mapping.transformValue) {
              // Apply transformation to the mapped value
              const sourcePath = mapping.sourcePath;
              const valueTransform = mapping.transformValue;
              mappingConfig[key] = (source: any) => {
                const value = this._getValueByPath(source, sourcePath);
                return valueTransform(value);
              };
            } else {
              mappingConfig[key] = mapping.sourcePath;
            }
          } else if (mapping.type === 'transform' && mapping.transformer) {
            let transformer = mapping.transformer;

            // Apply value transformation if exists
            if (mapping.transformValue) {
              const originalTransformer = transformer;
              const valueTransform = mapping.transformValue;
              transformer = (source: any) => {
                const value = originalTransformer(source);
                return valueTransform(value);
              };
            }

            // Apply condition if exists
            if (mapping.condition) {
              const originalTransformer = transformer;
              const condition = mapping.condition;
              transformer = (source: any) => {
                if (!condition(source)) {
                  return mapping.defaultValue;
                }
                return originalTransformer(source);
              };
            }

            // Apply default value if result is undefined
            if (mapping.defaultValue !== undefined) {
              const originalTransformer = transformer;
              const defaultVal = mapping.defaultValue;
              transformer = (source: any) => {
                const value = originalTransformer(source);
                return value !== undefined ? value : defaultVal;
              };
            }

            mappingConfig[key] = transformer;
          } else if (mapping.type === 'nested' && mapping.nestedMapper) {
            // Create instance of nested mapper
            const nestedInstance = new mapping.nestedMapper();
            mappingConfig[key] = (source: any) => {
              const nestedSource = mapping.sourcePath
                ? this._getValueByPath(source, mapping.sourcePath)
                : source;
              return nestedInstance.transform(nestedSource);
            };
          }

          // Set default value if exists
          if (mapping.defaultValue !== undefined) {
            defaultValues[key] = mapping.defaultValue;
          }
        }

        // Convert MapperOptions to MapperConfig
        const config = {
          useUnsafe: options.unsafe || options.useUnsafe || false,
        };
        return BaseMapper.create(mappingConfig, defaultValues, config);
      }

      /**
       * Get value by path (helper method)
       */
      private _getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      }
    } as T;

    // Store mapper options on the original target (for property decorators to access)
    const metadata = getMapperMetadata(target);
    metadata.options = options;
    setMapperMetadata(target, metadata);

    return EnhancedClass;
  };
}

/**
 * Property decorator for simple path mapping
 * @param sourcePath - Path to source property (e.g., 'user.name' or 'email')
 *
 * @example
 * ```typescript
 * @Map('user.email')
 * email!: string;
 * ```
 */
export function Map(sourcePath: string) {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@Map can only be applied to class fields');
    }

    const propertyKey = context.name;

    // Store metadata using static initializer
    // Use a flag on the constructor to ensure we only initialize once
    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      // Check if this class has already been initialized
      if (!(ctor as any)[METADATA_INITIALIZED]) {
        (ctor as any)[METADATA_INITIALIZED] = new Set();
      }

      // Only add this property mapping once
      const initSet = (ctor as any)[METADATA_INITIALIZED] as Set<string | symbol>;
      if (!initSet.has(propertyKey)) {
        initSet.add(propertyKey);

        // Update metadata on constructor
        updatePropertyMapping(ctor, propertyKey, {
          propertyKey,
          type: 'path',
          sourcePath,
        });
      }
    });
  };
}

/**
 * Property decorator for custom transformation
 * @param transformer - Function to transform source to target
 *
 * @example
 * ```typescript
 * @MapFrom((user: User) => `${user.firstName} ${user.lastName}`)
 * fullName!: string;
 * ```
 */
export function MapFrom<Source = any, Target = any>(transformer: (source: Source) => Target) {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@MapFrom can only be applied to class fields');
    }

    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      if (!(ctor as any)[METADATA_INITIALIZED]) {
        (ctor as any)[METADATA_INITIALIZED] = new Set();
      }

      const initSet = (ctor as any)[METADATA_INITIALIZED] as Set<string | symbol>;
      if (!initSet.has(propertyKey)) {
        initSet.add(propertyKey);

        updatePropertyMapping(ctor, propertyKey, {
          propertyKey,
          type: 'transform',
          transformer,
        });
      }
    });
  };
}

/**
 * Property decorator to set default value
 * @param value - Default value
 *
 * @example
 * ```typescript
 * @Default(false)
 * @MapFrom((user: User) => user.age >= 18)
 * isAdult!: boolean;
 * ```
 */
export function Default<T = any>(value: T) {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@Default can only be applied to class fields');
    }

    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      // Default decorator updates existing mapping, so we don't need to check initialization
      // Just update the property mapping
      updatePropertyMapping(ctor, propertyKey, {
        defaultValue: value,
      });
    });
  };
}

/**
 * Property decorator to transform the mapped value
 * @param transformer - Function to transform the value
 *
 * @example
 * ```typescript
 * @Transform((value: string) => value.toUpperCase())
 * @Map('email')
 * emailUpper!: string;
 * ```
 */
export function Transform<T = any, R = any>(transformer: (value: T) => R) {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@Transform can only be applied to class fields');
    }

    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      // Transform decorator creates a chain of transformations
      // Get existing mapping to chain transformations
      const metadata = getMapperMetadata(ctor);
      const existing = metadata.properties.get(propertyKey);

      if (existing && existing.transformValue) {
        // Chain with existing transformation
        const existingTransform = existing.transformValue;
        updatePropertyMapping(ctor, propertyKey, {
          transformValue: (value: any) => transformer(existingTransform(value)),
        });
      } else {
        // First transformation
        updatePropertyMapping(ctor, propertyKey, {
          transformValue: transformer,
        });
      }
    });
  };
}

/**
 * Property decorator to use a nested mapper
 * @param mapperClass - Mapper class to use for nested mapping
 *
 * @example
 * ```typescript
 * @MapWith(AddressMapper)
 * @Map('address')
 * address!: AddressDTO;
 * ```
 */
export function MapWith<T = any>(mapperClass: new () => T) {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@MapWith can only be applied to class fields');
    }

    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      // MapWith decorator updates existing mapping
      updatePropertyMapping(ctor, propertyKey, {
        type: 'nested',
        nestedMapper: mapperClass,
      });
    });
  };
}

/**
 * Property decorator to ignore a property
 *
 * @example
 * ```typescript
 * @Ignore()
 * internalField!: string;
 * ```
 */
export function Ignore() {
  return function (target: undefined, context: ClassFieldDecoratorContext): void {
    if (context.kind !== 'field') {
      throw new Error('@Ignore can only be applied to class fields');
    }

    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      const ctor = this.constructor;

      if (!(ctor as any)[METADATA_INITIALIZED]) {
        (ctor as any)[METADATA_INITIALIZED] = new Set();
      }

      const initSet = (ctor as any)[METADATA_INITIALIZED] as Set<string | symbol>;
      if (!initSet.has(propertyKey)) {
        initSet.add(propertyKey);

        updatePropertyMapping(ctor, propertyKey, {
          propertyKey,
          type: 'ignore',
        });
      }
    });
  };
}

