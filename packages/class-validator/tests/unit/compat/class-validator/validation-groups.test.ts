/**
 * Tests for validation groups
 */

import { describe, it, expect } from 'vitest';
import { IsString, IsEmail, MinLength, IsNumber, Min, validateSync } from '../../../../src';

describe('Validation Groups', () => {
  it('should validate only constraints in specified groups', () => {
    class UserDto {
      @IsString({ groups: ['create'] })
      @MinLength(3, { groups: ['create'] })
      username!: string;

      @IsEmail({ groups: ['create', 'update'] })
      email!: string;

      @IsNumber({ groups: ['update'] })
      @Min(18, { groups: ['update'] })
      age!: number;
    }

    const user = new UserDto();
    user.username = 'AB'; // Too short
    user.email = 'invalid-email';
    user.age = 15; // Too young

    // Validate with 'create' group - should check username and email
    const createErrors = validateSync(user, { groups: ['create'] });
    expect(createErrors.length).toBeGreaterThan(0);
    expect(createErrors.some((e) => e.property === 'username')).toBe(true);
    expect(createErrors.some((e) => e.property === 'email')).toBe(true);
    expect(createErrors.some((e) => e.property === 'age')).toBe(false); // age not in 'create' group

    // Validate with 'update' group - should check email and age
    const updateErrors = validateSync(user, { groups: ['update'] });
    expect(updateErrors.length).toBeGreaterThan(0);
    expect(updateErrors.some((e) => e.property === 'username')).toBe(false); // username not in 'update' group
    expect(updateErrors.some((e) => e.property === 'email')).toBe(true);
    expect(updateErrors.some((e) => e.property === 'age')).toBe(true);
  });

  it('should validate all constraints when no groups specified', () => {
    class UserDto {
      @IsString({ groups: ['create'] })
      username!: string;

      @IsEmail({ groups: ['update'] })
      email!: string;

      @IsNumber() // No group - always validated
      age!: number;
    }

    const user = new UserDto();
    user.username = 123 as any; // Invalid
    user.email = 'invalid-email';
    user.age = 'not a number' as any; // Invalid

    // No group filter means no filtering at all: every constraint runs,
    // grouped or not (class-validator 0.14.4).
    const errors = validateSync(user);
    expect(errors.length).toBe(3);
    expect(errors.map((e) => e.property).sort()).toEqual(['age', 'email', 'username']);
  });

  it('should validate constraints with multiple groups', () => {
    class ProductDto {
      @IsString({ groups: ['create', 'update', 'delete'] })
      @MinLength(2, { groups: ['create', 'update'] })
      name!: string;

      @IsNumber({ groups: ['create', 'update'] })
      @Min(0, { groups: ['create', 'update'] })
      price!: number;
    }

    const product = new ProductDto();
    product.name = 123 as any; // Not a string
    product.price = -10; // Negative

    // Validate with 'create' group
    const createErrors = validateSync(product, { groups: ['create'] });
    expect(createErrors.length).toBe(2);
    expect(createErrors.some((e) => e.property === 'name')).toBe(true);
    expect(createErrors.some((e) => e.property === 'price')).toBe(true);

    // Validate with 'delete' group - only name isString should be validated (no minLength in delete)
    const deleteErrors = validateSync(product, { groups: ['delete'] });
    expect(deleteErrors.length).toBe(1);
    expect(deleteErrors[0].property).toBe('name');
    expect(deleteErrors[0].constraints).toHaveProperty('isString');
    expect(deleteErrors[0].constraints).not.toHaveProperty('minLength');
  });

  it('should support multiple groups in validation options', () => {
    class UserDto {
      @IsString({ groups: ['group1'] })
      field1!: string;

      @IsString({ groups: ['group2'] })
      field2!: string;

      @IsString({ groups: ['group3'] })
      field3!: string;
    }

    const user = new UserDto();
    user.field1 = 123 as any;
    user.field2 = 456 as any;
    user.field3 = 789 as any;

    // Validate with multiple groups
    const errors = validateSync(user, { groups: ['group1', 'group2'] });
    expect(errors.length).toBe(2);
    expect(errors.some((e) => e.property === 'field1')).toBe(true);
    expect(errors.some((e) => e.property === 'field2')).toBe(true);
    expect(errors.some((e) => e.property === 'field3')).toBe(false);
  });

  it('should handle mixed grouped and non-grouped constraints', () => {
    class MixedDto {
      @IsString() // Always validated
      @MinLength(5, { groups: ['strict'] }) // Only in strict group
      name!: string;

      @IsNumber({ groups: ['strict'] }) // Only in strict group
      @Min(0) // Always validated
      value!: number;
    }

    const dto = new MixedDto();
    dto.name = 'ABC'; // Valid string but too short for strict group
    dto.value = -5; // Negative number - fails @Min(0)

    // No filter: both the grouped and the ungrouped constraints run, so the
    // too-short name is reported alongside the negative value.
    const normalErrors = validateSync(dto);
    expect(normalErrors.length).toBe(2);
    expect(normalErrors.some((e) => e.property === 'value' && e.constraints?.min)).toBe(true);
    expect(normalErrors.some((e) => e.property === 'name' && e.constraints?.minLength)).toBe(true);

    // Validate with strict group - should check grouped constraints
    dto.value = 'not a number' as any; // Change to invalid type for strict validation
    const strictErrors = validateSync(dto, { groups: ['strict'] });
    expect(strictErrors.length).toBe(2);
    expect(strictErrors.some((e) => e.property === 'name' && e.constraints?.minLength)).toBe(true);
    expect(strictErrors.some((e) => e.property === 'value' && e.constraints?.isNumber)).toBe(true);
  });

  it('should work with empty groups array', () => {
    class UserDto {
      @IsString({ groups: ['create'] })
      username!: string;

      @IsEmail() // No group
      email!: string;
    }

    const user = new UserDto();
    user.username = 123 as any;
    user.email = 'invalid-email';

    // An empty array is not a filter, so it behaves like passing nothing:
    // every constraint runs.
    const errors = validateSync(user, { groups: [] });
    expect(errors.length).toBe(2);
    expect(errors.map((e) => e.property).sort()).toEqual(['email', 'username']);
  });
});
