/**
 * Type definitions for NestJS integration
 */

import type { ClassTransformOptions } from '../../compat/class-transformer/types';

/**
 * Options for ClassSerializerInterceptor
 * Compatible with NestJS's ClassSerializerInterceptor options
 */
export interface ClassSerializerInterceptorOptions extends ClassTransformOptions {
  /**
   * If true, the interceptor will transform the response even if it's not a class instance
   */
  transformPlainObjects?: boolean;
}

/**
 * Metadata key for serialization options
 */
export const CLASS_SERIALIZER_OPTIONS = 'class_serializer:options';

