/**
 * class-transformer compatibility layer for om-data-mapper
 * Using TC39 Stage 3 decorators
 *
 * This module provides a drop-in replacement for class-transformer with better performance.
 * Simply replace:
 *   import { plainToClass, Expose } from 'class-transformer';
 * with:
 *   import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';
 */

// Export decorators
export { Expose, Exclude, Type, Transform, TransformClassToPlain, TransformClassToClass, TransformPlainToClass } from './decorators';

// Export transformation functions
export {
  plainToClass,
  plainToInstance,
  plainToClassFromExist,
  classToPlain,
  instanceToPlain,
  classToClass,
  instanceToInstance,
  serialize,
  deserialize,
  deserializeArray,
} from './functions';

// Export types
export type {
  ClassTransformOptions,
  ExposeOptions,
  ExcludeOptions,
  TypeOptions,
  TypeHelpFunction,
  TypeHelpOptions,
  TransformFn,
  TransformFnParams,
  TransformationType,
  TransformationStrategy,
} from './types';

// Export metadata utilities (for advanced use cases)
export { getCompatMetadata, setCompatMetadata, updateCompatMetadata, shouldExposeProperty, getSourcePropertyName } from './metadata';
export type { PropertyMetadata, ClassMetadata } from './metadata';

