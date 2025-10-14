/**
 * Decorator for setting serialization options on a route handler
 * Compatible with NestJS's @SerializeOptions decorator
 */

import { SetMetadata } from '@nestjs/common';
import { CLASS_SERIALIZER_OPTIONS, type ClassSerializerInterceptorOptions } from '../types';

/**
 * Sets serialization options for a specific route handler.
 * This decorator allows you to customize how the response is serialized.
 *
 * @param options - Serialization options
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @SerializeOptions({ excludeExtraneousValues: true, groups: ['user'] })
 *   findAll(): Promise<User[]> {
 *     return this.usersService.findAll();
 *   }
 * }
 * ```
 */
export const SerializeOptions = (options: ClassSerializerInterceptorOptions) =>
  SetMetadata(CLASS_SERIALIZER_OPTIONS, options);

