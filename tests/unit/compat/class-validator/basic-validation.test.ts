/**
 * Basic validation tests for class-validator compatibility layer
 */

import { describe, it, expect } from 'vitest';
import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('class-validator-compat - Basic Validation', () => {
  describe('@IsString', () => {
    it('should validate string values', async () => {
      class TestDto {
        @IsString()
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'John';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for non-string values', async () => {
      class TestDto {
        @IsString()
        name!: any;
      }

      const invalid = new TestDto();
      invalid.name = 123;

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('@MinLength', () => {
    it('should validate minimum string length', async () => {
      class TestDto {
        @MinLength(3)
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'John';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for strings shorter than minimum', async () => {
      class TestDto {
        @MinLength(5)
        name!: string;
      }

      const invalid = new TestDto();
      invalid.name = 'Jo';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('@MaxLength', () => {
    it('should validate maximum string length', async () => {
      class TestDto {
        @MaxLength(10)
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'John';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for strings longer than maximum', async () => {
      class TestDto {
        @MaxLength(5)
        name!: string;
      }

      const invalid = new TestDto();
      invalid.name = 'VeryLongName';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });
  });

  describe('@IsNumber', () => {
    it('should validate number values', async () => {
      class TestDto {
        @IsNumber()
        age!: number;
      }

      const valid = new TestDto();
      valid.age = 25;

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for non-number values', async () => {
      class TestDto {
        @IsNumber()
        age!: any;
      }

      const invalid = new TestDto();
      invalid.age = 'twenty-five';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('age');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });
  });

  describe('@Min', () => {
    it('should validate minimum number value', async () => {
      class TestDto {
        @Min(0)
        price!: number;
      }

      const valid = new TestDto();
      valid.price = 10;

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for numbers less than minimum', async () => {
      class TestDto {
        @Min(10)
        price!: number;
      }

      const invalid = new TestDto();
      invalid.price = 5;

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('price');
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('@Max', () => {
    it('should validate maximum number value', async () => {
      class TestDto {
        @Max(100)
        price!: number;
      }

      const valid = new TestDto();
      valid.price = 50;

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for numbers greater than maximum', async () => {
      class TestDto {
        @Max(100)
        price!: number;
      }

      const invalid = new TestDto();
      invalid.price = 150;

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('price');
      expect(errors[0].constraints).toHaveProperty('max');
    });
  });

  describe('@IsOptional', () => {
    it('should skip validation for undefined values', async () => {
      class TestDto {
        @IsOptional()
        @IsString()
        middleName?: string;
      }

      const valid = new TestDto();
      // middleName is undefined

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should skip validation for null values', async () => {
      class TestDto {
        @IsOptional()
        @IsString()
        middleName!: string | null;
      }

      const valid = new TestDto();
      valid.middleName = null;

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate when value is provided', async () => {
      class TestDto {
        @IsOptional()
        @IsString()
        @MinLength(3)
        middleName?: string;
      }

      const invalid = new TestDto();
      invalid.middleName = 'Jo'; // Too short

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('middleName');
    });
  });

  describe('Combined validators', () => {
    it('should validate multiple constraints on same property', async () => {
      class TestDto {
        @IsString()
        @MinLength(3)
        @MaxLength(10)
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'John';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should report all failed constraints', async () => {
      class TestDto {
        @IsString()
        @MinLength(5)
        name!: any;
      }

      const invalid = new TestDto();
      invalid.name = 123; // Not a string

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      // Should have isString error
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('validateSync', () => {
    it('should work synchronously', () => {
      class TestDto {
        @IsString()
        @MinLength(3)
        name!: string;
      }

      const invalid = new TestDto();
      invalid.name = 'Jo';

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });
  });
});

