/**
 * Memory leak detection tests
 * Ensures that validation and transformation operations don't cause memory leaks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateSync } from '../../src/compat/class-validator';
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

/**
 * Helper function to get memory usage in MB
 */
function getMemoryUsageMB(): number {
  const usage = process.memoryUsage();
  return usage.heapUsed / 1024 / 1024;
}

/**
 * Helper function to force garbage collection if available
 */
function forceGC(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Helper function to measure memory growth
 */
async function measureMemoryGrowth(
  operation: () => void,
  iterations: number,
  warmupIterations: number = 1000
): Promise<{ initialMB: number; finalMB: number; growthMB: number; growthPercent: number }> {
  // Warmup phase - let JIT compiler optimize
  for (let i = 0; i < warmupIterations; i++) {
    operation();
  }

  // Force GC before measurement
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));
  forceGC();

  const initialMemory = getMemoryUsageMB();

  // Actual measurement phase
  for (let i = 0; i < iterations; i++) {
    operation();
  }

  // Force GC after operations
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));
  forceGC();

  const finalMemory = getMemoryUsageMB();
  const growth = finalMemory - initialMemory;
  const growthPercent = (growth / initialMemory) * 100;

  return {
    initialMB: initialMemory,
    finalMB: finalMemory,
    growthMB: growth,
    growthPercent,
  };
}

describe('Memory Leak Tests - Simple Validation', () => {
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

  it('should not leak memory on repeated validation of same object', async () => {
    const dto = new SimpleDto();
    dto.name = 'John Doe';
    dto.email = 'john@example.com';
    dto.age = 30;

    const result = await measureMemoryGrowth(
      () => {
        validateSync(dto);
      },
      10000,
      1000
    );

    console.log(`Simple validation memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 10MB absolute growth)
    // Note: Negative growth (memory decrease) is good - it means GC is working
    expect(Math.abs(result.growthMB)).toBeLessThan(10);
  });

  it('should not leak memory when creating and validating many objects', async () => {
    const result = await measureMemoryGrowth(
      () => {
        const dto = new SimpleDto();
        dto.name = 'John Doe';
        dto.email = 'john@example.com';
        dto.age = 30;
        validateSync(dto);
      },
      5000,
      500
    );

    console.log(`Create + validate memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 15MB absolute growth)
    expect(Math.abs(result.growthMB)).toBeLessThan(15);
  });
});

describe('Memory Leak Tests - Complex Validation', () => {
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

  it('should not leak memory on nested object validation', async () => {
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

    const result = await measureMemoryGrowth(
      () => {
        validateSync(dto);
      },
      5000,
      500
    );

    console.log(`Nested validation memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 10MB absolute growth)
    expect(Math.abs(result.growthMB)).toBeLessThan(10);
  });
});

describe('Memory Leak Tests - Array Validation', () => {
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

  it('should not leak memory on array validation', async () => {
    const dto = new OrderDto();
    dto.orderId = 'ORDER-123';

    const items: ItemDto[] = [];
    for (let i = 0; i < 10; i++) {
      const item = new ItemDto();
      item.name = `Item ${i}`;
      item.quantity = i + 1;
      items.push(item);
    }
    dto.items = items;

    const result = await measureMemoryGrowth(
      () => {
        validateSync(dto);
      },
      3000,
      300
    );

    console.log(`Array validation memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 10MB absolute growth)
    expect(Math.abs(result.growthMB)).toBeLessThan(10);
  });
});

describe('Memory Leak Tests - Transformation', () => {
  class UserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsNumber()
    age: number;
  }

  it('should not leak memory on repeated transformation', async () => {
    const plain = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const result = await measureMemoryGrowth(
      () => {
        plainToInstance(UserDto, plain);
      },
      10000,
      1000
    );

    console.log(`Transformation memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 10MB absolute growth)
    expect(Math.abs(result.growthMB)).toBeLessThan(10);
  });
});

describe('Memory Leak Tests - Combined Operations', () => {
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

  it('should not leak memory on combined transform + validate', async () => {
    const plain = {
      name: 'Product Name',
      price: 29.99,
      description: 'Product description',
    };

    const result = await measureMemoryGrowth(
      () => {
        const dto = plainToInstance(ProductDto, plain);
        validateSync(dto);
      },
      5000,
      500
    );

    console.log(`Transform + validate memory: ${result.initialMB.toFixed(2)}MB -> ${result.finalMB.toFixed(2)}MB (${result.growthMB >= 0 ? '+' : ''}${result.growthMB.toFixed(2)}MB, ${result.growthPercent >= 0 ? '+' : ''}${result.growthPercent.toFixed(2)}%)`);

    // Memory growth should be reasonable (< 15MB absolute growth)
    expect(Math.abs(result.growthMB)).toBeLessThan(15);
  });
});

