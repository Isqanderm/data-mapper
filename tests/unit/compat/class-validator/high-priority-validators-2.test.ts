/**
 * Tests for high priority validators (part 2)
 */

import { describe, it, expect } from 'vitest';
import {
  IsJWT,
  IsStrongPassword,
  IsPort,
  IsMACAddress,
  IsBase64,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('class-validator-compat - High Priority Validators (Part 2)', () => {
  describe('@IsJWT', () => {
    it('should validate JWT tokens', async () => {
      class TestDto {
        @IsJWT()
        token!: string;
      }

      const valid = new TestDto();
      valid.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid JWT tokens', async () => {
      class TestDto {
        @IsJWT()
        token!: string;
      }

      const invalid = new TestDto();
      invalid.token = 'invalid@token.here';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('token');
      expect(errors[0].constraints).toHaveProperty('isJWT');
    });

    it('should fail for tokens with only two parts', async () => {
      class TestDto {
        @IsJWT()
        token!: string;
      }

      const invalid = new TestDto();
      invalid.token = 'header.payload';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });
  });

  describe('@IsStrongPassword', () => {
    it('should validate strong passwords', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const valid = new TestDto();
      valid.password = 'MyP@ssw0rd!';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for passwords without uppercase', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const invalid = new TestDto();
      invalid.password = 'myp@ssw0rd!';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail for passwords without lowercase', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const invalid = new TestDto();
      invalid.password = 'MYP@SSW0RD!';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });

    it('should fail for passwords without numbers', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const invalid = new TestDto();
      invalid.password = 'MyP@ssword!';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });

    it('should fail for passwords without special characters', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const invalid = new TestDto();
      invalid.password = 'MyPassw0rd';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });

    it('should fail for passwords shorter than 8 characters', async () => {
      class TestDto {
        @IsStrongPassword()
        password!: string;
      }

      const invalid = new TestDto();
      invalid.password = 'MyP@s1';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });
  });

  describe('@IsPort', () => {
    it('should validate port numbers', async () => {
      class TestDto {
        @IsPort()
        port!: string;
      }

      const valid = new TestDto();
      valid.port = '8080';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate well-known ports', async () => {
      class TestDto {
        @IsPort()
        port!: string;
      }

      const valid = new TestDto();
      valid.port = '443';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for ports above 65535', async () => {
      class TestDto {
        @IsPort()
        port!: string;
      }

      const invalid = new TestDto();
      invalid.port = '70000';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('port');
      expect(errors[0].constraints).toHaveProperty('isPort');
    });

    it('should fail for negative ports', async () => {
      class TestDto {
        @IsPort()
        port!: string;
      }

      const invalid = new TestDto();
      invalid.port = '-1';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });

    it('should fail for non-numeric ports', async () => {
      class TestDto {
        @IsPort()
        port!: string;
      }

      const invalid = new TestDto();
      invalid.port = 'abc';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
    });
  });

  describe('@IsMACAddress', () => {
    it('should validate MAC addresses with colons', async () => {
      class TestDto {
        @IsMACAddress()
        mac!: string;
      }

      const valid = new TestDto();
      valid.mac = '00:1B:44:11:3A:B7';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate MAC addresses with hyphens', async () => {
      class TestDto {
        @IsMACAddress()
        mac!: string;
      }

      const valid = new TestDto();
      valid.mac = '00-1B-44-11-3A-B7';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid MAC addresses', async () => {
      class TestDto {
        @IsMACAddress()
        mac!: string;
      }

      const invalid = new TestDto();
      invalid.mac = '00:1B:44:11:3A';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mac');
      expect(errors[0].constraints).toHaveProperty('isMACAddress');
    });
  });

  describe('@IsBase64', () => {
    it('should validate base64 strings', async () => {
      class TestDto {
        @IsBase64()
        content!: string;
      }

      const valid = new TestDto();
      valid.content = 'SGVsbG8gV29ybGQ=';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate base64 without padding', async () => {
      class TestDto {
        @IsBase64()
        content!: string;
      }

      const valid = new TestDto();
      valid.content = 'SGVsbG8gV29ybGQ';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid base64 strings', async () => {
      class TestDto {
        @IsBase64()
        content!: string;
      }

      const invalid = new TestDto();
      invalid.content = 'Not@Base64!';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isBase64');
    });
  });

  describe('Sync validation', () => {
    it('should work with validateSync', () => {
      class TestDto {
        @IsJWT()
        token!: string;

        @IsPort()
        port!: string;
      }

      const valid = new TestDto();
      valid.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      valid.port = '3000';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });
  });
});

