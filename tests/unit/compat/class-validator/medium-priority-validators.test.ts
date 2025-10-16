/**
 * Tests for medium priority validators - Banking, Crypto, Documents
 */

import { describe, it, expect } from 'vitest';
import {
  IsIBAN,
  IsBIC,
  IsCurrency,
  IsISO4217CurrencyCode,
  IsEthereumAddress,
  IsBtcAddress,
  IsPassportNumber,
  IsIdentityCard,
  IsEAN,
  IsISIN,
  validate,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('class-validator-compat - Medium Priority Validators (Banking & Crypto)', () => {
  // ============================================================================
  // Banking & Financial
  // ============================================================================

  describe('@IsIBAN', () => {
    it('should validate valid IBAN', async () => {
      class BankAccountDto {
        @IsIBAN()
        iban!: string;
      }

      const valid = new BankAccountDto();
      valid.iban = 'GB82WEST12345698765432';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid IBAN', async () => {
      class BankAccountDto {
        @IsIBAN()
        iban!: string;
      }

      const invalid = new BankAccountDto();
      invalid.iban = 'INVALID';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('iban');
      expect(errors[0].constraints).toHaveProperty('isIBAN');
    });
  });

  describe('@IsBIC', () => {
    it('should validate valid BIC/SWIFT code', async () => {
      class BankDto {
        @IsBIC()
        swift!: string;
      }

      const valid = new BankDto();
      valid.swift = 'DEUTDEFF';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate BIC with branch code', async () => {
      class BankDto {
        @IsBIC()
        swift!: string;
      }

      const valid = new BankDto();
      valid.swift = 'DEUTDEFF500';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid BIC', async () => {
      class BankDto {
        @IsBIC()
        swift!: string;
      }

      const invalid = new BankDto();
      invalid.swift = 'INVALID';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('swift');
      expect(errors[0].constraints).toHaveProperty('isBIC');
    });
  });

  describe('@IsCurrency', () => {
    it('should validate currency with dollar sign', async () => {
      class PriceDto {
        @IsCurrency()
        price!: string;
      }

      const valid = new PriceDto();
      valid.price = '$100.00';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate currency without symbol', async () => {
      class PriceDto {
        @IsCurrency()
        price!: string;
      }

      const valid = new PriceDto();
      valid.price = '1,234.56';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid currency', async () => {
      class PriceDto {
        @IsCurrency()
        price!: string;
      }

      const invalid = new PriceDto();
      invalid.price = 'not-a-price';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('price');
      expect(errors[0].constraints).toHaveProperty('isCurrency');
    });
  });

  describe('@IsISO4217CurrencyCode', () => {
    it('should validate valid currency codes', async () => {
      class CurrencyDto {
        @IsISO4217CurrencyCode()
        code!: string;
      }

      const valid = new CurrencyDto();
      valid.code = 'USD';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid currency code', async () => {
      class CurrencyDto {
        @IsISO4217CurrencyCode()
        code!: string;
      }

      const invalid = new CurrencyDto();
      invalid.code = 'US';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('code');
      expect(errors[0].constraints).toHaveProperty('isISO4217CurrencyCode');
    });
  });

  // ============================================================================
  // Cryptocurrency
  // ============================================================================

  describe('@IsEthereumAddress', () => {
    it('should validate valid Ethereum address', async () => {
      class WalletDto {
        @IsEthereumAddress()
        address!: string;
      }

      const valid = new WalletDto();
      valid.address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid Ethereum address', async () => {
      class WalletDto {
        @IsEthereumAddress()
        address!: string;
      }

      const invalid = new WalletDto();
      invalid.address = '0xinvalid';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('address');
      expect(errors[0].constraints).toHaveProperty('isEthereumAddress');
    });
  });

  describe('@IsBtcAddress', () => {
    it('should validate legacy Bitcoin address', async () => {
      class WalletDto {
        @IsBtcAddress()
        address!: string;
      }

      const valid = new WalletDto();
      valid.address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate SegWit Bitcoin address', async () => {
      class WalletDto {
        @IsBtcAddress()
        address!: string;
      }

      const valid = new WalletDto();
      valid.address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid Bitcoin address', async () => {
      class WalletDto {
        @IsBtcAddress()
        address!: string;
      }

      const invalid = new WalletDto();
      invalid.address = 'invalid';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('address');
      expect(errors[0].constraints).toHaveProperty('isBtcAddress');
    });
  });

  // ============================================================================
  // Documents & Identifiers
  // ============================================================================

  describe('@IsPassportNumber', () => {
    it('should validate US passport number', async () => {
      class PersonDto {
        @IsPassportNumber('US')
        passport!: string;
      }

      const valid = new PersonDto();
      valid.passport = '123456789';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate generic passport number', async () => {
      class PersonDto {
        @IsPassportNumber()
        passport!: string;
      }

      const valid = new PersonDto();
      valid.passport = 'AB123456';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid passport number', async () => {
      class PersonDto {
        @IsPassportNumber('US')
        passport!: string;
      }

      const invalid = new PersonDto();
      invalid.passport = 'ABC';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('passport');
      expect(errors[0].constraints).toHaveProperty('isPassportNumber');
    });
  });

  describe('@IsIdentityCard', () => {
    it('should validate identity card number', async () => {
      class PersonDto {
        @IsIdentityCard()
        idCard!: string;
      }

      const valid = new PersonDto();
      valid.idCard = 'AB12345678';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid identity card', async () => {
      class PersonDto {
        @IsIdentityCard()
        idCard!: string;
      }

      const invalid = new PersonDto();
      invalid.idCard = 'ABC';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('idCard');
      expect(errors[0].constraints).toHaveProperty('isIdentityCard');
    });
  });

  describe('@IsEAN', () => {
    it('should validate EAN-8', async () => {
      class ProductDto {
        @IsEAN()
        barcode!: string;
      }

      const valid = new ProductDto();
      valid.barcode = '12345678';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should validate EAN-13', async () => {
      class ProductDto {
        @IsEAN()
        barcode!: string;
      }

      const valid = new ProductDto();
      valid.barcode = '1234567890123';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid EAN', async () => {
      class ProductDto {
        @IsEAN()
        barcode!: string;
      }

      const invalid = new ProductDto();
      invalid.barcode = '123';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('barcode');
      expect(errors[0].constraints).toHaveProperty('isEAN');
    });
  });

  describe('@IsISIN', () => {
    it('should validate valid ISIN', async () => {
      class SecurityDto {
        @IsISIN()
        isin!: string;
      }

      const valid = new SecurityDto();
      valid.isin = 'US0378331005';

      const errors = await validate(valid);
      expect(errors).toHaveLength(0);
    });

    it('should fail for invalid ISIN', async () => {
      class SecurityDto {
        @IsISIN()
        isin!: string;
      }

      const invalid = new SecurityDto();
      invalid.isin = 'INVALID';

      const errors = await validate(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('isin');
      expect(errors[0].constraints).toHaveProperty('isISIN');
    });
  });

  describe('Sync validation', () => {
    it('should work with validateSync', () => {
      class TestDto {
        @IsIBAN()
        iban!: string;

        @IsEthereumAddress()
        ethAddress!: string;
      }

      const valid = new TestDto();
      valid.iban = 'GB82WEST12345698765432';
      valid.ethAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });
  });
});
