/**
 * NestJS Integration for om-data-mapper
 *
 * High-performance drop-in replacement for NestJS's ClassSerializerInterceptor.
 * Provides 17.28x faster serialization using om-data-mapper instead of class-transformer.
 *
 * @example
 * ```typescript
 * // Replace this:
 * import { ClassSerializerInterceptor } from '@nestjs/common';
 *
 * // With this:
 * import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';
 *
 * // Everything else stays the same!
 * app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
 * ```
 *
 * @packageDocumentation
 */

export { ClassSerializerInterceptor } from './interceptors/class-serializer.interceptor';
export { SerializeOptions } from './decorators/serialize-options.decorator';
export type { ClassSerializerInterceptorOptions } from './types';
export { CLASS_SERIALIZER_OPTIONS } from './types';

