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
 * Transform an array of plain JavaScript objects to class instances
 *
 * Efficiently transforms multiple objects in a single call, using the same
 * compiled mapper for all items for optimal performance. This is the recommended
 * way to transform arrays of objects, as it reuses the mapper instance and
 * compiled transformation code.
 *
 * @template Source - The source object type
 * @template Target - The target object type
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param sources - Array of source objects to transform
 * @param options - Optional transformation options
 * @returns Array of transformed target objects
 *
 * @example Transform API response array
 * ```typescript
 * type UserResponse = {
 *   id: number;
 *   first_name: string;
 *   last_name: string;
 *   email: string;
 * };
 *
 * type UserDTO = {
 *   userId: number;
 *   fullName: string;
 *   email: string;
 * };
 *
 * @Mapper<UserResponse, UserDTO>()
 * class UserMapper {
 *   @Map('id')
 *   userId!: number;
 *
 *   @MapFrom((src: UserResponse) => `${src.first_name} ${src.last_name}`)
 *   fullName!: string;
 *
 *   @Map('email')
 *   email!: string;
 * }
 *
 * const apiResponse = [
 *   { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
 *   { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
 * ];
 *
 * const users = plainToInstanceArray(UserMapper, apiResponse);
 * // [
 * //   { userId: 1, fullName: 'John Doe', email: 'john@example.com' },
 * //   { userId: 2, fullName: 'Jane Smith', email: 'jane@example.com' }
 * // ]
 * ```
 *
 * @example Transform database entities to DTOs
 * ```typescript
 * type ProductEntity = {
 *   product_id: string;
 *   product_name: string;
 *   price_cents: number;
 *   created_at: string;
 * };
 *
 * type ProductDTO = {
 *   id: string;
 *   name: string;
 *   price: number;
 *   createdAt: Date;
 * };
 *
 * @Mapper<ProductEntity, ProductDTO>()
 * class ProductMapper {
 *   @Map('product_id')
 *   id!: string;
 *
 *   @Map('product_name')
 *   name!: string;
 *
 *   @MapFrom((src: ProductEntity) => src.price_cents / 100)
 *   price!: number;
 *
 *   @MapFrom((src: ProductEntity) => new Date(src.created_at))
 *   createdAt!: Date;
 * }
 *
 * const entities = await db.query('SELECT * FROM products');
 * const products = plainToInstanceArray(ProductMapper, entities);
 * ```
 *
 * @example Empty array handling
 * ```typescript
 * const emptyArray: UserResponse[] = [];
 * const result = plainToInstanceArray(UserMapper, emptyArray);
 * // [] - returns empty array, no errors
 * ```
 *
 * @see {@link plainToInstance} for transforming single objects
 * @see {@link tryPlainToInstanceArray} for array transformation with error handling
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
 * Transform a plain object to a class instance with error handling
 *
 * Similar to plainToInstance, but returns both the transformation result and any
 * errors that occurred during the process. This is useful when you need to handle
 * transformation errors gracefully without throwing exceptions. The result is always
 * returned, even if errors occurred, allowing you to inspect partial transformations.
 *
 * @template Source - The source object type
 * @template Target - The target object type
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param source - The source object to transform
 * @param options - Optional transformation options
 * @returns Object containing the transformed result and an array of error messages
 *
 * @example Basic error handling
 * ```typescript
 * type Source = { name: string; age: number };
 * type Target = { name: string; age: number };
 *
 * @Mapper<Source, Target>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @Map('age')
 *   age!: number;
 * }
 *
 * const { result, errors } = tryPlainToInstance(UserMapper, source);
 *
 * if (errors.length > 0) {
 *   console.error('Transformation errors:', errors);
 *   // Handle errors appropriately
 * } else {
 *   console.log('Success:', result);
 * }
 * ```
 *
 * @example Handling validation errors in API endpoints
 * ```typescript
 * import { tryPlainToInstance } from 'om-data-mapper';
 *
 * app.post('/api/users', (req, res) => {
 *   const { result, errors } = tryPlainToInstance(UserMapper, req.body);
 *
 *   if (errors.length > 0) {
 *     return res.status(400).json({
 *       message: 'Validation failed',
 *       errors: errors
 *     });
 *   }
 *
 *   // Process valid result
 *   const user = await userService.create(result);
 *   res.json(user);
 * });
 * ```
 *
 * @example Logging transformation issues
 * ```typescript
 * const { result, errors } = tryPlainToInstance(ProductMapper, apiData);
 *
 * if (errors.length > 0) {
 *   logger.warn('Product transformation had errors', {
 *     errors,
 *     source: apiData,
 *     partialResult: result
 *   });
 * }
 *
 * // Use result even if there were non-critical errors
 * return result;
 * ```
 *
 * @example Collecting errors from multiple transformations
 * ```typescript
 * const allErrors: string[] = [];
 * const results: UserDTO[] = [];
 *
 * for (const source of sources) {
 *   const { result, errors } = tryPlainToInstance(UserMapper, source);
 *   results.push(result);
 *   allErrors.push(...errors);
 * }
 *
 * if (allErrors.length > 0) {
 *   console.error(`${allErrors.length} errors occurred during batch transformation`);
 * }
 * ```
 *
 * @see {@link plainToInstance} for transformation without explicit error handling
 * @see {@link tryPlainToInstanceArray} for array transformation with error handling
 * @see {@link MappingResult} for the return type structure
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
 * Transform an array of plain objects with error handling for each item
 *
 * Transforms multiple objects and returns detailed error information for each transformation.
 * Unlike plainToInstanceArray which throws on errors, this function returns both successful
 * and failed transformations, allowing you to handle errors individually for each item.
 * This is particularly useful for batch processing where you want to continue processing
 * even if some items fail.
 *
 * @template Source - The source object type
 * @template Target - The target object type
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @param sources - Array of source objects to transform
 * @param options - Optional transformation options
 * @returns Array of objects, each containing a result and errors array
 *
 * @example Processing API batch responses with error tracking
 * ```typescript
 * type UserResponse = { id: number; name: string; email: string };
 * type UserDTO = { userId: number; name: string; email: string };
 *
 * @Mapper<UserResponse, UserDTO>()
 * class UserMapper {
 *   @Map('id')
 *   userId!: number;
 *
 *   @Map('name')
 *   name!: string;
 *
 *   @Map('email')
 *   email!: string;
 * }
 *
 * const apiResponses = [
 *   { id: 1, name: 'John', email: 'john@example.com' },
 *   { id: 2, name: 'Jane', email: 'jane@example.com' }
 * ];
 *
 * const results = tryPlainToInstanceArray(UserMapper, apiResponses);
 *
 * results.forEach(({ result, errors }, index) => {
 *   if (errors.length > 0) {
 *     console.error(`Item ${index} had errors:`, errors);
 *   } else {
 *     console.log(`Item ${index} transformed successfully:`, result);
 *   }
 * });
 * ```
 *
 * @example Separating successful and failed transformations
 * ```typescript
 * const results = tryPlainToInstanceArray(ProductMapper, products);
 *
 * const successful = results
 *   .filter(({ errors }) => errors.length === 0)
 *   .map(({ result }) => result);
 *
 * const failed = results
 *   .filter(({ errors }) => errors.length > 0)
 *   .map(({ result, errors }, index) => ({
 *     index,
 *     result,
 *     errors
 *   }));
 *
 * console.log(`Successfully transformed: ${successful.length}`);
 * console.log(`Failed transformations: ${failed.length}`);
 *
 * if (failed.length > 0) {
 *   logger.error('Transformation failures', { failed });
 * }
 * ```
 *
 * @example Batch import with error reporting
 * ```typescript
 * import { tryPlainToInstanceArray } from 'om-data-mapper';
 *
 * async function importUsers(csvData: UserCSV[]) {
 *   const results = tryPlainToInstanceArray(UserMapper, csvData);
 *
 *   const report = {
 *     total: results.length,
 *     successful: 0,
 *     failed: 0,
 *     errors: [] as Array<{ row: number; errors: string[] }>
 *   };
 *
 *   results.forEach(({ result, errors }, index) => {
 *     if (errors.length === 0) {
 *       report.successful++;
 *       await userRepository.save(result);
 *     } else {
 *       report.failed++;
 *       report.errors.push({ row: index + 1, errors });
 *     }
 *   });
 *
 *   return report;
 * }
 * ```
 *
 * @example Collecting all errors across transformations
 * ```typescript
 * const results = tryPlainToInstanceArray(OrderMapper, orders);
 *
 * const allErrors = results.flatMap(({ errors }, index) =>
 *   errors.map(error => ({ index, error }))
 * );
 *
 * if (allErrors.length > 0) {
 *   console.error(`Total errors: ${allErrors.length}`);
 *   allErrors.forEach(({ index, error }) => {
 *     console.error(`Order ${index}: ${error}`);
 *   });
 * }
 * ```
 *
 * @see {@link plainToInstanceArray} for array transformation without error details
 * @see {@link tryPlainToInstance} for single object transformation with error handling
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
 * Create a reusable mapper instance for optimal performance
 *
 * Creates and returns a mapper instance that can be reused for multiple transformations.
 * This is the most performant way to use mappers when you need to transform many objects,
 * as it creates the mapper once and reuses the compiled transformation code. The mapper
 * is compiled during instantiation using JIT compilation, so subsequent transformations
 * are extremely fast.
 *
 * @template Source - The source object type
 * @template Target - The target object type
 * @param MapperClass - The mapper class decorated with @Mapper()
 * @returns A mapper instance with transform() and tryTransform() methods
 *
 * @example Reusing mapper for multiple transformations
 * ```typescript
 * type UserSource = { firstName: string; lastName: string };
 * type UserDTO = { fullName: string };
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
 *   fullName!: string;
 * }
 *
 * // Create mapper once
 * const mapper = getMapper<UserSource, UserDTO>(UserMapper);
 *
 * // Reuse for multiple transformations
 * const user1 = mapper.transform({ firstName: 'John', lastName: 'Doe' });
 * const user2 = mapper.transform({ firstName: 'Jane', lastName: 'Smith' });
 * const user3 = mapper.transform({ firstName: 'Bob', lastName: 'Johnson' });
 * ```
 *
 * @example High-performance batch processing
 * ```typescript
 * import { getMapper } from 'om-data-mapper';
 *
 * // Create mapper once outside the loop
 * const productMapper = getMapper<ProductEntity, ProductDTO>(ProductMapper);
 *
 * async function processProducts(products: ProductEntity[]) {
 *   // Reuse the same mapper instance for all transformations
 *   const dtos = products.map(product => productMapper.transform(product));
 *   return dtos;
 * }
 *
 * // Much faster than creating a new mapper for each transformation
 * ```
 *
 * @example Using in a service class
 * ```typescript
 * class UserService {
 *   private readonly userMapper = getMapper<UserEntity, UserDTO>(UserMapper);
 *
 *   async getUser(id: string): Promise<UserDTO> {
 *     const entity = await this.userRepository.findById(id);
 *     return this.userMapper.transform(entity);
 *   }
 *
 *   async getUsers(): Promise<UserDTO[]> {
 *     const entities = await this.userRepository.findAll();
 *     return entities.map(entity => this.userMapper.transform(entity));
 *   }
 * }
 * ```
 *
 * @example Combining with error handling
 * ```typescript
 * const mapper = getMapper<Source, Target>(MyMapper);
 *
 * function safeTransform(source: Source): Target | null {
 *   const { result, errors } = mapper.tryTransform(source);
 *
 *   if (errors.length > 0) {
 *     logger.error('Transformation failed', { errors, source });
 *     return null;
 *   }
 *
 *   return result;
 * }
 * ```
 *
 * @example Performance comparison
 * ```typescript
 * // ❌ Slower: Creates new mapper instance each time
 * function transformSlow(sources: Source[]) {
 *   return sources.map(source => plainToInstance(MyMapper, source));
 * }
 *
 * // ✅ Faster: Reuses mapper instance
 * const mapper = getMapper<Source, Target>(MyMapper);
 * function transformFast(sources: Source[]) {
 *   return sources.map(source => mapper.transform(source));
 * }
 * ```
 *
 * @see {@link createMapper} for an alias of this function
 * @see {@link plainToInstance} for one-time transformations
 * @see {@link plainToInstanceArray} for transforming arrays
 */
export function getMapper<Source, Target>(
  MapperClass: new () => any,
): MapperMethods<Source, Target> {
  return createMapper<Source, Target>(MapperClass);
}
