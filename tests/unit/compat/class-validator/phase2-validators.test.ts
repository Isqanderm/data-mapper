/**
 * Tests for Phase 2 validators (string, number, date)
 */

import { describe, it, expect } from 'vitest';
import {
  // Email & Web
  IsEmail,
  IsURL,
  IsUUID,
  IsJSON,
  // Format
  IsAlpha,
  IsAlphanumeric,
  IsHexColor,
  IsIP,
  // String Content
  Contains,
  NotContains,
  IsLowercase,
  IsUppercase,
  Matches,
  // Number
  IsDivisibleBy,
  IsDecimal,
  // Date
  MinDate,
  MaxDate,
  // Validation
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Phase 2 Validators', () => {
  describe('Email & Web Validators', () => {
    it('should validate email addresses', () => {
      class TestDto {
        @IsEmail()
        email!: string;
      }

      const valid = new TestDto();
      valid.email = 'test@example.com';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.email = 'not-an-email';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should validate URLs', () => {
      class TestDto {
        @IsURL()
        url!: string;
      }

      const valid = new TestDto();
      valid.url = 'https://example.com';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.url = 'not-a-url';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isURL).toBeDefined();
    });

    it('should validate UUIDs', () => {
      class TestDto {
        @IsUUID()
        id!: string;

        @IsUUID('4')
        uuid4!: string;
      }

      const valid = new TestDto();
      valid.id = '550e8400-e29b-41d4-a716-446655440000';
      valid.uuid4 = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.id = 'not-a-uuid';
      invalid.uuid4 = 'not-a-uuid';
      const errors = validateSync(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate JSON strings', () => {
      class TestDto {
        @IsJSON()
        data!: string;
      }

      const valid = new TestDto();
      valid.data = '{"key": "value"}';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.data = '{invalid json}';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isJSON).toBeDefined();
    });
  });

  describe('Format Validators', () => {
    it('should validate alphabetic strings', () => {
      class TestDto {
        @IsAlpha()
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'JohnDoe';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.name = 'John123';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isAlpha).toBeDefined();
    });

    it('should validate alphanumeric strings', () => {
      class TestDto {
        @IsAlphanumeric()
        username!: string;
      }

      const valid = new TestDto();
      valid.username = 'user123';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.username = 'user_123';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isAlphanumeric).toBeDefined();
    });

    it('should validate hex colors', () => {
      class TestDto {
        @IsHexColor()
        color!: string;
      }

      const valid = new TestDto();
      valid.color = '#FF5733';
      expect(validateSync(valid)).toHaveLength(0);

      const valid2 = new TestDto();
      valid2.color = '#F57';
      expect(validateSync(valid2)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.color = 'red';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isHexColor).toBeDefined();
    });

    it('should validate IP addresses', () => {
      class TestDto {
        @IsIP()
        ip!: string;

        @IsIP('4')
        ipv4!: string;
      }

      const valid = new TestDto();
      valid.ip = '192.168.1.1';
      valid.ipv4 = '192.168.1.1';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.ip = '999.999.999.999';
      invalid.ipv4 = '999.999.999.999';
      const errors = validateSync(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('String Content Validators', () => {
    it('should validate string contains', () => {
      class TestDto {
        @Contains('premium')
        sku!: string;
      }

      const valid = new TestDto();
      valid.sku = 'premium-product-123';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.sku = 'basic-product-123';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.contains).toBeDefined();
    });

    it('should validate string not contains', () => {
      class TestDto {
        @NotContains('test')
        name!: string;
      }

      const valid = new TestDto();
      valid.name = 'production-server';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.name = 'test-server';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.notContains).toBeDefined();
    });

    it('should validate lowercase strings', () => {
      class TestDto {
        @IsLowercase()
        slug!: string;
      }

      const valid = new TestDto();
      valid.slug = 'my-product-slug';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.slug = 'My-Product-Slug';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isLowercase).toBeDefined();
    });

    it('should validate uppercase strings', () => {
      class TestDto {
        @IsUppercase()
        code!: string;
      }

      const valid = new TestDto();
      valid.code = 'PRODUCT123';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.code = 'Product123';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isUppercase).toBeDefined();
    });

    it('should validate regex matches', () => {
      class TestDto {
        @Matches(/^[a-z0-9-]+$/)
        slug!: string;
      }

      const valid = new TestDto();
      valid.slug = 'my-product-123';
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.slug = 'My_Product_123';
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.matches).toBeDefined();
    });
  });

  describe('Number Validators', () => {
    it('should validate divisible by', () => {
      class TestDto {
        @IsDivisibleBy(5)
        quantity!: number;
      }

      const valid = new TestDto();
      valid.quantity = 15;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.quantity = 17;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDivisibleBy).toBeDefined();
    });

    it('should validate decimal numbers', () => {
      class TestDto {
        @IsDecimal()
        price!: number;
      }

      const valid = new TestDto();
      valid.price = 19.99;
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.price = 20;
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDecimal).toBeDefined();
    });
  });

  describe('Date Validators', () => {
    it('should validate minimum date', () => {
      class TestDto {
        @MinDate(new Date('2024-01-01'))
        startDate!: Date;
      }

      const valid = new TestDto();
      valid.startDate = new Date('2024-06-01');
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.startDate = new Date('2023-01-01');
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.minDate).toBeDefined();
    });

    it('should validate maximum date', () => {
      class TestDto {
        @MaxDate(new Date('2025-12-31'))
        endDate!: Date;
      }

      const valid = new TestDto();
      valid.endDate = new Date('2025-06-01');
      expect(validateSync(valid)).toHaveLength(0);

      const invalid = new TestDto();
      invalid.endDate = new Date('2026-01-01');
      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.maxDate).toBeDefined();
    });
  });
});

