/**
 * Integration tests for class-validator and class-transformer compatibility layers
 *
 * These tests verify that the validation system (class-validator) and mapping system
 * (class-transformer) work seamlessly together in om-data-mapper.
 */

import { describe, it, expect } from 'vitest';

// Import class-transformer functions and decorators
import {
  plainToClass,
  plainToInstance,
  classToPlain,
  serialize,
  deserialize,
  Expose,
  Exclude,
  Type,
  Transform,
} from '../../../src/compat/class-transformer';

// Import class-validator functions and decorators
import {
  validate,
  validateSync,
  IsString,
  IsEmail,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  MinLength,
  Min,
  Max,
  IsOptional,
  IsDefined,
  ValidateNested,
} from '../../../src/compat/class-validator';

describe('Integration: Validation and Mapping', () => {
  describe('Scenario 1: Validate then Transform', () => {
    it('should validate input data then transform to class instance', async () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsInt()
        @Min(18)
        age!: number;

        @Exclude()
        password!: string;
      }

      // Valid input
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        password: 'secret123',
      };

      // Transform to class instance
      const user = plainToClass(UserDto, validInput, { excludeExtraneousValues: true });

      // Validate the transformed instance
      const errors = await validate(user);
      expect(errors).toHaveLength(0);

      // Verify transformation worked correctly
      expect(user).toBeInstanceOf(UserDto);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(25);
      expect(user.password).toBeUndefined(); // Excluded
    });

    it('should fail validation after transformation when data is invalid', async () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsInt()
        @Min(18)
        age!: number;
      }

      // Invalid input
      const invalidInput = {
        name: 'Jo', // Too short
        email: 'not-an-email',
        age: 15, // Too young
      };

      // Transform to class instance
      const user = plainToClass(UserDto, invalidInput);

      // Validate the transformed instance
      const errors = await validate(user);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'name')).toBe(true);
      expect(errors.some(e => e.property === 'email')).toBe(true);
      expect(errors.some(e => e.property === 'age')).toBe(true);
    });
  });

  describe('Scenario 2: Transform then Validate', () => {
    it('should transform plain object to class instance then validate', () => {
      class ProductDto {
        @Expose()
        @IsString()
        @MinLength(2)
        name!: string;

        @Expose()
        @IsNumber()
        @Min(0)
        price!: number;

        @Expose()
        @IsBoolean()
        inStock!: boolean;
      }

      const plainData = {
        name: 'Laptop',
        price: 999.99,
        inStock: true,
      };

      // Transform first
      const product = plainToInstance(ProductDto, plainData);
      expect(product).toBeInstanceOf(ProductDto);

      // Then validate
      const errors = validateSync(product);
      expect(errors).toHaveLength(0);
    });

    it('should validate transformed data with type coercion', () => {
      class OrderDto {
        @Expose()
        @IsString()
        orderId!: string;

        @Expose()
        @IsNumber()
        @Min(1)
        quantity!: number;

        @Expose()
        @Transform(({ value }) => new Date(value))
        @IsDefined()
        orderDate!: Date;
      }

      const plainData = {
        orderId: 'ORD-12345',
        quantity: 5,
        orderDate: '2025-10-15T00:00:00Z',
      };

      // Transform with custom transformation
      const order = plainToClass(OrderDto, plainData);

      // Validate
      const errors = validateSync(order);
      expect(errors).toHaveLength(0);
      expect(order.orderDate).toBeInstanceOf(Date);
    });
  });

  describe('Scenario 3: Nested Objects with Both Decorators', () => {
    it('should validate and transform nested objects', async () => {
      class AddressDto {
        @Expose()
        @IsString()
        @MinLength(3)
        street!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        city!: string;

        @Expose()
        @IsString()
        zipCode!: string;
      }

      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @Type(() => AddressDto)
        @ValidateNested()
        address!: AddressDto;
      }

      const plainData = {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: '10001',
        },
      };

      // Transform nested objects
      const user = plainToClass(UserDto, plainData);
      expect(user).toBeInstanceOf(UserDto);
      expect(user.address).toBeInstanceOf(AddressDto);

      // Validate including nested objects
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it('should report nested validation errors correctly', () => {
      class AddressDto {
        @Expose()
        @IsString()
        @MinLength(3)
        street!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        city!: string;
      }

      class UserDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @Type(() => AddressDto)
        @ValidateNested()
        address!: AddressDto;
      }

      const plainData = {
        name: 'John Doe',
        address: {
          street: 'AB', // Too short
          city: 'X', // Too short
        },
      };

      // Transform
      const user = plainToClass(UserDto, plainData);

      // Validate
      const errors = validateSync(user);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('address');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children!.length).toBe(2);
    });

    it('should handle arrays of nested objects with validation and transformation', async () => {
      class ItemDto {
        @Expose()
        @IsString()
        @MinLength(2)
        name!: string;

        @Expose()
        @IsNumber()
        @Min(0)
        price!: number;

        @Expose()
        @IsInt()
        @Min(1)
        quantity!: number;
      }

      class OrderDto {
        @Expose()
        @IsString()
        orderId!: string;

        @Expose()
        @Type(() => ItemDto)
        @ValidateNested()
        @IsArray()
        items!: ItemDto[];
      }

      const plainData = {
        orderId: 'ORD-001',
        items: [
          { name: 'Laptop', price: 999.99, quantity: 2 },
          { name: 'Mouse', price: 29.99, quantity: 5 },
        ],
      };

      // Transform array of nested objects
      const order = plainToClass(OrderDto, plainData);
      expect(order).toBeInstanceOf(OrderDto);
      expect(order.items).toHaveLength(2);
      expect(order.items[0]).toBeInstanceOf(ItemDto);
      expect(order.items[1]).toBeInstanceOf(ItemDto);

      // Validate
      const errors = await validate(order);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Scenario 4: Error Handling', () => {
    it('should report validation errors when transformation succeeds but validation fails', () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(5)
        username!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsInt()
        @Min(0)
        @Max(150)
        age!: number;
      }

      const invalidData = {
        username: 'abc', // Too short
        email: 'invalid-email',
        age: 200, // Too high
      };

      // Transformation succeeds (creates instance)
      const user = plainToClass(UserDto, invalidData);
      expect(user).toBeInstanceOf(UserDto);

      // But validation fails
      const errors = validateSync(user);
      expect(errors.length).toBe(3);

      const usernameError = errors.find(e => e.property === 'username');
      expect(usernameError).toBeDefined();
      expect(usernameError!.constraints).toHaveProperty('minLength');

      const emailError = errors.find(e => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError!.constraints).toHaveProperty('isEmail');

      const ageError = errors.find(e => e.property === 'age');
      expect(ageError).toBeDefined();
      expect(ageError!.constraints).toHaveProperty('max');
    });

    it('should handle type mismatches gracefully', () => {
      class ProductDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @IsNumber()
        price!: number;
      }

      const invalidData = {
        name: 12345, // Should be string
        price: 'not-a-number', // Should be number
      };

      // Transform
      const product = plainToClass(ProductDto, invalidData);

      // Validate - should catch type errors
      const errors = validateSync(product);
      expect(errors.length).toBe(2);
      expect(errors.some(e => e.property === 'name')).toBe(true);
      expect(errors.some(e => e.property === 'price')).toBe(true);
    });

    it('should validate nested objects and report all errors', () => {
      class ContactDto {
        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsString()
        @MinLength(10)
        phone!: string;
      }

      class PersonDto {
        @Expose()
        @IsString()
        @MinLength(2)
        name!: string;

        @Expose()
        @Type(() => ContactDto)
        @ValidateNested()
        contact!: ContactDto;
      }

      const invalidData = {
        name: 'A', // Too short
        contact: {
          email: 'bad-email',
          phone: '123', // Too short
        },
      };

      const person = plainToClass(PersonDto, invalidData);
      const errors = validateSync(person);

      // Should have error for name and nested contact errors
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'name');
      expect(nameError).toBeDefined();

      const contactError = errors.find(e => e.property === 'contact');
      expect(contactError).toBeDefined();
      expect(contactError!.children).toBeDefined();
      expect(contactError!.children!.length).toBe(2);
    });
  });

  describe('Scenario 5: Optional Fields', () => {
    it('should handle @IsOptional with @Expose correctly', async () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsOptional()
        @IsEmail()
        email?: string;

        @Expose()
        @IsOptional()
        @IsInt()
        @Min(0)
        age?: number;
      }

      // Data without optional fields
      const dataWithoutOptional = {
        name: 'John Doe',
      };

      const user1 = plainToClass(UserDto, dataWithoutOptional);
      const errors1 = await validate(user1);
      expect(errors1).toHaveLength(0);
      expect(user1.email).toBeUndefined();
      expect(user1.age).toBeUndefined();

      // Data with optional fields
      const dataWithOptional = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 30,
      };

      const user2 = plainToClass(UserDto, dataWithOptional);
      const errors2 = await validate(user2);
      expect(errors2).toHaveLength(0);
      expect(user2.email).toBe('jane@example.com');
      expect(user2.age).toBe(30);
    });

    it('should validate optional fields when provided but invalid', () => {
      class ProductDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @IsOptional()
        @IsString()
        @MinLength(10)
        description?: string;

        @Expose()
        @IsOptional()
        @IsNumber()
        @Min(0)
        price?: number;
      }

      const invalidOptionalData = {
        name: 'Product',
        description: 'Short', // Too short
        price: -10, // Negative
      };

      const product = plainToClass(ProductDto, invalidOptionalData);
      const errors = validateSync(product);

      expect(errors.length).toBe(2);
      expect(errors.some(e => e.property === 'description')).toBe(true);
      expect(errors.some(e => e.property === 'price')).toBe(true);
    });

    it('should handle @IsOptional with @Exclude correctly', () => {
      class UserDto {
        @Expose()
        @IsString()
        name!: string;

        @Exclude()
        @IsOptional()
        @IsString()
        internalNote?: string;
      }

      const data = {
        name: 'John',
        internalNote: 'This should be excluded',
      };

      const user = plainToClass(UserDto, data, { excludeExtraneousValues: true });

      // internalNote should be excluded during transformation
      expect(user.internalNote).toBeUndefined();

      // Validation should pass (no required fields missing)
      const errors = validateSync(user);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Scenario 6: Validation Groups with Transformation', () => {
    it('should validate with groups after transformation', () => {
      class UserDto {
        @Expose()
        @IsString({ groups: ['create', 'update'] })
        @MinLength(3, { groups: ['create', 'update'] })
        username!: string;

        @Expose()
        @IsEmail({ groups: ['create', 'update'] })
        email!: string;

        @Expose()
        @IsString({ groups: ['create'] })
        @MinLength(8, { groups: ['create'] })
        password!: string;

        @Expose()
        @IsOptional({ groups: ['update'] })
        @IsInt({ groups: ['update'] })
        @Min(0, { groups: ['update'] })
        age?: number;
      }

      const createData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'secret123',
      };

      // Transform for create operation
      const createUser = plainToClass(UserDto, createData);

      // Validate with 'create' group
      const createErrors = validateSync(createUser, { groups: ['create'] });
      expect(createErrors).toHaveLength(0);

      const updateData = {
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
      };

      // Transform for update operation
      const updateUser = plainToClass(UserDto, updateData);

      // Validate with 'update' group (password not required)
      const updateErrors = validateSync(updateUser, { groups: ['update'] });
      expect(updateErrors).toHaveLength(0);
    });

    it('should combine @Expose groups with validation groups', () => {
      class UserDto {
        @Expose()
        @IsString()
        id!: string;

        @Expose({ groups: ['admin'] })
        @IsEmail({ groups: ['admin'] })
        email!: string;

        @Expose({ groups: ['admin', 'user'] })
        @IsString({ groups: ['admin', 'user'] })
        name!: string;

        @Expose({ groups: ['admin'] })
        @IsOptional({ groups: ['admin'] })
        @IsString({ groups: ['admin'] })
        role?: string;
      }

      const data = {
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'administrator',
      };

      // Transform with 'admin' group - should include all fields
      const adminUser = plainToClass(UserDto, data, { groups: ['admin'] });
      expect(adminUser.id).toBe('user-123');
      expect(adminUser.email).toBe('admin@example.com');
      expect(adminUser.name).toBe('Admin User');
      expect(adminUser.role).toBe('administrator');

      // Validate with 'admin' group
      const adminErrors = validateSync(adminUser, { groups: ['admin'] });
      expect(adminErrors).toHaveLength(0);

      // Transform with 'user' group - should exclude admin-only fields
      const regularUser = plainToClass(UserDto, data, { groups: ['user'] });
      expect(regularUser.id).toBe('user-123');
      expect(regularUser.email).toBeUndefined(); // admin only
      expect(regularUser.name).toBe('Admin User');
      expect(regularUser.role).toBeUndefined(); // admin only

      // Validate with 'user' group
      const userErrors = validateSync(regularUser, { groups: ['user'] });
      expect(userErrors).toHaveLength(0);
    });

    it('should handle validation group failures with transformation groups', () => {
      class ProductDto {
        @Expose({ groups: ['create', 'update'] })
        @IsString({ groups: ['create', 'update'] })
        @MinLength(3, { groups: ['create'] })
        name!: string;

        @Expose({ groups: ['create', 'update'] })
        @IsNumber({ groups: ['create', 'update'] })
        @Min(0, { groups: ['create', 'update'] })
        price!: number;

        @Expose({ groups: ['admin'] })
        @IsNumber({ groups: ['admin'] })
        cost!: number;
      }

      const invalidData = {
        name: 'AB', // Too short for 'create' group
        price: -10, // Negative
        cost: 5,
      };

      // Transform with 'create' group
      const product = plainToClass(ProductDto, invalidData, { groups: ['create'] });
      expect(product.name).toBe('AB');
      expect(product.price).toBe(-10);
      expect(product.cost).toBeUndefined(); // Not in 'create' group

      // Validate with 'create' group - should fail
      const errors = validateSync(product, { groups: ['create'] });
      expect(errors.length).toBe(2);
      expect(errors.some(e => e.property === 'name')).toBe(true);
      expect(errors.some(e => e.property === 'price')).toBe(true);
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle comprehensive e-commerce order workflow', async () => {
      class ShippingAddressDto {
        @Expose()
        @IsString()
        @MinLength(5)
        street!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        city!: string;

        @Expose()
        @IsString()
        state!: string;

        @Expose()
        @IsString()
        zipCode!: string;

        @Expose()
        @IsString()
        country!: string;
      }

      class CustomerDto {
        @Expose()
        @IsString()
        @MinLength(2)
        firstName!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        lastName!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsOptional()
        @IsString()
        @MinLength(10)
        phone?: string;
      }

      class OrderItemDto {
        @Expose()
        @IsString()
        productId!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        productName!: string;

        @Expose()
        @IsNumber()
        @Min(0)
        price!: number;

        @Expose()
        @IsInt()
        @Min(1)
        quantity!: number;

        @Expose()
        @Transform(({ obj }) => obj.price * obj.quantity)
        @IsNumber()
        @Min(0)
        total!: number;
      }

      class OrderDto {
        @Expose()
        @IsString()
        orderId!: string;

        @Expose()
        @Type(() => CustomerDto)
        @ValidateNested()
        customer!: CustomerDto;

        @Expose()
        @Type(() => OrderItemDto)
        @ValidateNested()
        @IsArray()
        items!: OrderItemDto[];

        @Expose()
        @Type(() => ShippingAddressDto)
        @ValidateNested()
        shippingAddress!: ShippingAddressDto;

        @Expose()
        @Transform(({ obj }) => obj.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))
        @IsNumber()
        @Min(0)
        totalAmount!: number;

        @Expose()
        @IsString()
        status!: string;
      }

      // Simulate API input
      const apiInput = {
        orderId: 'ORD-2025-001',
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
        },
        items: [
          {
            productId: 'PROD-001',
            productName: 'Laptop',
            price: 999.99,
            quantity: 1,
            total: 999.99,
          },
          {
            productId: 'PROD-002',
            productName: 'Mouse',
            price: 29.99,
            quantity: 2,
            total: 59.98,
          },
        ],
        shippingAddress: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        totalAmount: 1059.97,
        status: 'pending',
      };

      // Step 1: Transform API input to DTO
      const order = plainToClass(OrderDto, apiInput);
      expect(order).toBeInstanceOf(OrderDto);
      expect(order.customer).toBeInstanceOf(CustomerDto);
      expect(order.items).toHaveLength(2);
      expect(order.items[0]).toBeInstanceOf(OrderItemDto);
      expect(order.shippingAddress).toBeInstanceOf(ShippingAddressDto);

      // Step 2: Validate the order
      const errors = await validate(order);
      expect(errors).toHaveLength(0);

      // Step 3: Transform to response (exclude sensitive data)
      const response = classToPlain(order);
      expect(response.orderId).toBe('ORD-2025-001');
      expect(response.customer.email).toBe('john.doe@example.com');
      expect(response.totalAmount).toBe(1059.97);
    });

    it('should validate invalid e-commerce order and report all errors', () => {
      class ShippingAddressDto {
        @Expose()
        @IsString()
        @MinLength(5)
        street!: string;

        @Expose()
        @IsString()
        @MinLength(2)
        city!: string;
      }

      class CustomerDto {
        @Expose()
        @IsString()
        @MinLength(2)
        firstName!: string;

        @Expose()
        @IsEmail()
        email!: string;
      }

      class OrderItemDto {
        @Expose()
        @IsString()
        productName!: string;

        @Expose()
        @IsNumber()
        @Min(0)
        price!: number;
      }

      class OrderDto {
        @Expose()
        @IsString()
        orderId!: string;

        @Expose()
        @Type(() => CustomerDto)
        @ValidateNested()
        customer!: CustomerDto;

        @Expose()
        @Type(() => OrderItemDto)
        @ValidateNested()
        @IsArray()
        items!: OrderItemDto[];

        @Expose()
        @Type(() => ShippingAddressDto)
        @ValidateNested()
        shippingAddress!: ShippingAddressDto;
      }

      const invalidOrder = {
        orderId: 'ORD-001',
        customer: {
          firstName: 'J', // Too short
          email: 'invalid-email',
        },
        items: [
          {
            productName: 'Product',
            price: -10, // Negative
          },
        ],
        shippingAddress: {
          street: 'St', // Too short
          city: 'X', // Too short
        },
      };

      const order = plainToClass(OrderDto, invalidOrder);
      const errors = validateSync(order);

      // Should have errors for nested objects
      expect(errors.length).toBeGreaterThan(0);

      const customerError = errors.find(e => e.property === 'customer');
      expect(customerError).toBeDefined();
      expect(customerError!.children).toBeDefined();

      const itemsError = errors.find(e => e.property === 'items');
      expect(itemsError).toBeDefined();

      const addressError = errors.find(e => e.property === 'shippingAddress');
      expect(addressError).toBeDefined();
      expect(addressError!.children).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested objects (3+ levels)', async () => {
      class CountryDto {
        @Expose()
        @IsString()
        @MinLength(2)
        name!: string;

        @Expose()
        @IsString()
        code!: string;
      }

      class StateDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @Type(() => CountryDto)
        @ValidateNested()
        country!: CountryDto;
      }

      class CityDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @Type(() => StateDto)
        @ValidateNested()
        state!: StateDto;
      }

      class AddressDto {
        @Expose()
        @IsString()
        street!: string;

        @Expose()
        @Type(() => CityDto)
        @ValidateNested()
        city!: CityDto;
      }

      class PersonDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @Type(() => AddressDto)
        @ValidateNested()
        address!: AddressDto;
      }

      const deepData = {
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: {
            name: 'New York',
            state: {
              name: 'New York',
              country: {
                name: 'United States',
                code: 'US',
              },
            },
          },
        },
      };

      // Transform deeply nested structure
      const person = plainToClass(PersonDto, deepData);
      expect(person).toBeInstanceOf(PersonDto);
      expect(person.address).toBeInstanceOf(AddressDto);
      expect(person.address.city).toBeInstanceOf(CityDto);
      expect(person.address.city.state).toBeInstanceOf(StateDto);
      expect(person.address.city.state.country).toBeInstanceOf(CountryDto);

      // Validate deeply nested structure
      const errors = await validate(person);
      expect(errors).toHaveLength(0);
    });

    it('should handle empty arrays with validation and transformation', () => {
      class ItemDto {
        @Expose()
        @IsString()
        name!: string;
      }

      class ContainerDto {
        @Expose()
        @IsString()
        id!: string;

        @Expose()
        @Type(() => ItemDto)
        @ValidateNested()
        @IsArray()
        items!: ItemDto[];
      }

      const dataWithEmptyArray = {
        id: 'container-1',
        items: [],
      };

      const container = plainToClass(ContainerDto, dataWithEmptyArray);
      expect(container.items).toEqual([]);

      const errors = validateSync(container);
      expect(errors).toHaveLength(0);
    });

    it('should handle null values correctly', () => {
      class UserDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @IsOptional()
        @IsString()
        nickname?: string | null;

        @Expose()
        @IsOptional()
        @IsNumber()
        age?: number | null;
      }

      const dataWithNulls = {
        name: 'John',
        nickname: null,
        age: null,
      };

      const user = plainToClass(UserDto, dataWithNulls);
      expect(user.nickname).toBeNull();
      expect(user.age).toBeNull();

      const errors = validateSync(user);
      expect(errors).toHaveLength(0);
    });

    it('should work with @Transform and validation decorators together', () => {
      class UserDto {
        @Expose()
        @Transform(({ value }) => value.trim().toLowerCase())
        @IsEmail()
        email!: string;

        @Expose()
        @Transform(({ value }) => value.trim())
        @IsString()
        @MinLength(3)
        username!: string;

        @Expose()
        @Transform(({ value }) => Math.abs(value))
        @IsNumber()
        @Min(0)
        @Max(150)
        age!: number;
      }

      const data = {
        email: '  JOHN@EXAMPLE.COM  ',
        username: '  johndoe  ',
        age: -25, // Will be transformed to 25
      };

      const user = plainToClass(UserDto, data);
      expect(user.email).toBe('john@example.com');
      expect(user.username).toBe('johndoe');
      expect(user.age).toBe(25);

      const errors = validateSync(user);
      expect(errors).toHaveLength(0);
    });

    it('should handle transformation errors gracefully', () => {
      class DateDto {
        @Expose()
        @IsString()
        id!: string;

        @Expose()
        @Transform(({ value }) => {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return value; // Return original if invalid
          }
          return date;
        })
        @IsDefined()
        date!: Date | string;
      }

      const invalidDateData = {
        id: 'date-1',
        date: 'invalid-date-string',
      };

      const dto = plainToClass(DateDto, invalidDateData);
      expect(dto.date).toBe('invalid-date-string');

      // Validation should still work
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0); // IsDefined passes, date is defined
    });
  });

  describe('Performance and Caching', () => {
    it('should efficiently handle multiple transformations and validations', async () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsInt()
        @Min(0)
        age!: number;
      }

      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      // Perform multiple transformations and validations
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const user = plainToClass(UserDto, userData);
        const errors = await validate(user);
        expect(errors).toHaveLength(0);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably fast (adjust threshold as needed)
      // This is more of a smoke test than a strict performance test
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 iterations
    });

    it('should handle batch transformations and validations efficiently', async () => {
      class ProductDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @IsNumber()
        @Min(0)
        price!: number;
      }

      const products = Array.from({ length: 50 }, (_, i) => ({
        name: `Product ${i}`,
        price: i * 10,
      }));

      // Transform all products
      const productDtos = plainToClass(ProductDto, products);
      expect(productDtos).toHaveLength(50);
      expect(productDtos[0]).toBeInstanceOf(ProductDto);

      // Validate all products
      const validationPromises = productDtos.map(p => validate(p));
      const results = await Promise.all(validationPromises);

      results.forEach(errors => {
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('Additional Integration Patterns', () => {
    it('should validate plain object structure after classToPlain', () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Exclude()
        password!: string;
      }

      const user = new UserDto();
      user.name = 'John Doe';
      user.email = 'john@example.com';
      user.password = 'secret123';

      // Transform to plain object
      const plain = classToPlain(user);
      expect(plain.name).toBe('John Doe');
      expect(plain.email).toBe('john@example.com');
      expect(plain.password).toBeUndefined();

      // Transform back to class and validate
      const userAgain = plainToClass(UserDto, plain);
      const errors = validateSync(userAgain);
      expect(errors).toHaveLength(0);
    });

    it('should work with serialize and deserialize', async () => {
      class UserDto {
        @Expose()
        @IsString()
        @MinLength(3)
        name!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsInt()
        @Min(18)
        age!: number;
      }

      const user = new UserDto();
      user.name = 'John Doe';
      user.email = 'john@example.com';
      user.age = 25;

      // Validate before serialization
      const errors1 = await validate(user);
      expect(errors1).toHaveLength(0);

      // Serialize to JSON
      const json = serialize(user);
      expect(typeof json).toBe('string');
      expect(json).toContain('John Doe');

      // Deserialize from JSON
      const deserialized = deserialize(UserDto, json);
      expect(deserialized).toBeInstanceOf(UserDto);

      // Validate after deserialization
      const errors2 = await validate(deserialized);
      expect(errors2).toHaveLength(0);
      expect(deserialized.name).toBe('John Doe');
      expect(deserialized.email).toBe('john@example.com');
      expect(deserialized.age).toBe(25);
    });

    it('should preserve validation through transformation cycles', () => {
      class AddressDto {
        @Expose()
        @IsString()
        @MinLength(3)
        street!: string;

        @Expose()
        @IsString()
        city!: string;
      }

      class UserDto {
        @Expose()
        @IsString()
        name!: string;

        @Expose()
        @Type(() => AddressDto)
        @ValidateNested()
        address!: AddressDto;
      }

      const originalData = {
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      };

      // Cycle 1: Plain -> Class -> Validate
      const user1 = plainToClass(UserDto, originalData);
      const errors1 = validateSync(user1);
      expect(errors1).toHaveLength(0);

      // Cycle 2: Class -> Plain -> Class -> Validate
      const plain = classToPlain(user1);
      const user2 = plainToClass(UserDto, plain);
      const errors2 = validateSync(user2);
      expect(errors2).toHaveLength(0);

      // Verify data integrity
      expect(user2.name).toBe('John Doe');
      expect(user2.address.street).toBe('123 Main St');
      expect(user2.address.city).toBe('New York');
    });

    it('should handle complex workflow with multiple DTOs', async () => {
      // Input DTO
      class CreateUserInputDto {
        @Expose()
        @IsString()
        @MinLength(3)
        username!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @IsString()
        @MinLength(8)
        password!: string;
      }

      // Output DTO (without password)
      class UserResponseDto {
        @Expose()
        @IsString()
        id!: string;

        @Expose()
        @IsString()
        username!: string;

        @Expose()
        @IsEmail()
        email!: string;

        @Expose()
        @Transform(({ value }) => new Date(value))
        createdAt!: Date;
      }

      // Step 1: Receive and validate input
      const inputData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'secret123',
      };

      const input = plainToClass(CreateUserInputDto, inputData);
      const inputErrors = await validate(input);
      expect(inputErrors).toHaveLength(0);

      // Step 2: Simulate processing and create response
      const responseData = {
        id: 'user-123',
        username: input.username,
        email: input.email,
        createdAt: new Date().toISOString(),
      };

      const response = plainToClass(UserResponseDto, responseData);
      const responseErrors = await validate(response);
      expect(responseErrors).toHaveLength(0);

      // Step 3: Verify response structure
      expect(response.id).toBe('user-123');
      expect(response.username).toBe('johndoe');
      expect(response.email).toBe('john@example.com');
      expect(response.createdAt).toBeInstanceOf(Date);

      // Step 4: Serialize response
      const jsonResponse = classToPlain(response);
      expect(jsonResponse.id).toBe('user-123');
      expect(jsonResponse.username).toBe('johndoe');
      expect(jsonResponse.email).toBe('john@example.com');
    });

    it('should handle validation errors through multiple transformation steps', () => {
      class StepOneDto {
        @Expose()
        @IsString()
        @MinLength(5)
        value!: string;
      }

      class StepTwoDto {
        @Expose()
        @Transform(({ value }) => value.toUpperCase())
        @IsString()
        @MinLength(5)
        value!: string;
      }

      const invalidData = { value: 'abc' }; // Too short

      // Step 1: Transform and validate
      const step1 = plainToClass(StepOneDto, invalidData);
      const errors1 = validateSync(step1);
      expect(errors1.length).toBe(1);
      expect(errors1[0].property).toBe('value');

      // Step 2: Even with transformation, validation should still fail
      const step2 = plainToClass(StepTwoDto, invalidData);
      const errors2 = validateSync(step2);
      expect(errors2.length).toBe(1);
      expect(errors2[0].property).toBe('value');
      expect(step2.value).toBe('ABC'); // Transformed but still invalid
    });

    it('should support conditional validation with transformation', () => {
      class ConditionalDto {
        @Expose()
        @IsString()
        type!: string;

        @Expose()
        @IsOptional()
        @IsEmail()
        email?: string;

        @Expose()
        @IsOptional()
        @IsString()
        @MinLength(10)
        phone?: string;
      }

      // Email type
      const emailData = {
        type: 'email',
        email: 'user@example.com',
      };

      const emailDto = plainToClass(ConditionalDto, emailData);
      const emailErrors = validateSync(emailDto);
      expect(emailErrors).toHaveLength(0);

      // Phone type
      const phoneData = {
        type: 'phone',
        phone: '555-123-4567',
      };

      const phoneDto = plainToClass(ConditionalDto, phoneData);
      const phoneErrors = validateSync(phoneDto);
      expect(phoneErrors).toHaveLength(0);

      // Invalid email
      const invalidEmailData = {
        type: 'email',
        email: 'invalid',
      };

      const invalidDto = plainToClass(ConditionalDto, invalidEmailData);
      const invalidErrors = validateSync(invalidDto);
      expect(invalidErrors.length).toBe(1);
      expect(invalidErrors[0].property).toBe('email');
    });
  });
});
