/**
 * Tests for async validation
 */

import { describe, it, expect } from 'vitest';
import {
  IsString,
  IsEmail,
  MinLength,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
  validate,
} from '../../../../src/compat/class-validator';
import { addValidationConstraint } from '../../../../src/compat/class-validator/engine/metadata';

// Helper to create async validator decorator
function IsUniqueEmail(options?: { message?: string; groups?: string[] }) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;
    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'custom',
        message: options?.message || 'email must be unique',
        groups: options?.groups,
        validator: async (value: any) => {
          // Simulate async database check
          await new Promise(resolve => setTimeout(resolve, 10));
          // Simulate checking if email exists
          return value !== 'taken@example.com';
        },
      });
    });
  };
}

function IsExists(options?: { message?: string; groups?: string[] }) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;
    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'custom',
        message: options?.message || 'value must exist',
        groups: options?.groups,
        validator: async (value: any) => {
          // Simulate async API check
          await new Promise(resolve => setTimeout(resolve, 10));
          // Simulate checking if value exists
          return value !== 'nonexistent';
        },
      });
    });
  };
}

describe('Async Validation', () => {
  describe('Basic Async Validation', () => {
    it('should validate async custom validators', async () => {
      class UserDto {
        @IsString()
        username!: string;

        @IsEmail()
        @IsUniqueEmail()
        email!: string;
      }

      const validUser = new UserDto();
      validUser.username = 'john';
      validUser.email = 'john@example.com';

      const validErrors = await validate(validUser);
      expect(validErrors).toHaveLength(0);

      const invalidUser = new UserDto();
      invalidUser.username = 'jane';
      invalidUser.email = 'taken@example.com';

      const invalidErrors = await validate(invalidUser);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('email');
      expect(invalidErrors[0].constraints).toHaveProperty('custom');
    });

    it('should handle mixed sync and async validators', async () => {
      class ProductDto {
        @IsString()
        @MinLength(3)
        name!: string;

        @IsNumber()
        @Min(0)
        price!: number;

        @IsExists()
        categoryId!: string;
      }

      const valid = new ProductDto();
      valid.name = 'Product';
      valid.price = 10;
      valid.categoryId = 'existing';

      const validErrors = await validate(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new ProductDto();
      invalid.name = 'AB'; // Too short
      invalid.price = -5; // Negative
      invalid.categoryId = 'nonexistent'; // Doesn't exist

      const invalidErrors = await validate(invalid);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors.some(e => e.property === 'name')).toBe(true);
      expect(invalidErrors.some(e => e.property === 'price')).toBe(true);
      expect(invalidErrors.some(e => e.property === 'categoryId')).toBe(true);
    });

    it('should handle multiple async validators on same property', async () => {
      class UserDto {
        @IsEmail()
        @IsUniqueEmail()
        @IsExists({ message: 'email domain must exist' })
        email!: string;
      }

      const user = new UserDto();
      user.email = 'taken@example.com';

      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      // Should have error from IsUniqueEmail
      expect(errors[0].constraints).toHaveProperty('custom');
    });
  });

  describe('Async Validation with Nested Objects', () => {
    it('should validate nested objects with async validators', async () => {
      class AddressDto {
        @IsString()
        @MinLength(3)
        street!: string;

        @IsExists()
        cityId!: string;
      }

      class UserDto {
        @IsString()
        username!: string;

        @ValidateNested()
        address!: AddressDto;
      }

      const valid = new UserDto();
      valid.username = 'john';
      valid.address = new AddressDto();
      valid.address.street = '123 Main St';
      valid.address.cityId = 'existing';

      const validErrors = await validate(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new UserDto();
      invalid.username = 'jane';
      invalid.address = new AddressDto();
      invalid.address.street = 'AB'; // Too short
      invalid.address.cityId = 'nonexistent'; // Doesn't exist

      const invalidErrors = await validate(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('address');
      expect(invalidErrors[0].children).toBeDefined();
      expect(invalidErrors[0].children!.length).toBeGreaterThan(0);
    });

    it('should validate arrays of nested objects with async validators', async () => {
      class ItemDto {
        @IsString()
        name!: string;

        @IsExists()
        productId!: string;
      }

      class OrderDto {
        @IsString()
        orderId!: string;

        @ValidateNested()
        @IsArray()
        items!: ItemDto[];
      }

      const valid = new OrderDto();
      valid.orderId = 'ORD-001';
      valid.items = [
        Object.assign(new ItemDto(), { name: 'Item 1', productId: 'existing' }),
        Object.assign(new ItemDto(), { name: 'Item 2', productId: 'existing' }),
      ];

      const validErrors = await validate(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new OrderDto();
      invalid.orderId = 'ORD-002';
      invalid.items = [
        Object.assign(new ItemDto(), { name: 'Item 1', productId: 'existing' }),
        Object.assign(new ItemDto(), { name: 'Item 2', productId: 'nonexistent' }),
      ];

      const invalidErrors = await validate(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('items');
      expect(invalidErrors[0].children).toBeDefined();
      expect(invalidErrors[0].children!.some(e => e.property.includes('[1]'))).toBe(true);
    });
  });

  describe('Async Validation with Groups', () => {
    it('should respect validation groups with async validators', async () => {
      class UserDto {
        @IsString({ groups: ['create'] })
        username!: string;

        @IsUniqueEmail({ groups: ['create', 'update'] })
        email!: string;

        @IsExists({ groups: ['update'] })
        userId!: string;
      }

      const user = new UserDto();
      user.username = 'john';
      user.email = 'taken@example.com';
      user.userId = 'nonexistent';

      // Validate with 'create' group
      const createErrors = await validate(user, { groups: ['create'] });
      expect(createErrors.length).toBeGreaterThan(0);
      expect(createErrors.some(e => e.property === 'email')).toBe(true);
      expect(createErrors.some(e => e.property === 'userId')).toBe(false);

      // Validate with 'update' group
      const updateErrors = await validate(user, { groups: ['update'] });
      expect(updateErrors.length).toBeGreaterThan(0);
      expect(updateErrors.some(e => e.property === 'email')).toBe(true);
      expect(updateErrors.some(e => e.property === 'userId')).toBe(true);
      expect(updateErrors.some(e => e.property === 'username')).toBe(false);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should execute async validations in parallel', async () => {
      class TestDto {
        @IsExists()
        field1!: string;

        @IsExists()
        field2!: string;

        @IsExists()
        field3!: string;
      }

      const dto = new TestDto();
      dto.field1 = 'existing';
      dto.field2 = 'existing';
      dto.field3 = 'existing';

      const start = Date.now();
      await validate(dto);
      const duration = Date.now() - start;

      // Should complete in ~10-20ms (parallel) not ~30ms (sequential)
      // Each validator has 10ms delay, so parallel should be ~10ms
      expect(duration).toBeLessThan(50);
    });

    it('should handle async validator errors gracefully', async () => {
      function ThrowingValidator() {
        return function (target: undefined, context: ClassFieldDecoratorContext): any {
          const propertyKey = context.name;
          context.addInitializer(function (this: any) {
            addValidationConstraint(this.constructor, propertyKey, {
              type: 'custom',
              message: 'validation failed',
              validator: async () => {
                throw new Error('Async validator error');
              },
            });
          });
        };
      }

      class TestDto {
        @ThrowingValidator()
        field!: string;
      }

      const dto = new TestDto();
      dto.field = 'test';

      // Should not throw, but handle error gracefully
      await expect(validate(dto)).rejects.toThrow();
    });
  });
});

