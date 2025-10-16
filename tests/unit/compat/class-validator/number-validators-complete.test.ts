/**
 * Complete tests for number validators to achieve 100% coverage
 */

import { describe, it, expect } from 'vitest';
import {
  IsPositive,
  IsNegative,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Number Validators - Complete Coverage', () => {
  describe('@IsPositive', () => {
    it('should pass for positive numbers', () => {
      class TestDto {
        @IsPositive()
        value!: number;
      }

      const dto1 = new TestDto();
      dto1.value = 1;
      expect(validateSync(dto1)).toHaveLength(0);

      const dto2 = new TestDto();
      dto2.value = 0.000001;
      expect(validateSync(dto2)).toHaveLength(0);

      const dto3 = new TestDto();
      dto3.value = 100;
      expect(validateSync(dto3)).toHaveLength(0);

      const dto4 = new TestDto();
      dto4.value = 999999.99;
      expect(validateSync(dto4)).toHaveLength(0);
    });

    it('should fail for zero', () => {
      class TestDto {
        @IsPositive()
        value!: number;
      }

      const dto = new TestDto();
      dto.value = 0;

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints?.min).toBeDefined();
      expect(errors[0].constraints?.min).toContain('positive');
    });

    it('should fail for negative numbers', () => {
      class TestDto {
        @IsPositive()
        value!: number;
      }

      const dto1 = new TestDto();
      dto1.value = -1;
      expect(validateSync(dto1)).toHaveLength(1);

      const dto2 = new TestDto();
      dto2.value = -0.000001;
      expect(validateSync(dto2)).toHaveLength(1);

      const dto3 = new TestDto();
      dto3.value = -100;
      expect(validateSync(dto3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @IsPositive({ message: 'Value must be greater than zero' })
        value!: number;
      }

      const dto = new TestDto();
      dto.value = -5;

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBe('Value must be greater than zero');
    });

    it('should support validation groups', () => {
      class TestDto {
        @IsPositive({ groups: ['create'] })
        value!: number;
      }

      const dto = new TestDto();
      dto.value = -5;

      // Without groups - should NOT validate (constraint has groups)
      const errors1 = validateSync(dto);
      expect(errors1).toHaveLength(0);

      // With matching group - should validate
      const errors2 = validateSync(dto, { groups: ['create'] });
      expect(errors2).toHaveLength(1);

      // With non-matching group - should skip
      const errors3 = validateSync(dto, { groups: ['update'] });
      expect(errors3).toHaveLength(0);
    });
  });

  describe('@IsNegative', () => {
    it('should pass for negative numbers', () => {
      class TestDto {
        @IsNegative()
        value!: number;
      }

      const dto1 = new TestDto();
      dto1.value = -1;
      expect(validateSync(dto1)).toHaveLength(0);

      const dto2 = new TestDto();
      dto2.value = -0.000001;
      expect(validateSync(dto2)).toHaveLength(0);

      const dto3 = new TestDto();
      dto3.value = -100;
      expect(validateSync(dto3)).toHaveLength(0);

      const dto4 = new TestDto();
      dto4.value = -999999.99;
      expect(validateSync(dto4)).toHaveLength(0);
    });

    it('should fail for zero', () => {
      class TestDto {
        @IsNegative()
        value!: number;
      }

      const dto = new TestDto();
      dto.value = 0;

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints?.max).toBeDefined();
      expect(errors[0].constraints?.max).toContain('negative');
    });

    it('should fail for positive numbers', () => {
      class TestDto {
        @IsNegative()
        value!: number;
      }

      const dto1 = new TestDto();
      dto1.value = 1;
      expect(validateSync(dto1)).toHaveLength(1);

      const dto2 = new TestDto();
      dto2.value = 0.000001;
      expect(validateSync(dto2)).toHaveLength(1);

      const dto3 = new TestDto();
      dto3.value = 100;
      expect(validateSync(dto3)).toHaveLength(1);
    });

    it('should support custom error message', () => {
      class TestDto {
        @IsNegative({ message: 'Value must be less than zero' })
        value!: number;
      }

      const dto = new TestDto();
      dto.value = 5;

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBe('Value must be less than zero');
    });

    it('should support validation groups', () => {
      class TestDto {
        @IsNegative({ groups: ['debit'] })
        value!: number;
      }

      const dto = new TestDto();
      dto.value = 5;

      // Without groups - should NOT validate (constraint has groups)
      const errors1 = validateSync(dto);
      expect(errors1).toHaveLength(0);

      // With matching group - should validate
      const errors2 = validateSync(dto, { groups: ['debit'] });
      expect(errors2).toHaveLength(1);

      // With non-matching group - should skip
      const errors3 = validateSync(dto, { groups: ['credit'] });
      expect(errors3).toHaveLength(0);
    });
  });

  describe('Combined positive/negative validation', () => {
    it('should validate both positive and negative constraints', () => {
      class TransactionDto {
        @IsPositive()
        credit!: number;

        @IsNegative()
        debit!: number;
      }

      const valid = new TransactionDto();
      valid.credit = 100;
      valid.debit = -50;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TransactionDto();
      invalid.credit = -100; // Should be positive
      invalid.debit = 50; // Should be negative

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(2);
      expect(errors.find(e => e.property === 'credit')).toBeDefined();
      expect(errors.find(e => e.property === 'debit')).toBeDefined();
    });
  });
});

