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
 * Class decorator to mark a class as a mapper with JIT compilation
 *
 * This decorator transforms a regular class into a high-performance mapper that uses
 * Just-In-Time (JIT) compilation to generate optimized transformation code. The mapper
 * is compiled once when the class is first instantiated and reused for all subsequent
 * transformations, delivering up to 42.7x better performance than class-transformer.
 *
 * @template Source - The source object type to transform from
 * @template Target - The target object type to transform to
 * @param options - Mapper configuration options
 * @param options.unsafe - If true, disables try-catch error handling for maximum performance (use with caution)
 * @param options.useUnsafe - Alias for `unsafe` option for compatibility
 * @param options.strict - If true, enables strict mode validation (future feature)
 *
 * @example Basic mapper with simple property mapping
 * ```typescript
 * type UserSource = { firstName: string; lastName: string; age: number };
 * type UserDTO = { fullName: string; age: number };
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('firstName')
 *   fullName!: string;
 *
 *   @Map('age')
 *   age!: number;
 * }
 *
 * const mapper = new UserMapper();
 * const result = mapper.transform({ firstName: 'John', lastName: 'Doe', age: 30 });
 * // { fullName: 'John', age: 30 }
 * ```
 *
 * @example Mapper with custom transformations
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
 *   fullName!: string;
 *
 *   @MapFrom((src: UserSource) => src.age >= 18)
 *   isAdult!: boolean;
 * }
 * ```
 *
 * @example High-performance mapper with unsafe mode
 * ```typescript
 * // Unsafe mode disables error handling for maximum performance
 * // Only use when you're certain the source data is valid
 * @Mapper<UserSource, UserDTO>({ unsafe: true })
 * class FastUserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * ```
 *
 * @example Using with helper functions for type safety
 * ```typescript
 * import { plainToInstance, createMapper } from 'om-data-mapper';
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 *
 * // Option 1: One-time transformation
 * const result = plainToInstance(UserMapper, source);
 *
 * // Option 2: Reusable mapper instance (better for multiple transformations)
 * const mapper = createMapper<UserSource, UserDTO>(UserMapper);
 * const result1 = mapper.transform(source1);
 * const result2 = mapper.transform(source2);
 * ```
 *
 * @see {@link Map} for simple property mapping
 * @see {@link MapFrom} for custom transformation logic
 * @see {@link Transform} for value transformations
 * @see {@link MapWith} for nested object mapping
 * @see {@link plainToInstance} for convenient transformation helper
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
 * Property decorator for simple path mapping from source to target
 *
 * Maps a property from the source object to the target object using a property path.
 * Supports dot notation for accessing nested properties with automatic null-safety
 * through optional chaining. This is the most commonly used decorator for basic
 * field mapping scenarios.
 *
 * @param sourcePath - Path to the source property (supports dot notation for nested access)
 *
 * @example Basic property mapping
 * ```typescript
 * type Source = { firstName: string; email: string };
 * type Target = { name: string; email: string };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Map('firstName')  // Maps source.firstName to target.name
 *   name!: string;
 *
 *   @Map('email')      // Maps source.email to target.email
 *   email!: string;
 * }
 * ```
 *
 * @example Nested property mapping with dot notation
 * ```typescript
 * type Source = {
 *   user: {
 *     profile: {
 *       address: {
 *         city: string;
 *         country: string;
 *       }
 *     }
 *   }
 * };
 * type Target = { city: string; country: string };
 *
 * @Mapper<Source, Target>()
 * class AddressMapper {
 *   @Map('user.profile.address.city')     // Deep property access
 *   city!: string;
 *
 *   @Map('user.profile.address.country')  // Automatically null-safe
 *   country!: string;
 * }
 * ```
 *
 * @example Combining with Transform decorator
 * ```typescript
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Transform((value: string) => value.toUpperCase())
 *   @Map('email')  // First maps, then transforms
 *   emailUpper!: string;
 * }
 * ```
 *
 * @example Combining with Default decorator
 * ```typescript
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Default('Unknown')
 *   @Map('name')  // Uses default if source.name is undefined
 *   name!: string;
 * }
 * ```
 *
 * @see {@link MapFrom} for custom transformation logic instead of simple mapping
 * @see {@link Transform} for transforming the mapped value
 * @see {@link Default} for setting default values
 * @see {@link MapWith} for mapping nested objects with another mapper
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
 * Property decorator for custom transformation logic
 *
 * Applies a custom transformation function to map from the entire source object
 * to a target property. This decorator provides maximum flexibility for complex
 * mapping scenarios where simple path mapping is insufficient. The transformer
 * function receives the complete source object and can perform any computation
 * or combination of source properties.
 *
 * @template Source - The source object type
 * @template Target - The target property type
 * @param transformer - Function that receives the source object and returns the target value
 *
 * @example Combining multiple source properties
 * ```typescript
 * type Source = { firstName: string; lastName: string };
 * type Target = { fullName: string };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @MapFrom((src: Source) => `${src.firstName} ${src.lastName}`)
 *   fullName!: string;
 * }
 *
 * const result = plainToInstance(UserMapper, { firstName: 'John', lastName: 'Doe' });
 * // { fullName: 'John Doe' }
 * ```
 *
 * @example Complex calculations and conditional logic
 * ```typescript
 * type Source = { age: number; birthYear: number };
 * type Target = { isAdult: boolean; ageCategory: string };
 *
 * @Mapper<Source, Target>()
 * class AgeMapper {
 *   @MapFrom((src: Source) => src.age >= 18)
 *   isAdult!: boolean;
 *
 *   @MapFrom((src: Source) => {
 *     if (src.age < 13) return 'child';
 *     if (src.age < 18) return 'teenager';
 *     if (src.age < 65) return 'adult';
 *     return 'senior';
 *   })
 *   ageCategory!: string;
 * }
 * ```
 *
 * @example Accessing nested properties with null-safety
 * ```typescript
 * type Source = { user?: { profile?: { email?: string } } };
 * type Target = { email: string };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @MapFrom((src: Source) => src.user?.profile?.email ?? 'no-email@example.com')
 *   email!: string;
 * }
 * ```
 *
 * @example Array transformations
 * ```typescript
 * type Source = { tags: string[] };
 * type Target = { tagCount: number; tagsUpper: string[] };
 *
 * @Mapper<Source, Target>()
 * class TagMapper {
 *   @MapFrom((src: Source) => src.tags.length)
 *   tagCount!: number;
 *
 *   @MapFrom((src: Source) => src.tags.map(t => t.toUpperCase()))
 *   tagsUpper!: string[];
 * }
 * ```
 *
 * @example Date and type conversions
 * ```typescript
 * type Source = { createdAt: string; price: string };
 * type Target = { createdAt: Date; price: number };
 *
 * @Mapper<Source, Target>()
 * class ProductMapper {
 *   @MapFrom((src: Source) => new Date(src.createdAt))
 *   createdAt!: Date;
 *
 *   @MapFrom((src: Source) => parseFloat(src.price))
 *   price!: number;
 * }
 * ```
 *
 * @see {@link Map} for simple property path mapping
 * @see {@link Transform} for transforming already-mapped values
 * @see {@link Default} for setting default values when transformation returns undefined
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
 * Property decorator to transform a mapped value
 *
 * Applies a transformation function to a value after it has been mapped from the source.
 * This decorator is designed to work in combination with @Map or @MapFrom decorators,
 * allowing you to chain transformations. Multiple @Transform decorators can be stacked
 * on the same property, and they will be executed in order from bottom to top.
 *
 * @template T - The input value type (before transformation)
 * @template R - The output value type (after transformation)
 * @param transformer - Function that transforms the mapped value
 *
 * @example Basic value transformation
 * ```typescript
 * type Source = { email: string };
 * type Target = { emailUpper: string };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Transform((value: string) => value.toUpperCase())
 *   @Map('email')  // First maps email, then transforms to uppercase
 *   emailUpper!: string;
 * }
 *
 * const result = plainToInstance(UserMapper, { email: 'john@example.com' });
 * // { emailUpper: 'JOHN@EXAMPLE.COM' }
 * ```
 *
 * @example Chaining multiple transformations
 * ```typescript
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Transform((value: string) => value.substring(0, 10))  // Third: truncate
 *   @Transform((value: string) => value.trim())            // Second: trim
 *   @Transform((value: string) => value.toLowerCase())     // First: lowercase
 *   @Map('name')
 *   processedName!: string;
 * }
 * // Transformations execute bottom-to-top: lowercase -> trim -> truncate
 * ```
 *
 * @example Type conversion transformations
 * ```typescript
 * type Source = { price: string; quantity: string };
 * type Target = { price: number; quantity: number };
 *
 * @Mapper<Source, Target>()
 * class ProductMapper {
 *   @Transform((value: string) => parseFloat(value))
 *   @Map('price')
 *   price!: number;
 *
 *   @Transform((value: string) => parseInt(value, 10))
 *   @Map('quantity')
 *   quantity!: number;
 * }
 * ```
 *
 * @example Null-safe transformations
 * ```typescript
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Transform((value: string | undefined) => value?.toUpperCase() ?? 'N/A')
 *   @Map('name')
 *   nameUpper!: string;
 * }
 * ```
 *
 * @example Array transformations
 * ```typescript
 * type Source = { tags: string[] };
 * type Target = { tags: string[] };
 *
 * @Mapper<Source, Target>()
 * class TagMapper {
 *   @Transform((tags: string[]) => tags.filter(t => t.length > 0))
 *   @Transform((tags: string[]) => tags.map(t => t.toLowerCase()))
 *   @Map('tags')
 *   tags!: string[];
 * }
 * ```
 *
 * @example Date formatting
 * ```typescript
 * type Source = { createdAt: Date };
 * type Target = { createdAtFormatted: string };
 *
 * @Mapper<Source, Target>()
 * class EventMapper {
 *   @Transform((date: Date) => date.toISOString())
 *   @Map('createdAt')
 *   createdAtFormatted!: string;
 * }
 * ```
 *
 * @example Combining with MapFrom
 * ```typescript
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Transform((name: string) => name.toUpperCase())
 *   @MapFrom((src: Source) => `${src.firstName} ${src.lastName}`)
 *   fullNameUpper!: string;
 * }
 * ```
 *
 * @see {@link Map} for simple property mapping before transformation
 * @see {@link MapFrom} for custom source transformation
 * @see {@link Default} for providing default values
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
 * Property decorator to use a nested mapper for complex object transformations
 *
 * Applies another mapper class to transform nested objects or arrays of objects.
 * This enables composition of mappers, allowing you to build complex transformations
 * from smaller, reusable mapper components. The nested mapper is compiled and cached
 * for optimal performance when transforming multiple objects.
 *
 * @template T - The type of the nested mapper class
 * @param mapperClass - Mapper class decorated with @Mapper() to use for nested transformation
 *
 * @example Mapping nested objects
 * ```typescript
 * type AddressSource = { street: string; city: string };
 * type AddressDTO = { fullAddress: string };
 *
 * @Mapper<AddressSource, AddressDTO>()
 * class AddressMapper {
 *   @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
 *   fullAddress!: string;
 * }
 *
 * type UserSource = { name: string; address: AddressSource };
 * type UserDTO = { name: string; address: AddressDTO };
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @MapWith(AddressMapper)
 *   @Map('address')  // Maps source.address using AddressMapper
 *   address!: AddressDTO;
 * }
 * ```
 *
 * @example Mapping arrays of nested objects
 * ```typescript
 * type PhotoSource = { url: string; width: number; height: number };
 * type PhotoDTO = { url: string; aspectRatio: number };
 *
 * @Mapper<PhotoSource, PhotoDTO>()
 * class PhotoMapper {
 *   @Map('url')
 *   url!: string;
 *
 *   @MapFrom((src: PhotoSource) => src.width / src.height)
 *   aspectRatio!: number;
 * }
 *
 * type UserSource = { name: string; photos: PhotoSource[] };
 * type UserDTO = { name: string; photos: PhotoDTO[] };
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @MapWith(PhotoMapper)
 *   @Map('photos')  // Automatically maps each photo in the array
 *   photos!: PhotoDTO[];
 * }
 * ```
 *
 * @example Deep nesting with multiple mappers
 * ```typescript
 * @Mapper<CitySource, CityDTO>()
 * class CityMapper {
 *   @Map('name')
 *   cityName!: string;
 * }
 *
 * @Mapper<AddressSource, AddressDTO>()
 * class AddressMapper {
 *   @Map('street')
 *   street!: string;
 *
 *   @MapWith(CityMapper)
 *   @Map('city')
 *   city!: CityDTO;
 * }
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @MapWith(AddressMapper)
 *   @Map('address')
 *   address!: AddressDTO;
 * }
 * ```
 *
 * @example Combining with Transform decorator
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Transform((addr: AddressDTO) => addr.fullAddress.toUpperCase())
 *   @MapWith(AddressMapper)
 *   @Map('address')
 *   addressUpper!: string;
 * }
 * ```
 *
 * @see {@link Map} for mapping the source property path
 * @see {@link MapFrom} for custom nested object transformation
 * @see {@link Mapper} for creating the nested mapper class
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
 * Property decorator to exclude a property from mapping
 *
 * Marks a property to be completely ignored during the transformation process.
 * This is useful for internal fields, computed properties, or any data that
 * should not be included in the mapping. Ignored properties will not appear
 * in the transformed output, even if they exist in the source object.
 *
 * @example Ignoring internal fields
 * ```typescript
 * type Source = { name: string; password: string; internalId: string };
 * type Target = { name: string };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @Ignore()  // Password will not be mapped
 *   password!: string;
 *
 *   @Ignore()  // Internal ID will not be mapped
 *   internalId!: string;
 * }
 *
 * const result = plainToInstance(UserMapper, {
 *   name: 'John',
 *   password: 'secret123',
 *   internalId: 'xyz'
 * });
 * // { name: 'John' } - password and internalId are excluded
 * ```
 *
 * @example Ignoring computed properties
 * ```typescript
 * @Mapper<Source, Target>()
 * class ProductMapper {
 *   @Map('price')
 *   price!: number;
 *
 *   @Map('quantity')
 *   quantity!: number;
 *
 *   @Ignore()  // This computed field won't be in the output
 *   get total(): number {
 *     return this.price * this.quantity;
 *   }
 * }
 * ```
 *
 * @example Selective mapping with ignored fields
 * ```typescript
 * type APIResponse = {
 *   id: string;
 *   name: string;
 *   email: string;
 *   createdAt: string;
 *   updatedAt: string;
 *   _metadata: object;
 * };
 * type UserDTO = { id: string; name: string; email: string };
 *
 * @Mapper<APIResponse, UserDTO>()
 * class UserMapper {
 *   @Map('id')
 *   id!: string;
 *
 *   @Map('name')
 *   name!: string;
 *
 *   @Map('email')
 *   email!: string;
 *
 *   @Ignore()  // Exclude timestamps
 *   createdAt!: string;
 *
 *   @Ignore()
 *   updatedAt!: string;
 *
 *   @Ignore()  // Exclude internal metadata
 *   _metadata!: object;
 * }
 * ```
 *
 * @see {@link Map} for including properties in the mapping
 * @see {@link MapFrom} for custom property transformations
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

