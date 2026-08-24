/**
 * Decorator-based API for om-data-mapper
 * Using TC39 Stage 3 decorators
 *
 * @example
 * ```typescript
 * import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   fullName!: string;
 * }
 *
 * const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
 * ```
 */

// Export decorators
export { Mapper, Map, MapFrom, Default, Transform, MapWith, Ignore } from './core';

// Export types (MapperOptions for decorator configuration)
export type { MapperOptions, PropertyMapping, MapperMetadata } from './metadata';

// Export helper functions for type-safe mapper instantiation (RECOMMENDED API)
export {
  createMapper,
  plainToInstance,
  plainToClass,
  plainToInstanceArray,
  plainToClassArray,
  tryPlainToInstance,
  tryPlainToInstanceArray,
  getMapper,
} from './functions';

export type { TransformOptions } from './functions';

// Internal types - not part of public API
// IMapper and MapperMethods are used internally by the decorator and helper functions

