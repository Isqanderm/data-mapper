/**
 * Integration tests for NestJS ClassSerializerInterceptor
 */

import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { ClassSerializerInterceptor } from '../../../src/integrations/nestjs/interceptors/class-serializer.interceptor';
import { Expose, Exclude, Type, Transform } from '../../../src/compat/class-transformer/decorators';
import { CLASS_SERIALIZER_OPTIONS } from '../../../src/integrations/nestjs/types';

// Mock NestJS dependencies
const mockReflector = {
  getAllAndOverride: vi.fn(),
};

const mockExecutionContext = {
  getHandler: vi.fn(),
  getClass: vi.fn(),
} as any;

const mockCallHandler = {
  handle: vi.fn(),
};

// Test DTOs
class UserDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Exclude()
  password!: string;

  @Expose()
  email!: string;
}

class AddressDto {
  @Expose()
  street!: string;

  @Expose()
  city!: string;
}

class UserWithAddressDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Type(() => AddressDto)
  @Expose()
  address!: AddressDto;

  @Exclude()
  password!: string;
}

class UserWithTransformDto {
  @Expose()
  id!: number;

  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name!: string;
}

describe('ClassSerializerInterceptor', () => {
  it('should serialize a simple class instance', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const user = new UserDto();
    user.id = 1;
    user.name = 'John Doe';
    user.password = 'secret123';
    user.email = 'john@example.com';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(result).not.toHaveProperty('password');
  });

  it('should serialize an array of class instances', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const user1 = new UserDto();
    user1.id = 1;
    user1.name = 'John Doe';
    user1.password = 'secret123';
    user1.email = 'john@example.com';

    const user2 = new UserDto();
    user2.id = 2;
    user2.name = 'Jane Smith';
    user2.password = 'secret456';
    user2.email = 'jane@example.com';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of([user1, user2]));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ]);
  });

  it('should serialize nested class instances with @Type decorator', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const address = new AddressDto();
    address.street = '123 Main St';
    address.city = 'New York';

    const user = new UserWithAddressDto();
    user.id = 1;
    user.name = 'John Doe';
    user.address = address;
    user.password = 'secret123';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'New York',
      },
    });
    expect(result).not.toHaveProperty('password');
  });

  it('should apply @Transform decorator', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const user = new UserWithTransformDto();
    user.id = 1;
    user.name = 'john doe';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual({
      id: 1,
      name: 'JOHN DOE',
    });
  });

  it('should respect excludeExtraneousValues option from context', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const user = new UserDto();
    user.id = 1;
    user.name = 'John Doe';
    user.password = 'secret123';
    user.email = 'john@example.com';

    mockReflector.getAllAndOverride.mockReturnValue({
      excludeExtraneousValues: true,
    });
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    // With excludeExtraneousValues, only @Expose properties should be included
    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(result).not.toHaveProperty('password');
  });

  it('should use default options from constructor', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any, {
      excludeExtraneousValues: true,
    });

    const user = new UserDto();
    user.id = 1;
    user.name = 'John Doe';
    user.password = 'secret123';
    user.email = 'john@example.com';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should not serialize null values', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(null));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toBeNull();
  });

  it('should not serialize undefined values', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(undefined));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toBeUndefined();
  });

  it('should not serialize primitive types', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of('plain string'));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toBe('plain string');
  });

  it('should not serialize plain objects by default', async () => {
    const interceptor = new ClassSerializerInterceptor(mockReflector as any);

    const plainObject = {
      id: 1,
      name: 'John Doe',
      password: 'secret123',
    };

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(plainObject));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    // Plain objects should be returned as-is by default
    expect(result).toEqual(plainObject);
  });

  it('should work with dependency injection (APP_INTERCEPTOR pattern)', async () => {
    // This test simulates how NestJS creates the interceptor when using APP_INTERCEPTOR
    const reflector = mockReflector as any;
    const interceptor = new ClassSerializerInterceptor(reflector);

    const user = new UserDto();
    user.id = 1;
    user.name = 'John Doe';
    user.password = 'secret123';
    user.email = 'john@example.com';

    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockCallHandler.handle.mockReturnValue(of(user));

    const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler as any);

    const result = await new Promise((resolve) => {
      result$.subscribe((data) => resolve(data));
    });

    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(result).not.toHaveProperty('password');
  });
});

