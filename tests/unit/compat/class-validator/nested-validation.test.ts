/**
 * Tests for nested validation
 */

import { describe, it, expect } from 'vitest';
import {
  IsString,
  IsNumber,
  IsEmail,
  MinLength,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  validateSync,
} from '../../../../src/compat/class-validator';

describe('Nested Validation', () => {
  describe('Single Nested Object', () => {
    it('should validate nested object', () => {
      class AddressDto {
        @IsString()
        @MinLength(3)
        street!: string;

        @IsString()
        @MinLength(2)
        city!: string;

        @IsString()
        zipCode!: string;
      }

      class UserDto {
        @IsString()
        name!: string;

        @ValidateNested()
        address!: AddressDto;
      }

      const valid = new UserDto();
      valid.name = 'John Doe';
      valid.address = new AddressDto();
      valid.address.street = '123 Main St';
      valid.address.city = 'New York';
      valid.address.zipCode = '10001';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });

    it('should return nested validation errors', () => {
      class AddressDto {
        @IsString()
        @MinLength(3)
        street!: string;

        @IsString()
        @MinLength(2)
        city!: string;
      }

      class UserDto {
        @IsString()
        name!: string;

        @ValidateNested()
        address!: AddressDto;
      }

      const invalid = new UserDto();
      invalid.name = 'John Doe';
      invalid.address = new AddressDto();
      invalid.address.street = 'AB'; // Too short
      invalid.address.city = 'X'; // Too short

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('address');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children).toHaveLength(2);
      
      // Check nested error properties
      const nestedErrors = errors[0].children!;
      expect(nestedErrors.some(e => e.property === 'street')).toBe(true);
      expect(nestedErrors.some(e => e.property === 'city')).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      class CountryDto {
        @IsString()
        @MinLength(2)
        name!: string;

        @IsString()
        code!: string;
      }

      class CityDto {
        @IsString()
        name!: string;

        @ValidateNested()
        country!: CountryDto;
      }

      class AddressDto {
        @IsString()
        street!: string;

        @ValidateNested()
        city!: CityDto;
      }

      class UserDto {
        @IsString()
        name!: string;

        @ValidateNested()
        address!: AddressDto;
      }

      const valid = new UserDto();
      valid.name = 'John Doe';
      valid.address = new AddressDto();
      valid.address.street = '123 Main St';
      valid.address.city = new CityDto();
      valid.address.city.name = 'New York';
      valid.address.city.country = new CountryDto();
      valid.address.city.country.name = 'United States';
      valid.address.city.country.code = 'US';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Array of Nested Objects', () => {
    it('should validate array of nested objects', () => {
      class ItemDto {
        @IsString()
        @MinLength(2)
        name!: string;

        @IsNumber()
        @Min(0)
        price!: number;
      }

      class OrderDto {
        @IsString()
        orderId!: string;

        @ValidateNested()
        @IsArray()
        items!: ItemDto[];
      }

      const valid = new OrderDto();
      valid.orderId = 'ORD-001';
      valid.items = [
        Object.assign(new ItemDto(), { name: 'Item 1', price: 10 }),
        Object.assign(new ItemDto(), { name: 'Item 2', price: 20 }),
      ];

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid items in array', () => {
      class ItemDto {
        @IsString()
        @MinLength(2)
        name!: string;

        @IsNumber()
        @Min(0)
        price!: number;
      }

      class OrderDto {
        @IsString()
        orderId!: string;

        @ValidateNested()
        @IsArray()
        items!: ItemDto[];
      }

      const invalid = new OrderDto();
      invalid.orderId = 'ORD-001';
      invalid.items = [
        Object.assign(new ItemDto(), { name: 'A', price: 10 }), // Name too short
        Object.assign(new ItemDto(), { name: 'Item 2', price: -5 }), // Negative price
      ];

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('items');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children!.length).toBeGreaterThan(0);

      // Check that errors have array indices in property names
      const nestedErrors = errors[0].children!;
      expect(nestedErrors.some(e => e.property.includes('[0]'))).toBe(true);
      expect(nestedErrors.some(e => e.property.includes('[1]'))).toBe(true);
    });

    it('should validate complex nested array structures', () => {
      class TagDto {
        @IsString()
        @MinLength(1)
        name!: string;
      }

      class ProductDto {
        @IsString()
        name!: string;

        @IsNumber()
        @Min(0)
        price!: number;

        @ValidateNested()
        @IsArray()
        tags!: TagDto[];
      }

      class CategoryDto {
        @IsString()
        name!: string;

        @ValidateNested()
        @IsArray()
        products!: ProductDto[];
      }

      const valid = new CategoryDto();
      valid.name = 'Electronics';
      valid.products = [
        Object.assign(new ProductDto(), {
          name: 'Laptop',
          price: 999,
          tags: [
            Object.assign(new TagDto(), { name: 'computer' }),
            Object.assign(new TagDto(), { name: 'portable' }),
          ],
        }),
      ];

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Mixed Validation', () => {
    it('should validate both property constraints and nested objects', () => {
      class ContactDto {
        @IsEmail()
        email!: string;

        @IsString()
        @MinLength(10)
        phone!: string;
      }

      class UserDto {
        @IsString()
        @MinLength(3)
        name!: string;

        @IsNumber()
        @Min(18)
        @Max(120)
        age!: number;

        @ValidateNested()
        contact!: ContactDto;
      }

      const valid = new UserDto();
      valid.name = 'John Doe';
      valid.age = 30;
      valid.contact = new ContactDto();
      valid.contact.email = 'john@example.com';
      valid.contact.phone = '1234567890';

      const errors = validateSync(valid);
      expect(errors).toHaveLength(0);
    });

    it('should return both property and nested errors', () => {
      class ContactDto {
        @IsEmail()
        email!: string;
      }

      class UserDto {
        @IsString()
        @MinLength(3)
        name!: string;

        @ValidateNested()
        contact!: ContactDto;
      }

      const invalid = new UserDto();
      invalid.name = 'AB'; // Too short
      invalid.contact = new ContactDto();
      invalid.contact.email = 'invalid-email'; // Invalid email

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(2);
      
      // One error for name, one for contact
      expect(errors.some(e => e.property === 'name')).toBe(true);
      expect(errors.some(e => e.property === 'contact')).toBe(true);
      
      // Contact error should have children
      const contactError = errors.find(e => e.property === 'contact');
      expect(contactError?.children).toBeDefined();
      expect(contactError?.children).toHaveLength(1);
    });
  });
});

