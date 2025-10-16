/**
 * Tests for high priority validators
 */

import { describe, it, expect } from 'vitest';
import {
  IsFQDN,
  IsISO8601,
  IsDateString,
  IsMobilePhone,
  IsPostalCode,
  IsMongoId,
  IsJWT,
  IsStrongPassword,
  IsPort,
  IsMACAddress,
  IsBase64,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('class-validator-compat - High Priority Validators', () => {
  describe('@IsFQDN', () => {
    it('should validate valid domain names', async () => {
      class TestDto {
        @IsFQDN()
        domain!: string;
      }

      const valid = new TestDto();
      valid.domain = 'example.com';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate subdomains', async () => {
      class TestDto {
        @IsFQDN()
        domain!: string;
      }

      const valid = new TestDto();
      valid.domain = 'subdomain.example.com';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid domain names', async () => {
      class TestDto {
        @IsFQDN()
        domain!: string;
      }

      const invalid = new TestDto();
      invalid.domain = 'not a domain';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('domain');
      expect(errors[0].constraints).toHaveProperty('isFQDN');
    });

    it('should fail for URLs with protocol', async () => {
      class TestDto {
        @IsFQDN()
        domain!: string;
      }

      const invalid = new TestDto();
      invalid.domain = 'http://example.com';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });
  });

  describe('@IsISO8601', () => {
    it('should validate ISO 8601 date strings', async () => {
      class TestDto {
        @IsISO8601()
        date!: string;
      }

      const valid = new TestDto();
      valid.date = '2024-01-15T10:30:00Z';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate date-only ISO 8601 strings', async () => {
      class TestDto {
        @IsISO8601()
        date!: string;
      }

      const valid = new TestDto();
      valid.date = '2024-01-15';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid date strings', async () => {
      class TestDto {
        @IsISO8601()
        date!: string;
      }

      const invalid = new TestDto();
      invalid.date = '15/01/2024';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('date');
      expect(errors[0].constraints).toHaveProperty('isISO8601');
    });
  });

  describe('@IsDateString', () => {
    it('should work as alias for IsISO8601', async () => {
      class TestDto {
        @IsDateString()
        date!: string;
      }

      const valid = new TestDto();
      valid.date = '2024-01-15T10:30:00Z';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });
  });

  describe('@IsMobilePhone', () => {
    it('should validate phone numbers', async () => {
      class TestDto {
        @IsMobilePhone()
        phone!: string;
      }

      const valid = new TestDto();
      valid.phone = '+1-555-123-4567';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate simple phone numbers', async () => {
      class TestDto {
        @IsMobilePhone()
        phone!: string;
      }

      const valid = new TestDto();
      valid.phone = '5551234567';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid phone numbers', async () => {
      class TestDto {
        @IsMobilePhone()
        phone!: string;
      }

      const invalid = new TestDto();
      invalid.phone = 'not-a-phone';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('phone');
      expect(errors[0].constraints).toHaveProperty('isMobilePhone');
    });
  });

  describe('@IsPostalCode', () => {
    it('should validate US postal codes', async () => {
      class TestDto {
        @IsPostalCode('US')
        zip!: string;
      }

      const valid = new TestDto();
      valid.zip = '12345';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate US ZIP+4 codes', async () => {
      class TestDto {
        @IsPostalCode('US')
        zip!: string;
      }

      const valid = new TestDto();
      valid.zip = '12345-6789';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate Russian postal codes', async () => {
      class TestDto {
        @IsPostalCode('RU')
        zip!: string;
      }

      const valid = new TestDto();
      valid.zip = '123456';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid postal codes', async () => {
      class TestDto {
        @IsPostalCode('US')
        zip!: string;
      }

      const invalid = new TestDto();
      invalid.zip = 'ABCDE';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('zip');
      expect(errors[0].constraints).toHaveProperty('isPostalCode');
    });
  });

  describe('@IsMongoId', () => {
    it('should validate MongoDB ObjectIds', async () => {
      class TestDto {
        @IsMongoId()
        id!: string;
      }

      const valid = new TestDto();
      valid.id = '507f1f77bcf86cd799439011';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid MongoDB IDs', async () => {
      class TestDto {
        @IsMongoId()
        id!: string;
      }

      const invalid = new TestDto();
      invalid.id = 'not-a-mongo-id';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isMongoId');
    });

    it('should fail for IDs with wrong length', async () => {
      class TestDto {
        @IsMongoId()
        id!: string;
      }

      const invalid = new TestDto();
      invalid.id = '507f1f77bcf86cd7994390';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });
  });
});

