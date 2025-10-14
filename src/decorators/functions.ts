/**
 * Helper functions for type-safe mapper instantiation and transformation
 * Inspired by class-transformer's API design
 */

import { MapperMethods } from './metadata';

/**
 * Transform options for plainToInstance and related functions
 */
export interface TransformOptions {
  /**
   * Groups to use during transformation
   * @see @Expose decorator groups option
   */
  groups?: string[];

  /**
   * Version to use during transformation
   * @see @Expose decorator since/until options
   */
  version?: number;

  /**
   * Whether to exclude extraneous values not defined in the class
   */
  excludeExtraneousValues?: boolean;

  /**
   * Enable implicit type conversion
   */
  enableImplicitConversion?: boolean;
}

/**
 * Creates a mapper instance with full TypeScript type safety
 * 
 * This is the recommended way to create mapper instances as it provides
 * type safety without requiring verbose type assertions.
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @returns A mapper instance with transform() and tryTransform() methods
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const mapper = createMapper<UserSource, UserDTO>(UserMapper);
 * const result = mapper.transform(source); // ✅ Fully typed!
 * ```
 */
export function createMapper<Source, Target>(
  MapperClass: new () => any,
): MapperMethods<Source, Target> {
  return new MapperClass();
}

/**
 * Transform a plain JavaScript object to an instance of a class and then transform it
 * 
 * This function combines instantiation and transformation in one call,
 * similar to class-transformer's plainToInstance function.
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param source - The source object to transform
 * @param options - Optional transformation options
 * @returns The transformed target object
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const result = plainToInstance(UserMapper, source);
 * // result is fully typed as UserDTO
 * ```
 */
export function plainToInstance<Source, Target>(
  MapperClass: new () => any,
  source: Source,
  options?: TransformOptions,
): Target {
  const mapper = new MapperClass() as MapperMethods<Source, Target>;
  return mapper.transform(source);
}

/**
 * Alias for plainToInstance for compatibility with class-transformer
 * 
 * @deprecated Use plainToInstance instead
 */
export function plainToClass<Source, Target>(
  MapperClass: new () => any,
  source: Source,
  options?: TransformOptions,
): Target {
  return plainToInstance<Source, Target>(MapperClass, source, options);
}

/**
 * Transform an array of plain JavaScript objects to instances
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param sources - Array of source objects to transform
 * @param options - Optional transformation options
 * @returns Array of transformed target objects
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const users = [{ name: 'John' }, { name: 'Jane' }];
 * const results = plainToInstanceArray(UserMapper, users);
 * // results is fully typed as UserDTO[]
 * ```
 */
export function plainToInstanceArray<Source, Target>(
  MapperClass: new () => any,
  sources: Source[],
  options?: TransformOptions,
): Target[] {
  const mapper = new MapperClass() as MapperMethods<Source, Target>;
  return sources.map((source) => mapper.transform(source));
}

/**
 * Alias for plainToInstanceArray for compatibility with class-transformer
 * 
 * @deprecated Use plainToInstanceArray instead
 */
export function plainToClassArray<Source, Target>(
  MapperClass: new () => any,
  sources: Source[],
  options?: TransformOptions,
): Target[] {
  return plainToInstanceArray<Source, Target>(MapperClass, sources, options);
}

/**
 * Transform with error handling
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param source - The source object to transform
 * @param options - Optional transformation options
 * @returns Object with result and errors array
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const { result, errors } = tryPlainToInstance(UserMapper, source);
 * if (errors.length > 0) {
 *   console.error('Transformation errors:', errors);
 * }
 * ```
 */
export function tryPlainToInstance<Source, Target>(
  MapperClass: new () => any,
  source: Source,
  options?: TransformOptions,
): { result: Target; errors: string[] } {
  const mapper = new MapperClass() as MapperMethods<Source, Target>;
  return mapper.tryTransform(source);
}

/**
 * Transform array with error handling
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param sources - Array of source objects to transform
 * @param options - Optional transformation options
 * @returns Array of objects with result and errors
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const users = [{ name: 'John' }, { name: 'Jane' }];
 * const results = tryPlainToInstanceArray(UserMapper, users);
 * results.forEach(({ result, errors }) => {
 *   if (errors.length > 0) {
 *     console.error('Errors:', errors);
 *   }
 * });
 * ```
 */
export function tryPlainToInstanceArray<Source, Target>(
  MapperClass: new () => any,
  sources: Source[],
  options?: TransformOptions,
): Array<{ result: Target; errors: string[] }> {
  const mapper = new MapperClass() as MapperMethods<Source, Target>;
  return sources.map((source) => mapper.tryTransform(source));
}

/**
 * Create a reusable mapper instance
 * 
 * This is useful when you need to transform multiple objects with the same mapper
 * and want to avoid creating a new instance each time.
 * 
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @returns A mapper instance that can be reused
 * 
 * @example
 * ```typescript
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 * 
 * const mapper = getMapper<UserSource, UserDTO>(UserMapper);
 * 
 * const result1 = mapper.transform(source1);
 * const result2 = mapper.transform(source2);
 * ```
 */
export function getMapper<Source, Target>(
  MapperClass: new () => any,
): MapperMethods<Source, Target> {
  return createMapper<Source, Target>(MapperClass);
}

