/**
 * Integration tests for real-world scenarios
 * Testing complex use-cases with validation and transformation
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../src/compat/class-validator';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsStrongPassword,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsDateString,
  IsURL,
  IsMobilePhone,
  IsPostalCode,
} from '../../src/compat/class-validator/decorators';
import { Type, plainToInstance } from '../../src/compat/class-transformer';

describe('Real-World Scenarios - User Registration', () => {
  it('should validate complex user registration DTO', async () => {
    class AddressDto {
      @IsString()
      @IsNotEmpty()
      @MinLength(5)
      @MaxLength(100)
      street: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(2)
      @MaxLength(50)
      city: string;

      @IsPostalCode('US')
      zipCode: string;
    }

    class UserRegistrationDto {
      @IsEmail()
      email: string;

      @IsStrongPassword()
      password: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(2)
      @MaxLength(50)
      firstName: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(2)
      @MaxLength(50)
      lastName: string;

      @IsMobilePhone('en-US')
      phone: string;

      @ValidateNested()
      @Type(() => AddressDto)
      address: AddressDto;
    }

    // Valid registration
    const validDto = new UserRegistrationDto();
    validDto.email = 'john.doe@example.com';
    validDto.password = 'StrongP@ssw0rd!';
    validDto.firstName = 'John';
    validDto.lastName = 'Doe';
    validDto.phone = '+15551234567';

    const validAddress = new AddressDto();
    validAddress.street = '123 Main Street';
    validAddress.city = 'New York';
    validAddress.zipCode = '10001';
    validDto.address = validAddress;

    const errors1 = await validate(validDto);
    expect(errors1).toHaveLength(0);

    // Invalid registration - multiple errors
    const invalidDto = new UserRegistrationDto();
    invalidDto.email = 'invalid-email';
    invalidDto.password = 'weak';
    invalidDto.firstName = 'J';
    invalidDto.lastName = '';
    invalidDto.phone = 'invalid';

    const invalidAddress = new AddressDto();
    invalidAddress.street = 'AB';
    invalidAddress.city = 'X';
    invalidAddress.zipCode = 'invalid';
    invalidDto.address = invalidAddress;

    const errors2 = await validate(invalidDto);
    expect(errors2.length).toBeGreaterThan(0);

    // Should have errors for email, password, firstName, lastName, phone, and address
    const errorProperties = errors2.map(e => e.property);
    expect(errorProperties).toContain('email');
    expect(errorProperties).toContain('password');
    expect(errorProperties).toContain('firstName');
    expect(errorProperties).toContain('lastName');
    expect(errorProperties).toContain('phone');
    expect(errorProperties).toContain('address');
  });
});

describe('Real-World Scenarios - API Request DTO', () => {
  enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
  }

  it('should validate complex API request with nested objects and arrays', async () => {
    class OrderItemDto {
      @IsUUID()
      productId: string;

      @IsNumber()
      @Min(1)
      @Max(100)
      quantity: number;

      @IsNumber()
      @Min(0)
      price: number;
    }

    class ShippingAddressDto {
      @IsString()
      @IsNotEmpty()
      fullName: string;

      @IsString()
      @IsNotEmpty()
      addressLine1: string;

      @IsOptional()
      @IsString()
      addressLine2?: string;

      @IsString()
      @IsNotEmpty()
      city: string;

      @IsPostalCode('US')
      zipCode: string;
    }

    class CreateOrderDto {
      @IsUUID()
      customerId: string;

      @ValidateNested()
      @IsArray()
      @ArrayMinSize(1)
      @ArrayMaxSize(50)
      @Type(() => OrderItemDto)
      items: OrderItemDto[];

      @ValidateNested()
      @Type(() => ShippingAddressDto)
      shippingAddress: ShippingAddressDto;

      @IsOptional()
      @IsEnum(OrderStatus)
      status?: OrderStatus;

      @IsOptional()
      @IsString()
      @MaxLength(500)
      notes?: string;
    }

    // Valid order
    const validOrder = new CreateOrderDto();
    validOrder.customerId = '550e8400-e29b-41d4-a716-446655440000';

    const item1 = new OrderItemDto();
    item1.productId = '550e8400-e29b-41d4-a716-446655440001';
    item1.quantity = 2;
    item1.price = 29.99;

    const item2 = new OrderItemDto();
    item2.productId = '550e8400-e29b-41d4-a716-446655440002';
    item2.quantity = 1;
    item2.price = 49.99;

    validOrder.items = [item1, item2];

    const address = new ShippingAddressDto();
    address.fullName = 'John Doe';
    address.addressLine1 = '123 Main St';
    address.city = 'New York';
    address.zipCode = '10001';
    validOrder.shippingAddress = address;

    validOrder.status = OrderStatus.PENDING;

    const errors1 = await validate(validOrder);
    expect(errors1).toHaveLength(0);

    // Invalid order - empty items array
    const invalidOrder1 = new CreateOrderDto();
    invalidOrder1.customerId = '550e8400-e29b-41d4-a716-446655440000';
    invalidOrder1.items = [];
    invalidOrder1.shippingAddress = address;

    const errors2 = await validate(invalidOrder1);
    expect(errors2.length).toBeGreaterThan(0);
    expect(errors2.some(e => e.property === 'items')).toBe(true);

    // Invalid order - invalid item quantity
    const invalidOrder2 = new CreateOrderDto();
    invalidOrder2.customerId = '550e8400-e29b-41d4-a716-446655440000';

    const invalidItem = new OrderItemDto();
    invalidItem.productId = '550e8400-e29b-41d4-a716-446655440001';
    invalidItem.quantity = 0; // Invalid - must be >= 1
    invalidItem.price = 29.99;

    invalidOrder2.items = [invalidItem];
    invalidOrder2.shippingAddress = address;

    const errors3 = await validate(invalidOrder2);
    expect(errors3.length).toBeGreaterThan(0);
    expect(errors3[0].children).toBeDefined();
  });
});

describe('Real-World Scenarios - Form Validation', () => {
  it('should validate contact form with optional fields', () => {
    class ContactFormDto {
      @IsString()
      @IsNotEmpty()
      @MinLength(2)
      @MaxLength(100)
      name: string;

      @IsEmail()
      email: string;

      @IsOptional()
      @IsMobilePhone('en-US')
      phone?: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(10)
      @MaxLength(1000)
      message: string;

      @IsOptional()
      @IsURL()
      website?: string;
    }

    // Valid form with all fields
    const validForm1 = new ContactFormDto();
    validForm1.name = 'John Doe';
    validForm1.email = 'john@example.com';
    validForm1.phone = '+15551234567';
    validForm1.message = 'This is a test message with enough characters.';
    validForm1.website = 'https://example.com';

    const errors1 = validateSync(validForm1);
    expect(errors1).toHaveLength(0);

    // Valid form without optional fields
    const validForm2 = new ContactFormDto();
    validForm2.name = 'Jane Smith';
    validForm2.email = 'jane@example.com';
    validForm2.message = 'Another test message with enough characters.';

    const errors2 = validateSync(validForm2);
    expect(errors2).toHaveLength(0);

    // Invalid form - message too short
    const invalidForm = new ContactFormDto();
    invalidForm.name = 'John Doe';
    invalidForm.email = 'john@example.com';
    invalidForm.message = 'Too short';

    const errors3 = validateSync(invalidForm);
    expect(errors3.length).toBeGreaterThan(0);
    expect(errors3.some(e => e.property === 'message')).toBe(true);
  });
});

describe('Real-World Scenarios - Transformation + Validation', () => {
  it('should transform and validate API response', async () => {
    class UserDto {
      @IsUUID()
      id: string;

      @IsEmail()
      email: string;

      @IsString()
      @IsNotEmpty()
      name: string;

      @IsDateString()
      createdAt: string;
    }

    // Simulate API response
    const apiResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'John Doe',
      createdAt: '2024-01-15T10:30:00Z',
    };

    // Transform plain object to class instance
    const userDto = plainToInstance(UserDto, apiResponse);

    // Validate transformed object
    const errors = await validate(userDto);
    expect(errors).toHaveLength(0);
    expect(userDto).toBeInstanceOf(UserDto);
    expect(userDto.id).toBe(apiResponse.id);
    expect(userDto.email).toBe(apiResponse.email);
  });

  it('should transform and validate nested objects from API', async () => {
    class CommentDto {
      @IsUUID()
      id: string;

      @IsString()
      @IsNotEmpty()
      text: string;

      @IsDateString()
      createdAt: string;
    }

    class PostDto {
      @IsUUID()
      id: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(5)
      title: string;

      @IsString()
      @IsNotEmpty()
      content: string;

      @ValidateNested()
      @IsArray()
      @Type(() => CommentDto)
      comments: CommentDto[];
    }

    const apiResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Post',
      content: 'This is a test post content.',
      comments: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          text: 'Great post!',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          text: 'Thanks for sharing!',
          createdAt: '2024-01-15T11:00:00Z',
        },
      ],
    };

    const postDto = plainToInstance(PostDto, apiResponse);
    const errors = await validate(postDto);

    expect(errors).toHaveLength(0);
    expect(postDto).toBeInstanceOf(PostDto);
    expect(postDto.comments).toHaveLength(2);
    expect(postDto.comments[0]).toBeInstanceOf(CommentDto);
  });
});

