/**
 * om-data-mapper - High-performance object mapping library
 *
 * @example Decorator API (Recommended)
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
 *
 * @example Legacy API (Deprecated)
 * ```typescript
 * import { Mapper } from 'om-data-mapper';
 *
 * const mapper = Mapper.create<Source, Target>({
 *   name: 'firstName',
 * });
 *
 * const result = mapper.execute(source);
 * ```
 */

// Legacy API (deprecated but maintained for backward compatibility)
export * from './core/interfaces';
export * from './core/Mapper';

// Decorator API (recommended)
export {
  Mapper,
  Map,
  MapFrom,
  Default,
  Transform,
  MapWith,
  Ignore,
  type MapperOptions,
  type PropertyMapping,
  type MapperMetadata,
} from './decorators';

// Helper functions for type-safe mapper usage (recommended)
export {
  createMapper,
  plainToInstance,
  plainToClass,
  plainToInstanceArray,
  plainToClassArray,
  tryPlainToInstance,
  tryPlainToInstanceArray,
  getMapper,
  type TransformOptions,
} from './decorators';
