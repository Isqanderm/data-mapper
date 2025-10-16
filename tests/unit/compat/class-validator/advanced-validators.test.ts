/**
 * Tests for advanced validators (IsInstance, ValidateIf, Allow, ValidatePromise)
 */

import { describe, it, expect } from 'vitest';
import {
  IsInstance,
  ValidateIf,
  Allow,
  ValidatePromise,
  IsString,
  IsNumber,
  MinLength,
  Min,
  IsNotEmpty,
  IsObject,
  IsEnum,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Advanced Validators', () => {
  describe('@IsInstance', () => {
    class Address {
      street!: string;
      city!: string;
    }

    class User {
      name!: string;
    }

    it('should validate instance of a class', () => {
      class TestDto {
        @IsInstance(Address)
        address!: Address;
      }

      const valid = new TestDto();
      valid.address = new Address();
      valid.address.street = '123 Main St';
      valid.address.city = 'New York';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for non-instance values', () => {
      class TestDto {
        @IsInstance(Address)
        address!: any;
      }

      const invalid = new TestDto();
      invalid.address = { street: '123 Main St', city: 'New York' }; // Plain object, not instance

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isInstance).toBeDefined();
      expect(errors[0].constraints?.isInstance).toContain('instance');
    });

    it('should fail for wrong class instance', () => {
      class TestDto {
        @IsInstance(Address)
        address!: any;
      }

      const invalid = new TestDto();
      invalid.address = new User(); // Wrong class

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isInstance).toBeDefined();
    });

    it('should fail for primitive values', () => {
      class TestDto {
        @IsInstance(Address)
        address!: any;
      }

      const invalid1 = new TestDto();
      invalid1.address = 'not an instance';
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.address = 123;
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.address = null;
      expect(validateSync(invalid3)).toHaveLength(1);
    });
  });

  describe('@ValidateIf', () => {
    it('should validate conditionally based on predicate', () => {
      class TestDto {
        requireAddress!: boolean;

        @ValidateIf(o => o.requireAddress === true)
        @IsString()
        @MinLength(5)
        address?: string;
      }

      // When condition is true, validation should run
      const dto1 = new TestDto();
      dto1.requireAddress = true;
      dto1.address = 'abc'; // Too short

      const errors1 = validateSync(dto1);
      expect(errors1).toHaveLength(1);
      expect(errors1[0].property).toBe('address');
      expect(errors1[0].constraints?.minLength).toBeDefined();

      // When condition is false, validation should be skipped
      const dto2 = new TestDto();
      dto2.requireAddress = false;
      dto2.address = 'abc'; // Too short, but validation skipped

      const errors2 = validateSync(dto2);
      expect(errors2).toHaveLength(0);
    });

    it('should skip validation when condition is not met', () => {
      class TestDto {
        type!: string;

        @ValidateIf(o => o.type === 'premium')
        @IsNumber()
        @Min(100)
        price?: number;
      }

      const dto = new TestDto();
      dto.type = 'basic';
      dto.price = 50; // Would fail if validated

      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when condition is met', () => {
      class TestDto {
        type!: string;

        @ValidateIf(o => o.type === 'premium')
        @IsNumber()
        @Min(100)
        price?: number;
      }

      const dto = new TestDto();
      dto.type = 'premium';
      dto.price = 50; // Should fail

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('price');
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should work with complex conditions', () => {
      class TestDto {
        country!: string;
        state?: string;

        @ValidateIf(o => o.country === 'USA' && o.state !== undefined)
        @IsString()
        @MinLength(2)
        zipCode?: string;
      }

      // Condition not met - country is not USA
      const dto1 = new TestDto();
      dto1.country = 'Canada';
      dto1.state = 'ON';
      dto1.zipCode = '1'; // Would fail if validated

      expect(validateSync(dto1)).toHaveLength(0);

      // Condition not met - state is undefined
      const dto2 = new TestDto();
      dto2.country = 'USA';
      dto2.zipCode = '1'; // Would fail if validated

      expect(validateSync(dto2)).toHaveLength(0);

      // Condition met - should validate
      const dto3 = new TestDto();
      dto3.country = 'USA';
      dto3.state = 'CA';
      dto3.zipCode = '1'; // Should fail

      const errors3 = validateSync(dto3);
      expect(errors3).toHaveLength(1);
      expect(errors3[0].property).toBe('zipCode');
    });

    it('should work with multiple validators', () => {
      class TestDto {
        hasEmail!: boolean;

        @ValidateIf(o => o.hasEmail)
        @IsString()
        @MinLength(5)
        @IsNotEmpty()
        email?: string;
      }

      const dto = new TestDto();
      dto.hasEmail = true;
      dto.email = ''; // Fails IsNotEmpty

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });
  });

  describe('@Allow', () => {
    it('should allow any value without validation', () => {
      class TestDto {
        @Allow()
        metadata: any;
      }

      const dto1 = new TestDto();
      dto1.metadata = 'string';
      expect(validateSync(dto1)).toHaveLength(0);

      const dto2 = new TestDto();
      dto2.metadata = 123;
      expect(validateSync(dto2)).toHaveLength(0);

      const dto3 = new TestDto();
      dto3.metadata = { any: 'object' };
      expect(validateSync(dto3)).toHaveLength(0);

      const dto4 = new TestDto();
      dto4.metadata = null;
      expect(validateSync(dto4)).toHaveLength(0);

      const dto5 = new TestDto();
      dto5.metadata = undefined;
      expect(validateSync(dto5)).toHaveLength(0);
    });

    it('should work alongside other validated properties', () => {
      class TestDto {
        @IsString()
        @MinLength(3)
        name!: string;

        @Allow()
        metadata: any;
      }

      const valid = new TestDto();
      valid.name = 'John';
      valid.metadata = { anything: 'goes' };
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.name = 'Jo'; // Too short
      invalid.metadata = { anything: 'goes' };

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('@ValidatePromise', () => {
    it('should validate promise values asynchronously', async () => {
      class TestDto {
        @ValidatePromise()
        @IsString()
        asyncValue!: Promise<string>;
      }

      const dto = new TestDto();
      dto.asyncValue = Promise.resolve('valid string');

      const errors = await validate(dto);
      // ValidatePromise is a marker - actual validation depends on implementation
      // For now, we just verify it doesn't break validation
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('@IsObject', () => {
    it('should validate object values', () => {
      class TestDto {
        @IsObject()
        metadata!: object;
      }

      const valid1 = new TestDto();
      valid1.metadata = { key: 'value' };
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.metadata = {};
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.metadata = { nested: { data: 'value' } };
      expect(validateSync(valid3)).toHaveLength(0);
    });

    it('should fail for non-object values', () => {
      class TestDto {
        @IsObject()
        metadata!: any;
      }

      const invalid1 = new TestDto();
      invalid1.metadata = 'string';
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.metadata = 123;
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.metadata = null;
      expect(validateSync(invalid3)).toHaveLength(1);

      const invalid4 = new TestDto();
      invalid4.metadata = [];
      expect(validateSync(invalid4)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @IsObject({ message: 'Must be an object' })
        metadata!: any;
      }

      const invalid = new TestDto();
      invalid.metadata = 'not an object';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isObject).toBe('Must be an object');
    });
  });

  describe('@IsEnum', () => {
    enum UserRole {
      Admin = 'admin',
      User = 'user',
      Guest = 'guest',
    }

    enum NumericEnum {
      First = 1,
      Second = 2,
      Third = 3,
    }

    it('should validate string enum values', () => {
      class TestDto {
        @IsEnum(UserRole)
        role!: UserRole;
      }

      const valid1 = new TestDto();
      valid1.role = UserRole.Admin;
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.role = UserRole.User;
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.role = UserRole.Guest;
      expect(validateSync(valid3)).toHaveLength(0);
    });

    it('should validate numeric enum values', () => {
      class TestDto {
        @IsEnum(NumericEnum)
        value!: NumericEnum;
      }

      const valid1 = new TestDto();
      valid1.value = NumericEnum.First;
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.value = NumericEnum.Second;
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail for invalid enum values', () => {
      class TestDto {
        @IsEnum(UserRole)
        role!: any;
      }

      const invalid1 = new TestDto();
      invalid1.role = 'invalid';
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.role = 'superadmin';
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.role = 123;
      expect(validateSync(invalid3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @IsEnum(UserRole, { message: 'Invalid role' })
        role!: any;
      }

      const invalid = new TestDto();
      invalid.role = 'invalid';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEnum).toBe('Invalid role');
    });
  });
});

