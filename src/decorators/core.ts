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
  IMapper,
} from './metadata';
import { Mapper as BaseMapper } from '../core/Mapper';

// Symbol for storing metadata initialization flag on class
const METADATA_INITIALIZED = Symbol('om-data-mapper:initialized');

/**
 * Generate safe nested property access code with optional chaining
 * Converts 'user.profile.email' to 'source?.user?.profile?.email'
 */
function generateSafePropertyAccess(sourcePath: string): string {
  const parts = sourcePath.split('.');
  if (parts.length === 1) {
    return sourcePath;
  }
  // Add optional chaining to each segment
  return parts.join('?.');
}

/**
 * Class decorator to mark a class as a mapper
 * @param options - Mapper configuration options
 *
 * @example
 * ```typescript
 * @Mapper({ unsafe: true })
 * class UserDTOMapper implements IMapper<UserSource, UserDTO> {
 *   @Map('name')
 *   fullName!: string;
 * }
 * ```
 */
export function Mapper<Source = any, Target = any>(options: MapperOptions = {}) {
  return function <T extends new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext,
  ): T & (new (...args: any[]) => IMapper<Source, Target>) {
    // Validate context
    if (context.kind !== 'class') {
      throw new Error('@Mapper can only be applied to classes');
    }

    // Compile mapper once at class definition time
    let compiledMapper: BaseMapper<any, any> | null = null;

    // Create enhanced class with transform method
    const EnhancedClass = class extends target {
      /**
       * Transform source object to target object
       * Optimized for performance - skips error checking in hot path
       */
      transform(source: Source): Target {
        // Mapper is pre-compiled via context.addInitializer
        // No need for lazy compilation check - compiledMapper is always ready
        // Optimized: directly return result without destructuring and error checking
        // This eliminates overhead in hot path (array operations, loops)
        // Use tryTransform() if you need error information
        return compiledMapper!.execute(source).result;
      }

      /**
       * Transform source object to target object (safe mode)
       * Returns both result and errors
       */
      tryTransform(source: Source): { result: Target; errors: string[] } {
        // Mapper is pre-compiled via context.addInitializer
        // No need for lazy compilation check
        return compiledMapper!.execute(source);
      }

      /**
       * Compile the mapper from decorator metadata using JIT compilation
       * Generates optimized code via new Function() similar to BaseMapper
       */
      private _compileMapper(): BaseMapper<any, any> {
        // Get metadata from this.constructor (where decorators actually stored metadata)
        const metadata = getMapperMetadata(this.constructor);

        // Cache for storing functions and default values
        const cache: { [key: string]: any } = {};
        const defaultValues: any = {};

        // Generate code for each property
        const codeLines: string[] = [];
        const useUnsafe = options.unsafe || options.useUnsafe || false;

        for (const [propertyKey, mapping] of metadata.properties) {
          const key = String(propertyKey);

          if (mapping.type === 'ignore') {
            continue;
          }

          // Generate code for this property
          const code = this._generatePropertyCode(key, mapping, cache, defaultValues, useUnsafe);
          if (code) {
            codeLines.push(code);
          }
        }

        // Store default values in cache
        cache['__defValues'] = defaultValues;

        // Combine all code lines
        const functionBody = codeLines.join('\n');

        // Create JIT-compiled function
        const transformFunction = new Function(
          'source',
          'target',
          '__errors',
          'cache',
          functionBody
        ) as (source: any, target: any, errors: string[], cache: any) => void;

        // Create a minimal BaseMapper-compatible object
        return {
          execute: (source: any) => {
            const errors: string[] = [];
            const target: any = {};
            transformFunction(source, target, errors, cache);
            return { result: target, errors };
          },
        } as any;
      }

      /**
       * Generate optimized code for a single property
       */
      private _generatePropertyCode(
        key: string,
        mapping: PropertyMapping,
        cache: any,
        defaultValues: any,
        useUnsafe: boolean,
      ): string {
        // Handle simple path mapping
        if (mapping.type === 'path' && mapping.sourcePath) {
          return this._generatePathMappingCode(key, mapping, cache, defaultValues, useUnsafe);
        }

        // Handle transform function
        if (mapping.type === 'transform' && mapping.transformer) {
          return this._generateTransformCode(key, mapping, cache, defaultValues, useUnsafe);
        }

        // Handle nested mapper
        if (mapping.type === 'nested' && mapping.nestedMapper) {
          return this._generateNestedMapperCode(key, mapping, cache, defaultValues, useUnsafe);
        }

        return '';
      }

      /**
       * Generate code for simple path mapping
       */
      private _generatePathMappingCode(
        key: string,
        mapping: PropertyMapping,
        cache: any,
        defaultValues: any,
        useUnsafe: boolean,
      ): string {
        const sourcePath = mapping.sourcePath!;
        const hasDefault = mapping.defaultValue !== undefined;

        if (hasDefault) {
          defaultValues[key] = mapping.defaultValue;
        }

        // Generate safe nested property access with optional chaining
        const safeSourcePath = generateSafePropertyAccess(sourcePath);

        // Handle value transformation
        if (mapping.transformValue) {
          cache[`${key}__valueTransform`] = mapping.transformValue;
          const defaultPart = hasDefault
            ? ` ?? cache['__defValues']['${key}']`
            : '';

          const body = `
            target.${key} = cache['${key}__valueTransform'](source?.${safeSourcePath})${defaultPart};
          `;

          return useUnsafe ? body : this._wrapInTryCatch(body, key);
        }

        // Simple path mapping with optional default
        const defaultPart = hasDefault
          ? ` ?? cache['__defValues']['${key}']`
          : '';

        const body = `
          target.${key} = source?.${safeSourcePath}${defaultPart};
        `;

        return useUnsafe ? body : this._wrapInTryCatch(body, key);
      }

      /**
       * Generate code for transform function
       */
      private _generateTransformCode(
        key: string,
        mapping: PropertyMapping,
        cache: any,
        defaultValues: any,
        useUnsafe: boolean,
      ): string {
        let transformer = mapping.transformer!;
        const hasDefault = mapping.defaultValue !== undefined;
        const hasCondition = mapping.condition !== undefined;

        if (hasDefault) {
          defaultValues[key] = mapping.defaultValue;
        }

        // Store transformer in cache
        cache[`${key}__transformer`] = transformer;

        // Store value transform if exists
        if (mapping.transformValue) {
          cache[`${key}__valueTransform`] = mapping.transformValue;
        }

        // Store condition if exists
        if (hasCondition) {
          cache[`${key}__condition`] = mapping.condition;
        }

        // Generate optimized code based on what decorators are present
        let body = '';

        if (hasCondition && hasDefault) {
          // Both condition and default
          if (mapping.transformValue) {
            body = `
              if (cache['${key}__condition'](source)) {
                const __value = cache['${key}__transformer'](source);
                target.${key} = __value !== undefined
                  ? cache['${key}__valueTransform'](__value)
                  : cache['__defValues']['${key}'];
              } else {
                target.${key} = cache['__defValues']['${key}'];
              }
            `;
          } else {
            body = `
              if (cache['${key}__condition'](source)) {
                const __value = cache['${key}__transformer'](source);
                target.${key} = __value !== undefined ? __value : cache['__defValues']['${key}'];
              } else {
                target.${key} = cache['__defValues']['${key}'];
              }
            `;
          }
        } else if (hasCondition) {
          // Only condition
          if (mapping.transformValue) {
            body = `
              if (cache['${key}__condition'](source)) {
                target.${key} = cache['${key}__valueTransform'](cache['${key}__transformer'](source));
              }
            `;
          } else {
            body = `
              if (cache['${key}__condition'](source)) {
                target.${key} = cache['${key}__transformer'](source);
              }
            `;
          }
        } else if (hasDefault) {
          // Only default
          if (mapping.transformValue) {
            body = `
              const __value = cache['${key}__transformer'](source);
              target.${key} = __value !== undefined
                ? cache['${key}__valueTransform'](__value)
                : cache['__defValues']['${key}'];
            `;
          } else {
            body = `
              target.${key} = cache['${key}__transformer'](source) ?? cache['__defValues']['${key}'];
            `;
          }
        } else {
          // No condition, no default
          if (mapping.transformValue) {
            body = `
              target.${key} = cache['${key}__valueTransform'](cache['${key}__transformer'](source));
            `;
          } else {
            body = `
              target.${key} = cache['${key}__transformer'](source);
            `;
          }
        }

        return useUnsafe ? body : this._wrapInTryCatch(body, key);
      }

      /**
       * Generate code for nested mapper
       */
      private _generateNestedMapperCode(
        key: string,
        mapping: PropertyMapping,
        cache: any,
        defaultValues: any,
        useUnsafe: boolean,
      ): string {
        // Create instance of nested mapper and store in cache
        const nestedInstance = new mapping.nestedMapper!();
        cache[`${key}__nestedMapper`] = nestedInstance;

        const hasDefault = mapping.defaultValue !== undefined;
        const hasTransformValue = mapping.transformValue !== undefined;

        if (hasDefault) {
          defaultValues[key] = mapping.defaultValue;
        }

        if (hasTransformValue) {
          cache[`${key}__valueTransform`] = mapping.transformValue;
        }

        let body = '';

        // Handle transformer function (from @MapFrom)
        if (mapping.transformer) {
          cache[`${key}__transformer`] = mapping.transformer;

          if (hasTransformValue) {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              const __nestedSource = cache['${key}__transformer'](source);
              const __nestedResult = __nestedSource !== undefined && __nestedSource !== null
                ? cache['${key}__nestedMapper'].transform(__nestedSource)
                : undefined;
              target.${key} = cache['${key}__valueTransform'](__nestedResult)${defaultPart};
            `;
          } else {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              const __nestedSource = cache['${key}__transformer'](source);
              target.${key} = __nestedSource !== undefined && __nestedSource !== null
                ? cache['${key}__nestedMapper'].transform(__nestedSource)
                : undefined${defaultPart};
            `;
          }
        }
        // Handle source path (from @Map)
        else if (mapping.sourcePath) {
          const safeSourcePath = generateSafePropertyAccess(mapping.sourcePath);

          if (hasTransformValue) {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              const __nestedSource = source?.${safeSourcePath};
              const __nestedResult = __nestedSource !== undefined && __nestedSource !== null
                ? cache['${key}__nestedMapper'].transform(__nestedSource)
                : undefined;
              target.${key} = cache['${key}__valueTransform'](__nestedResult)${defaultPart};
            `;
          } else {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              const __nestedSource = source?.${safeSourcePath};
              target.${key} = __nestedSource !== undefined && __nestedSource !== null
                ? cache['${key}__nestedMapper'].transform(__nestedSource)
                : undefined${defaultPart};
            `;
          }
        }
        // No source specified, use entire source object
        else {
          if (hasTransformValue) {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              const __nestedResult = cache['${key}__nestedMapper'].transform(source);
              target.${key} = cache['${key}__valueTransform'](__nestedResult)${defaultPart};
            `;
          } else {
            const defaultPart = hasDefault
              ? ` ?? cache['__defValues']['${key}']`
              : '';

            body = `
              target.${key} = cache['${key}__nestedMapper'].transform(source)${defaultPart};
            `;
          }
        }

        return useUnsafe ? body : this._wrapInTryCatch(body, key);
      }

      /**
       * Wrap code in try-catch for error handling
       */
      private _wrapInTryCatch(code: string, fieldName: string): string {
        return `
          try {
            ${code}
          } catch(error) {
            __errors.push("Mapping error at field '${fieldName}': " + error.message);
          }
        `;
      }

      /**
       * Get value by path (helper method)
       * Optimized: pre-split paths are cached
       */
      private _getValueByPath(obj: any, path: string): any {
        // Simple optimization: for single-level paths, avoid split/reduce
        if (!path.includes('.')) {
          return obj?.[path];
        }
        return path.split('.').reduce((current, key) => current?.[key], obj);
      }
    };

    // Store mapper options on the original target (for property decorators to access)
    const metadata = getMapperMetadata(target);
    metadata.options = options;
    setMapperMetadata(target, metadata);

    // Pre-compile mapper eagerly using context.addInitializer
    // This compiles the mapper once when the class is first instantiated
    // instead of lazily on first transform() call
    context.addInitializer(function (this: any) {
      if (!compiledMapper) {
        // Create a temporary instance to compile the mapper
        const tempInstance = new EnhancedClass();
        compiledMapper = tempInstance._compileMapper();
      }
    });

    return EnhancedClass as T & (new (...args: any[]) => IMapper<Source, Target>);
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

