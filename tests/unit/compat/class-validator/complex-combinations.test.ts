/**
 * Tests for complex combinations of validation features
 * Testing: optional + groups, conditional + nested, groups + nested, etc.
 */

import { describe, it, expect } from 'vitest';
import { validate, validateSync } from '../../../../src/compat/class-validator';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  MinLength,
  MaxLength,
  Min,
  Max,
} from '../../../../src/compat/class-validator/decorators';
import { Type } from '../../../../src/compat/class-transformer';

describe('Complex Combinations - Optional + Groups', () => {
  it('should handle optional with groups and constraint with different groups', async () => {
    class ComplexDto {
      @IsOptional({ groups: ['update'] })
      @IsString({ groups: ['update'] })
      @MinLength(5, { groups: ['update'] })
      name?: string;

      @IsEmail()
      email: string;
    }

    const dto = new ComplexDto();
    dto.email = 'test@example.com';
    // name is undefined

    // With 'update' group - name is optional, undefined should pass
    const errors1 = await validate(dto, { groups: ['update'] });
    expect(errors1).toHaveLength(0);

    // Without groups - should pass (no validation in default group)
    const errors2 = await validate(dto);
    expect(errors2).toHaveLength(0);

    // Set name to short value
    dto.name = 'AB';

    // With 'update' group - should fail MinLength
    const errors3 = await validate(dto, { groups: ['update'] });
    expect(errors3.length).toBeGreaterThan(0);

    // Set name to valid value
    dto.name = 'Valid Name';

    // With 'update' group - should pass
    const errors4 = await validate(dto, { groups: ['update'] });
    expect(errors4).toHaveLength(0);
  });

  it('should handle multiple optional fields with different groups', async () => {
    class MultiOptionalDto {
      @IsOptional({ groups: ['admin'] })
      @IsString({ groups: ['admin'] })
      adminField?: string;

      @IsOptional({ groups: ['user'] })
      @IsNumber({ groups: ['user'] })
      userField?: number;

      @IsNotEmpty()
      requiredField: string;
    }

    const dto = new MultiOptionalDto();
    dto.requiredField = 'required';

    // With 'admin' group - adminField is optional
    const errors1 = await validate(dto, { groups: ['admin'] });
    expect(errors1).toHaveLength(0);

    // With 'user' group - userField is optional
    const errors2 = await validate(dto, { groups: ['user'] });
    expect(errors2).toHaveLength(0);

    // Without groups - should validate requiredField only
    const errors3 = await validate(dto);
    expect(errors3).toHaveLength(0);
  });
});

describe('Complex Combinations - Conditional + Nested', () => {
  it('should validate nested objects conditionally', async () => {
    class AddressDto {
      @IsString()
      @IsNotEmpty()
      street: string;

      @IsString()
      city: string;
    }

    class ConditionalNestedDto {
      hasAddress: boolean;

      @ValidateIf((o) => o.hasAddress)
      @ValidateNested()
      @Type(() => AddressDto)
      address?: AddressDto;
    }

    const dto1 = new ConditionalNestedDto();
    dto1.hasAddress = false;
    dto1.address = { street: '', city: 'NYC' } as any; // Invalid but should be skipped

    const errors1 = await validate(dto1);
    expect(errors1).toHaveLength(0);

    const dto2 = new ConditionalNestedDto();
    dto2.hasAddress = true;
    dto2.address = { street: '123 Main St', city: 'NYC' } as any; // Valid

    const errors2 = await validate(dto2);
    expect(errors2).toHaveLength(0);
  });

  it('should validate array of nested objects conditionally', async () => {
    class ItemDto {
      @IsString()
      @IsNotEmpty()
      name: string;

      @IsNumber()
      @Min(0)
      quantity: number;
    }

    class ConditionalArrayDto {
      hasItems: boolean;

      @ValidateIf((o) => o.hasItems)
      @ValidateNested()
      @IsArray()
      @ArrayMinSize(1)
      @Type(() => ItemDto)
      items?: ItemDto[];
    }

    const dto1 = new ConditionalArrayDto();
    dto1.hasItems = false;
    dto1.items = []; // Invalid but should be skipped

    const errors1 = await validate(dto1);
    expect(errors1).toHaveLength(0);

    const dto2 = new ConditionalArrayDto();
    dto2.hasItems = true;
    dto2.items = []; // Invalid and should fail

    const errors2 = await validate(dto2);
    expect(errors2.length).toBeGreaterThan(0);
  });
});

describe('Complex Combinations - Groups + Nested', () => {
  it('should validate nested objects', async () => {
    class NestedDto {
      @IsString()
      @MinLength(3)
      name: string;

      @IsNumber()
      @Min(0)
      value: number;
    }

    class ParentDto {
      @ValidateNested()
      @Type(() => NestedDto)
      nested: NestedDto;
    }

    const dto = new ParentDto();
    const nested = new NestedDto();
    nested.name = 'AB';
    nested.value = -1;
    dto.nested = nested;

    // Should validate both fields
    const errors1 = await validate(dto);
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].children).toBeDefined();

    // Fix name
    nested.name = 'Valid Name';
    const errors2 = await validate(dto);
    expect(errors2.length).toBeGreaterThan(0); // Still fails on value

    // Fix both
    nested.value = 10;
    const errors3 = await validate(dto);
    expect(errors3).toHaveLength(0);
  });

  it('should validate array of nested objects', async () => {
    class ItemDto {
      @IsString()
      @IsNotEmpty()
      name: string;

      @IsNumber()
      @Min(0)
      quantity: number;
    }

    class CollectionDto {
      @ValidateNested()
      @IsArray()
      @Type(() => ItemDto)
      items: ItemDto[];
    }

    const dto = new CollectionDto();
    const item1 = new ItemDto();
    item1.name = '';
    item1.quantity = 5;

    const item2 = new ItemDto();
    item2.name = 'Item 2';
    item2.quantity = -1;

    dto.items = [item1, item2];

    // Should validate all items
    const errors1 = await validate(dto);
    expect(errors1.length).toBeGreaterThan(0);
    expect(errors1[0].children).toBeDefined();

    // Fix all items
    item1.name = 'Item 1';
    item2.quantity = 10;

    const errors2 = await validate(dto);
    expect(errors2).toHaveLength(0);
  });
});

describe('Complex Combinations - Optional + Conditional + Nested', () => {
  it('should handle optional with nested validation', async () => {
    class DeepNestedDto {
      @IsString()
      @IsNotEmpty()
      value: string;
    }

    class MiddleDto {
      @IsOptional()
      @ValidateNested()
      @Type(() => DeepNestedDto)
      deep?: DeepNestedDto;
    }

    class TopDto {
      @ValidateNested()
      @Type(() => MiddleDto)
      middle: MiddleDto;
    }

    const dto1 = new TopDto();
    const middle1 = new MiddleDto();
    middle1.deep = undefined;
    dto1.middle = middle1;

    // deep is optional - should pass
    const errors1 = await validate(dto1);
    expect(errors1).toHaveLength(0);

    const dto2 = new TopDto();
    const middle2 = new MiddleDto();
    const deep2 = new DeepNestedDto();
    deep2.value = '';
    middle2.deep = deep2;
    dto2.middle = middle2;

    // deep.value is empty - should fail
    const errors2 = await validate(dto2);
    expect(errors2.length).toBeGreaterThan(0);

    const dto3 = new TopDto();
    const middle3 = new MiddleDto();
    const deep3 = new DeepNestedDto();
    deep3.value = 'Valid';
    middle3.deep = deep3;
    dto3.middle = middle3;

    // All valid - should pass
    const errors3 = await validate(dto3);
    expect(errors3).toHaveLength(0);
  });
});

describe('Complex Combinations - Multiple Constraints Same Property', () => {
  it('should validate multiple constraints with different groups', async () => {
    class MultiConstraintDto {
      @IsString({ groups: ['type-check'] })
      @MinLength(5, { groups: ['length-check'] })
      @MaxLength(20, { groups: ['length-check'] })
      @IsNotEmpty({ groups: ['required-check'] })
      value: string;
    }

    const dto = new MultiConstraintDto();
    dto.value = '';

    // With 'required-check' group - should fail IsNotEmpty
    const errors1 = await validate(dto, { groups: ['required-check'] });
    expect(errors1.length).toBeGreaterThan(0);

    dto.value = 'AB';

    // With 'length-check' group - should fail MinLength
    const errors2 = await validate(dto, { groups: ['length-check'] });
    expect(errors2.length).toBeGreaterThan(0);

    dto.value = 'Valid Value';

    // With 'length-check' group - should pass
    const errors3 = await validate(dto, { groups: ['length-check'] });
    expect(errors3).toHaveLength(0);

    // With 'type-check' group - should pass
    const errors4 = await validate(dto, { groups: ['type-check'] });
    expect(errors4).toHaveLength(0);
  });

  it('should validate with multiple groups at once', async () => {
    class MultiGroupDto {
      @IsString({ groups: ['group1', 'group2'] })
      @MinLength(3, { groups: ['group1'] })
      @MaxLength(10, { groups: ['group2'] })
      value: string;
    }

    const dto = new MultiGroupDto();
    dto.value = 'AB';

    // With 'group1' - should fail MinLength
    const errors1 = await validate(dto, { groups: ['group1'] });
    expect(errors1.length).toBeGreaterThan(0);

    dto.value = 'This is a very long string';

    // With 'group2' - should fail MaxLength
    const errors2 = await validate(dto, { groups: ['group2'] });
    expect(errors2.length).toBeGreaterThan(0);

    dto.value = 'Valid';

    // With both groups - should pass
    const errors3 = await validate(dto, { groups: ['group1', 'group2'] });
    expect(errors3).toHaveLength(0);
  });
});

describe('Complex Combinations - Async Validation with Groups', () => {
  it('should handle async validation with groups', async () => {
    class AsyncGroupDto {
      @IsEmail({ groups: ['email-check'] })
      @MinLength(5, { groups: ['length-check'] })
      email: string;
    }

    const dto = new AsyncGroupDto();
    dto.email = 'ab';

    // With 'length-check' group - should fail
    const errors1 = await validate(dto, { groups: ['length-check'] });
    expect(errors1.length).toBeGreaterThan(0);

    dto.email = 'not-an-email';

    // With 'email-check' group - should fail
    const errors2 = await validate(dto, { groups: ['email-check'] });
    expect(errors2.length).toBeGreaterThan(0);

    dto.email = 'valid@example.com';

    // With both groups - should pass
    const errors3 = await validate(dto, { groups: ['email-check', 'length-check'] });
    expect(errors3).toHaveLength(0);
  });
});

