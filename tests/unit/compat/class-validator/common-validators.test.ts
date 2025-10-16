/**
 * Tests for common validators (comparison, object, geographic)
 */

import { describe, it, expect } from 'vitest';
import {
  // Comparison
  Equals,
  NotEquals,
  IsIn,
  IsNotIn,
  IsEmpty,
  // Object
  IsNotEmptyObject,
  // Geographic
  IsLatLong,
  IsLatitude,
  IsLongitude,
  // Validation
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Common Validators', () => {
  describe('Comparison Validators', () => {
    it('should validate equals', () => {
      class TestDto {
        @Equals(true)
        acceptedTerms!: boolean;

        @Equals('active')
        status!: string;

        @Equals(42)
        answer!: number;
      }

      const valid = new TestDto();
      valid.acceptedTerms = true;
      valid.status = 'active';
      valid.answer = 42;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.acceptedTerms = false;
      invalid.status = 'inactive';
      invalid.answer = 41;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(3);
      expect(errors[0].constraints?.equals).toBeDefined();
      expect(errors[1].constraints?.equals).toBeDefined();
      expect(errors[2].constraints?.equals).toBeDefined();
    });

    it('should validate not equals', () => {
      class TestDto {
        @NotEquals('admin')
        username!: string;

        @NotEquals(0)
        count!: number;
      }

      const valid = new TestDto();
      valid.username = 'user123';
      valid.count = 5;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.username = 'admin';
      invalid.count = 0;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(2);
      expect(errors[0].constraints?.notEquals).toBeDefined();
      expect(errors[1].constraints?.notEquals).toBeDefined();
    });

    it('should validate is in array', () => {
      class TestDto {
        @IsIn(['draft', 'published', 'archived'])
        status!: string;

        @IsIn([1, 2, 3, 4, 5])
        rating!: number;
      }

      const valid = new TestDto();
      valid.status = 'published';
      valid.rating = 4;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.status = 'pending';
      invalid.rating = 10;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(2);
      expect(errors[0].constraints?.isIn).toBeDefined();
      expect(errors[1].constraints?.isIn).toBeDefined();
    });

    it('should validate is not in array', () => {
      class TestDto {
        @IsNotIn(['admin', 'root', 'superuser'])
        username!: string;

        @IsNotIn([13, 666])
        luckyNumber!: number;
      }

      const valid = new TestDto();
      valid.username = 'user123';
      valid.luckyNumber = 7;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.username = 'admin';
      invalid.luckyNumber = 666;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(2);
      expect(errors[0].constraints?.isNotIn).toBeDefined();
      expect(errors[1].constraints?.isNotIn).toBeDefined();
    });

    it('should validate is empty', () => {
      class TestDto {
        @IsEmpty()
        emptyString!: string;

        @IsEmpty()
        emptyArray!: any[];

        @IsEmpty()
        emptyObject!: Record<string, any>;
      }

      const valid = new TestDto();
      valid.emptyString = '';
      valid.emptyArray = [];
      valid.emptyObject = {};
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.emptyString = 'not empty';
      invalid.emptyArray = [1, 2, 3];
      invalid.emptyObject = { key: 'value' };
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(3);
      expect(errors[0].constraints?.isEmpty).toBeDefined();
      expect(errors[1].constraints?.isEmpty).toBeDefined();
      expect(errors[2].constraints?.isEmpty).toBeDefined();
    });

    it('should handle null and undefined for isEmpty', () => {
      class TestDto {
        @IsEmpty()
        value!: any;
      }

      const validNull = new TestDto();
      validNull.value = null;
      expect(validateSync(validNull)).toHaveLength(0);

      const validUndefined = new TestDto();
      validUndefined.value = undefined;
      expect(validateSync(validUndefined)).toHaveLength(0);
    });
  });

  describe('Object Validators', () => {
    it('should validate is not empty object', () => {
      class TestDto {
        @IsNotEmptyObject()
        settings!: Record<string, any>;
      }

      const valid = new TestDto();
      valid.settings = { theme: 'dark' };
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.settings = {};
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmptyObject).toBeDefined();
    });

    it('should not validate arrays as objects for isNotEmptyObject', () => {
      class TestDto {
        @IsNotEmptyObject()
        data!: any;
      }

      const dto = new TestDto();
      dto.data = [1, 2, 3];
      // Arrays should not be validated by isNotEmptyObject
      // The validator only checks plain objects
      const errors = validateSync(dto);
      // Should pass because it's not checking arrays
      expect(errors).toHaveLength(0);
    });
  });

  describe('Geographic Validators', () => {
    it('should validate latitude,longitude string', () => {
      class TestDto {
        @IsLatLong()
        coordinates!: string;
      }

      const valid1 = new TestDto();
      valid1.coordinates = '40.7128,-74.0060';
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.coordinates = '-33.8688,151.2093';
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.coordinates = '0,0';
      expect(validateSync(valid3)).toHaveLength(0);

      const invalid1 = new TestDto();
      invalid1.coordinates = '91,0'; // Invalid latitude
      const errors1 = validateSync(invalid1);
      expect(errors1).toHaveLength(1);
      expect(errors1[0].constraints?.isLatLong).toBeDefined();

      const invalid2 = new TestDto();
      invalid2.coordinates = '0,181'; // Invalid longitude
      const errors2 = validateSync(invalid2);
      expect(errors2).toHaveLength(1);
      expect(errors2[0].constraints?.isLatLong).toBeDefined();

      const invalid3 = new TestDto();
      invalid3.coordinates = 'not-coordinates';
      const errors3 = validateSync(invalid3);
      expect(errors3).toHaveLength(1);
      expect(errors3[0].constraints?.isLatLong).toBeDefined();
    });

    it('should validate latitude', () => {
      class TestDto {
        @IsLatitude()
        latitude!: number;
      }

      const valid1 = new TestDto();
      valid1.latitude = 40.7128;
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.latitude = -90;
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.latitude = 90;
      expect(validateSync(valid3)).toHaveLength(0);

      const valid4 = new TestDto();
      valid4.latitude = 0;
      expect(validateSync(valid4)).toHaveLength(0);

      const invalid1 = new TestDto();
      invalid1.latitude = 91;
      const errors1 = validateSync(invalid1);
      expect(errors1).toHaveLength(1);
      expect(errors1[0].constraints?.isLatitude).toBeDefined();

      const invalid2 = new TestDto();
      invalid2.latitude = -91;
      const errors2 = validateSync(invalid2);
      expect(errors2).toHaveLength(1);
      expect(errors2[0].constraints?.isLatitude).toBeDefined();
    });

    it('should validate latitude as string', () => {
      class TestDto {
        @IsLatitude()
        latitude!: any;
      }

      const valid = new TestDto();
      valid.latitude = '40.7128';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.latitude = '91';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isLatitude).toBeDefined();
    });

    it('should validate longitude', () => {
      class TestDto {
        @IsLongitude()
        longitude!: number;
      }

      const valid1 = new TestDto();
      valid1.longitude = -74.0060;
      expect(validateSync(valid1)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.longitude = -180;
      expect(validateSync(valid2)).toHaveLength(0);

      const valid3 = new TestDto();
      valid3.longitude = 180;
      expect(validateSync(valid3)).toHaveLength(0);

      const valid4 = new TestDto();
      valid4.longitude = 0;
      expect(validateSync(valid4)).toHaveLength(0);

      const invalid1 = new TestDto();
      invalid1.longitude = 181;
      const errors1 = validateSync(invalid1);
      expect(errors1).toHaveLength(1);
      expect(errors1[0].constraints?.isLongitude).toBeDefined();

      const invalid2 = new TestDto();
      invalid2.longitude = -181;
      const errors2 = validateSync(invalid2);
      expect(errors2).toHaveLength(1);
      expect(errors2[0].constraints?.isLongitude).toBeDefined();
    });

    it('should validate longitude as string', () => {
      class TestDto {
        @IsLongitude()
        longitude!: any;
      }

      const valid = new TestDto();
      valid.longitude = '-74.0060';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.longitude = '181';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isLongitude).toBeDefined();
    });
  });
});

