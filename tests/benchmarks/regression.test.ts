/**
 * Benchmark regression tests
 * Ensures that performance does not degrade over time
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../src/compat/class-validator';
import { plainToInstance } from '../../src/compat/class-transformer';
import {
  IsString,
  IsEmail,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  IsArray,
  IsNotEmpty,
} from '../../src/compat/class-validator/decorators';
import { Type } from '../../src/compat/class-transformer';

// Baseline performance values (in milliseconds)
// These should be updated when intentional performance improvements are made
const BASELINES = {
  simpleValidation: 0.5, // Simple validation should take < 0.5ms
  complexValidation: 2.0, // Complex validation should take < 2ms
  nestedValidation: 3.0, // Nested validation should take < 3ms
  transformation: 0.3, // Transformation should take < 0.3ms
  transformationAndValidation: 1.0, // Combined should take < 1ms
};

const TOLERANCE = 0.1; // 10% tolerance for performance variations

/**
 * Helper function to measure execution time
 */
function measureTime(fn: () => void, iterations: number = 1000): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return (end - start) / iterations; // Average time per iteration
}

describe('Benchmark Regression Tests - Simple Validation', () => {
  class SimpleDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name: string;

    @IsEmail()
    email: string;

    @IsNumber()
    @Min(0)
    @Max(150)
    age: number;
  }

  it('should validate simple DTO within baseline performance', () => {
    const dto = new SimpleDto();
    dto.name = 'John Doe';
    dto.email = 'john@example.com';
    dto.age = 30;

    const avgTime = measureTime(() => {
      validateSync(dto);
    }, 1000);

    console.log(`Simple validation: ${avgTime.toFixed(4)}ms (baseline: ${BASELINES.simpleValidation}ms)`);

    // Check that performance is within tolerance
    const maxAllowed = BASELINES.simpleValidation * (1 + TOLERANCE);
    expect(avgTime).toBeLessThan(maxAllowed);
  });

  it('should handle validation errors without performance degradation', () => {
    const dto = new SimpleDto();
    dto.name = 'J'; // Too short
    dto.email = 'invalid-email';
    dto.age = 200; // Too high

    const avgTime = measureTime(() => {
      validateSync(dto);
    }, 1000);

    console.log(`Simple validation (with errors): ${avgTime.toFixed(4)}ms`);

    // Even with errors, should be within tolerance
    const maxAllowed = BASELINES.simpleValidation * (1 + TOLERANCE) * 1.5; // Allow 50% more time for error handling
    expect(avgTime).toBeLessThan(maxAllowed);
  });
});

describe('Benchmark Regression Tests - Complex Validation', () => {
  class AddressDto {
    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @MinLength(5)
    @MaxLength(10)
    zipCode: string;
  }

  class ComplexDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @IsEmail()
    email: string;

    @IsNumber()
    @Min(0)
    @Max(150)
    age: number;

    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;
  }

  it('should validate complex DTO with nested objects within baseline', () => {
    const dto = new ComplexDto();
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.email = 'john@example.com';
    dto.age = 30;

    const address = new AddressDto();
    address.street = '123 Main St';
    address.city = 'New York';
    address.zipCode = '10001';
    dto.address = address;

    const avgTime = measureTime(() => {
      validateSync(dto);
    }, 1000);

    console.log(`Complex validation: ${avgTime.toFixed(4)}ms (baseline: ${BASELINES.complexValidation}ms)`);

    const maxAllowed = BASELINES.complexValidation * (1 + TOLERANCE);
    expect(avgTime).toBeLessThan(maxAllowed);
  });
});

describe('Benchmark Regression Tests - Nested Arrays', () => {
  class ItemDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    quantity: number;
  }

  class OrderDto {
    @IsString()
    orderId: string;

    @ValidateNested()
    @IsArray()
    @Type(() => ItemDto)
    items: ItemDto[];
  }

  it('should validate nested arrays within baseline performance', () => {
    const dto = new OrderDto();
    dto.orderId = 'ORDER-123';

    const items: ItemDto[] = [];
    for (let i = 0; i < 5; i++) {
      const item = new ItemDto();
      item.name = `Item ${i}`;
      item.quantity = i + 1;
      items.push(item);
    }
    dto.items = items;

    const avgTime = measureTime(() => {
      validateSync(dto);
    }, 500);

    console.log(`Nested array validation: ${avgTime.toFixed(4)}ms (baseline: ${BASELINES.nestedValidation}ms)`);

    const maxAllowed = BASELINES.nestedValidation * (1 + TOLERANCE);
    expect(avgTime).toBeLessThan(maxAllowed);
  });
});

describe('Benchmark Regression Tests - Transformation', () => {
  class UserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsNumber()
    age: number;
  }

  it('should transform plain objects within baseline performance', () => {
    const plain = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const avgTime = measureTime(() => {
      plainToInstance(UserDto, plain);
    }, 1000);

    console.log(`Transformation: ${avgTime.toFixed(4)}ms (baseline: ${BASELINES.transformation}ms)`);

    const maxAllowed = BASELINES.transformation * (1 + TOLERANCE);
    expect(avgTime).toBeLessThan(maxAllowed);
  });
});

describe('Benchmark Regression Tests - Transformation + Validation', () => {
  class ProductDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsString()
    description: string;
  }

  it('should transform and validate within baseline performance', () => {
    const plain = {
      name: 'Product Name',
      price: 29.99,
      description: 'Product description',
    };

    const avgTime = measureTime(() => {
      const dto = plainToInstance(ProductDto, plain);
      validateSync(dto);
    }, 1000);

    console.log(`Transform + Validate: ${avgTime.toFixed(4)}ms (baseline: ${BASELINES.transformationAndValidation}ms)`);

    const maxAllowed = BASELINES.transformationAndValidation * (1 + TOLERANCE);
    expect(avgTime).toBeLessThan(maxAllowed);
  });
});

describe('Benchmark Regression Tests - Async Validation', () => {
  class AsyncDto {
    @IsString()
    @MinLength(5)
    username: string;

    @IsEmail()
    email: string;
  }

  it('should handle async validation efficiently', async () => {
    const dto = new AsyncDto();
    dto.username = 'johndoe';
    dto.email = 'john@example.com';

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await validate(dto);
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;

    console.log(`Async validation: ${avgTime.toFixed(4)}ms`);

    // Async validation should be reasonably fast (< 2ms per validation)
    expect(avgTime).toBeLessThan(2.0);
  });
});

