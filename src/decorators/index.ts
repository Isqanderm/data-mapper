/**
 * Decorator-based API for om-data-mapper
 * Using TC39 Stage 3 decorators
 */

// Export decorators with explicit names to avoid conflicts
export { Mapper as MapperDecorator, Map, MapFrom, Default, Transform, MapWith, Ignore } from './core';
export type { MapperOptions, PropertyMapping, MapperMetadata, IMapper, MapperMethods } from './metadata';

// Re-export Mapper decorator as default name for convenience
export { Mapper } from './core';

// Export helper functions for type-safe mapper instantiation
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

