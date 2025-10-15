/**
 * Tests for array validators
 */

import { describe, it, expect } from 'vitest';
import {
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayContains,
  ArrayNotContains,
  ArrayUnique,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Array Validators', () => {
  describe('@IsArray', () => {
    it('should validate array values', () => {
      class TestDto {
        @IsArray()
        items!: any[];
      }

      const valid = new TestDto();
      valid.items = [1, 2, 3];
      expect(validateSync(valid)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = [];
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail for non-array values', () => {
      class TestDto {
        @IsArray()
        items!: any;
      }

      const invalid1 = new TestDto();
      invalid1.items = 'not an array';
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = 123;
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.items = { key: 'value' };
      expect(validateSync(invalid3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @IsArray({ message: 'Must be an array type' })
        items!: any;
      }

      const invalid = new TestDto();
      invalid.items = 'not an array';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isArray).toBe('Must be an array type');
    });
  });

  describe('@ArrayNotEmpty', () => {
    it('should validate non-empty arrays', () => {
      class TestDto {
        @ArrayNotEmpty()
        items!: any[];
      }

      const valid = new TestDto();
      valid.items = [1];
      expect(validateSync(valid)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = [1, 2, 3];
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail for empty arrays', () => {
      class TestDto {
        @ArrayNotEmpty()
        items!: any[];
      }

      const invalid = new TestDto();
      invalid.items = [];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayNotEmpty).toBeDefined();
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayNotEmpty({ message: 'Array cannot be empty' })
        items!: any[];
      }

      const invalid = new TestDto();
      invalid.items = [];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayNotEmpty).toBe('Array cannot be empty');
    });
  });

  describe('@ArrayMinSize', () => {
    it('should validate minimum array size', () => {
      class TestDto {
        @ArrayMinSize(2)
        items!: any[];
      }

      const valid1 = new TestDto();
      valid1.items = [1, 2];
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = [1, 2, 3];
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail for arrays smaller than minimum', () => {
      class TestDto {
        @ArrayMinSize(3)
        items!: any[];
      }

      const invalid1 = new TestDto();
      invalid1.items = [];
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = [1];
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.items = [1, 2];
      expect(validateSync(invalid3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayMinSize(2, { message: 'Must have at least 2 items' })
        items!: any[];
      }

      const invalid = new TestDto();
      invalid.items = [1];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayMinSize).toBe('Must have at least 2 items');
    });
  });

  describe('@ArrayMaxSize', () => {
    it('should validate maximum array size', () => {
      class TestDto {
        @ArrayMaxSize(3)
        items!: any[];
      }

      const valid1 = new TestDto();
      valid1.items = [];
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = [1, 2];
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.items = [1, 2, 3];
      expect(validateSync(valid3)).toHaveLength(0);
    });

    it('should fail for arrays larger than maximum', () => {
      class TestDto {
        @ArrayMaxSize(2)
        items!: any[];
      }

      const invalid1 = new TestDto();
      invalid1.items = [1, 2, 3];
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = [1, 2, 3, 4];
      expect(validateSync(invalid2)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayMaxSize(2, { message: 'Cannot have more than 2 items' })
        items!: any[];
      }

      const invalid = new TestDto();
      invalid.items = [1, 2, 3];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayMaxSize).toBe('Cannot have more than 2 items');
    });
  });

  describe('@ArrayContains', () => {
    it('should validate that array contains required values', () => {
      class TestDto {
        @ArrayContains(['required1', 'required2'])
        items!: string[];
      }

      const valid1 = new TestDto();
      valid1.items = ['required1', 'required2'];
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = ['required1', 'required2', 'extra'];
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail when required values are missing', () => {
      class TestDto {
        @ArrayContains(['required1', 'required2'])
        items!: string[];
      }

      const invalid1 = new TestDto();
      invalid1.items = ['required1'];
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = ['other'];
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.items = [];
      expect(validateSync(invalid3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayContains(['admin'], { message: 'Must contain admin role' })
        roles!: string[];
      }

      const invalid = new TestDto();
      invalid.roles = ['user'];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayContains).toBe('Must contain admin role');
    });
  });

  describe('@ArrayNotContains', () => {
    it('should validate that array does not contain forbidden values', () => {
      class TestDto {
        @ArrayNotContains(['forbidden1', 'forbidden2'])
        items!: string[];
      }

      const valid1 = new TestDto();
      valid1.items = ['allowed1', 'allowed2'];
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = [];
      expect(validateSync(valid2)).toHaveLength(0);
    });

    it('should fail when forbidden values are present', () => {
      class TestDto {
        @ArrayNotContains(['forbidden1', 'forbidden2'])
        items!: string[];
      }

      const invalid1 = new TestDto();
      invalid1.items = ['forbidden1'];
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = ['allowed', 'forbidden2'];
      expect(validateSync(invalid2)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayNotContains(['banned'], { message: 'Cannot contain banned items' })
        items!: string[];
      }

      const invalid = new TestDto();
      invalid.items = ['allowed', 'banned'];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayNotContains).toBe('Cannot contain banned items');
    });
  });

  describe('@ArrayUnique', () => {
    it('should validate that all array values are unique', () => {
      class TestDto {
        @ArrayUnique()
        items!: any[];
      }

      const valid1 = new TestDto();
      valid1.items = [1, 2, 3];
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.items = ['a', 'b', 'c'];
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.items = [];
      expect(validateSync(valid3)).toHaveLength(0);
    });

    it('should fail when array has duplicate values', () => {
      class TestDto {
        @ArrayUnique()
        items!: any[];
      }

      const invalid1 = new TestDto();
      invalid1.items = [1, 2, 2, 3];
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = ['a', 'b', 'a'];
      expect(validateSync(invalid2)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @ArrayUnique({ message: 'All values must be unique' })
        items!: any[];
      }

      const invalid = new TestDto();
      invalid.items = [1, 1, 2];
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.arrayUnique).toBe('All values must be unique');
    });
  });

  describe('Combined Array Validators', () => {
    it('should work with multiple array validators', () => {
      class TestDto {
        @IsArray()
        @ArrayNotEmpty()
        @ArrayMinSize(2)
        @ArrayMaxSize(5)
        @ArrayUnique()
        items!: number[];
      }

      const valid = new TestDto();
      valid.items = [1, 2, 3];
      expect(validateSync(valid)).toHaveLength(0);

      const invalid1 = new TestDto();
      invalid1.items = [1]; // Too small
      expect(validateSync(invalid1)).toHaveLength(1);

      const invalid2 = new TestDto();
      invalid2.items = [1, 2, 3, 4, 5, 6]; // Too large
      expect(validateSync(invalid2)).toHaveLength(1);

      const invalid3 = new TestDto();
      invalid3.items = [1, 1, 2]; // Not unique
      expect(validateSync(invalid3)).toHaveLength(1);
    });

    it('should work with validation groups', () => {
      class TestDto {
        @ArrayMinSize(1, { groups: ['create'] })
        @ArrayMinSize(2, { groups: ['update'] })
        items!: any[];
      }

      const dto = new TestDto();
      dto.items = [1];

      // Should pass for 'create' group
      expect(validateSync(dto, { groups: ['create'] })).toHaveLength(0);

      // Should fail for 'update' group
      expect(validateSync(dto, { groups: ['update'] })).toHaveLength(1);
    });
  });
});
