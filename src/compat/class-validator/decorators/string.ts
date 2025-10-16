/**
 * String validation decorators
 * Using TC39 Stage 3 decorators
 */

import { addValidationConstraint } from '../engine/metadata';
import type { ValidationDecoratorOptions } from '../types';

/**
 * Checks if value is a string
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 * ```
 */
export function IsString(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isString',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length is not less than given number
 *
 * @param min - Minimum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MinLength(3)
 *   name: string;
 * }
 * ```
 */
export function MinLength(min: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'minLength',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length is not more than given number
 *
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MaxLength(50)
 *   name: string;
 * }
 * ```
 */
export function MaxLength(max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'maxLength',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string's length falls in a range
 *
 * @param min - Minimum length
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Length(3, 50)
 *   name: string;
 * }
 * ```
 */
export function Length(min: number, max: number, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      // Add both min and max constraints
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'minLength',
        value: min,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });

      addValidationConstraint(this.constructor, propertyKey, {
        type: 'maxLength',
        value: max,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Email & Web Validators
// ============================================================================

/**
 * Checks if string is a valid email address
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsEmail()
 *   email: string;
 * }
 * ```
 */
export function IsEmail(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isEmail',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid URL
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class WebsiteDto {
 *   @IsURL()
 *   url: string;
 * }
 * ```
 */
export function IsURL(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isURL',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid UUID (v3, v4, or v5)
 *
 * @param version - UUID version (3, 4, or 5). If not specified, validates any version
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EntityDto {
 *   @IsUUID()
 *   id: string;
 *
 *   @IsUUID('4')
 *   uuid4: string;
 * }
 * ```
 */
export function IsUUID(version?: '3' | '4' | '5' | 'all', options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isUUID',
        value: version || 'all',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is valid JSON
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ConfigDto {
 *   @IsJSON()
 *   settings: string;
 * }
 * ```
 */
export function IsJSON(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isJSON',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Format Validators
// ============================================================================

/**
 * Checks if string contains only letters (a-zA-Z)
 *
 * @param locale - Locale for alpha validation (optional)
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsAlpha()
 *   firstName: string;
 * }
 * ```
 */
export function IsAlpha(locale?: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isAlpha',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string contains only letters and numbers
 *
 * @param locale - Locale for alphanumeric validation (optional)
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsAlphanumeric()
 *   username: string;
 * }
 * ```
 */
export function IsAlphanumeric(locale?: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isAlphanumeric',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid hex color
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ThemeDto {
 *   @IsHexColor()
 *   primaryColor: string; // e.g., "#FF5733" or "#F57"
 * }
 * ```
 */
export function IsHexColor(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isHexColor',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid IP address (v4 or v6)
 *
 * @param version - IP version (4 or 6). If not specified, validates both
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ServerDto {
 *   @IsIP()
 *   ipAddress: string;
 *
 *   @IsIP('4')
 *   ipv4Address: string;
 * }
 * ```
 */
export function IsIP(version?: '4' | '6', options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isIP',
        value: version,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Specialized Validators
// ============================================================================

/**
 * Checks if string is a valid credit card number (Luhn algorithm)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PaymentDto {
 *   @IsCreditCard()
 *   cardNumber: string;
 * }
 * ```
 */
export function IsCreditCard(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isCreditCard',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid ISBN (ISBN-10 or ISBN-13)
 *
 * @param version - ISBN version (10 or 13). If not specified, validates both
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class BookDto {
 *   @IsISBN()
 *   isbn: string;
 *
 *   @IsISBN('13')
 *   isbn13: string;
 * }
 * ```
 */
export function IsISBN(version?: '10' | '13', options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISBN',
        value: version,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid phone number (international format)
 *
 * @param region - Region code (e.g., 'US', 'GB'). If not specified, validates international format
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ContactDto {
 *   @IsPhoneNumber()
 *   phone: string;
 *
 *   @IsPhoneNumber('US')
 *   usPhone: string;
 * }
 * ```
 */
export function IsPhoneNumber(region?: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isPhoneNumber',
        value: region,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// String Content Validators
// ============================================================================

/**
 * Checks if string contains the specified substring
 *
 * @param seed - Substring that must be present
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @Contains('premium')
 *   sku: string;
 * }
 * ```
 */
export function Contains(seed: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'contains',
        value: seed,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string does not contain the specified substring
 *
 * @param seed - Substring that must not be present
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @NotContains('admin')
 *   username: string;
 * }
 * ```
 */
export function NotContains(seed: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'notContains',
        value: seed,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string contains only lowercase characters
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsLowercase()
 *   username: string;
 * }
 * ```
 */
export function IsLowercase(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isLowercase',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string contains only uppercase characters
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsUppercase()
 *   code: string;
 * }
 * ```
 */
export function IsUppercase(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isUppercase',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string matches the specified regular expression
 *
 * @param pattern - Regular expression pattern
 * @param modifiers - Regular expression modifiers (optional)
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Matches(/^[a-z0-9]+$/)
 *   username: string;
 *
 *   @Matches(/^[A-Z]/, 'i')
 *   name: string;
 * }
 * ```
 */
export function Matches(
  pattern: RegExp | string,
  modifiers?: string,
  options?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'matches',
        value: {
          pattern: pattern instanceof RegExp ? pattern.source : pattern,
          modifiers: pattern instanceof RegExp ? pattern.flags : modifiers,
        },
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// High Priority Validators
// ============================================================================

/**
 * Checks if string is a fully qualified domain name (e.g., domain.com)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class WebsiteDto {
 *   @IsFQDN()
 *   domain: string; // e.g., "example.com"
 * }
 * ```
 */
export function IsFQDN(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isFQDN',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid ISO 8601 date
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsISO8601()
 *   startDate: string; // e.g., "2024-01-15T10:30:00Z"
 * }
 * ```
 */
export function IsISO8601(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISO8601',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Alias for @IsISO8601()
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsDateString()
 *   createdAt: string;
 * }
 * ```
 */
export function IsDateString(options?: ValidationDecoratorOptions) {
  return IsISO8601(options);
}

/**
 * Checks if string is a valid mobile phone number
 *
 * @param locale - Optional locale (e.g., 'en-US', 'ru-RU')
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsMobilePhone('en-US')
 *   phone: string; // e.g., "+1-555-123-4567"
 * }
 * ```
 */
export function IsMobilePhone(locale?: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isMobilePhone',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid postal code
 *
 * @param locale - Optional locale (e.g., 'US', 'RU', 'GB')
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class AddressDto {
 *   @IsPostalCode('US')
 *   zipCode: string; // e.g., "12345" or "12345-6789"
 * }
 * ```
 */
export function IsPostalCode(locale?: string, options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isPostalCode',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid MongoDB ObjectId
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EntityDto {
 *   @IsMongoId()
 *   id: string; // e.g., "507f1f77bcf86cd799439011"
 * }
 * ```
 */
export function IsMongoId(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isMongoId',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid JWT token
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class AuthDto {
 *   @IsJWT()
 *   token: string;
 * }
 * ```
 */
export function IsJWT(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isJWT',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a strong password
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsStrongPassword()
 *   password: string; // Must have uppercase, lowercase, number, and special char
 * }
 * ```
 */
export function IsStrongPassword(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isStrongPassword',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid port number
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ServerDto {
 *   @IsPort()
 *   port: string; // e.g., "8080", "443"
 * }
 * ```
 */
export function IsPort(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isPort',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is a valid MAC address
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class DeviceDto {
 *   @IsMACAddress()
 *   macAddress: string; // e.g., "00:1B:44:11:3A:B7"
 * }
 * ```
 */
export function IsMACAddress(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isMACAddress',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if string is base64 encoded
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class FileDto {
 *   @IsBase64()
 *   content: string;
 * }
 * ```
 */
export function IsBase64(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isBase64',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Medium Priority Validators - Banking & Financial
// ============================================================================

/**
 * Checks if the string is a valid IBAN (International Bank Account Number).
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class BankAccountDto {
 *   @IsIBAN()
 *   accountNumber: string;
 * }
 * ```
 */
export function IsIBAN(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isIBAN',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid BIC (Bank Identifier Code) or SWIFT code.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class BankDto {
 *   @IsBIC()
 *   swiftCode: string;
 * }
 * ```
 */
export function IsBIC(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isBIC',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid currency amount.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PriceDto {
 *   @IsCurrency()
 *   price: string; // e.g., "$100.00", "€50.99"
 * }
 * ```
 */
export function IsCurrency(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isCurrency',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid ISO 4217 currency code.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class CurrencyDto {
 *   @IsISO4217CurrencyCode()
 *   code: string; // e.g., "USD", "EUR", "RUB"
 * }
 * ```
 */
export function IsISO4217CurrencyCode(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISO4217CurrencyCode',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Medium Priority Validators - Cryptocurrency
// ============================================================================

/**
 * Checks if the string is a valid Ethereum address.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class WalletDto {
 *   @IsEthereumAddress()
 *   address: string;
 * }
 * ```
 */
export function IsEthereumAddress(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isEthereumAddress',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid Bitcoin address.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class WalletDto {
 *   @IsBtcAddress()
 *   address: string;
 * }
 * ```
 */
export function IsBtcAddress(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isBtcAddress',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}



// ============================================================================
// Medium Priority Validators - Documents & Identifiers
// ============================================================================

/**
 * Checks if the string is a valid passport number.
 *
 * @param locale - Optional locale for country-specific validation
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PersonDto {
 *   @IsPassportNumber('US')
 *   passportNumber: string;
 * }
 * ```
 */
export function IsPassportNumber(
  locale?: string,
  options?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isPassportNumber',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid identity card number.
 *
 * @param locale - Optional locale for country-specific validation
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PersonDto {
 *   @IsIdentityCard('US')
 *   idCard: string;
 * }
 * ```
 */
export function IsIdentityCard(
  locale?: string,
  options?: ValidationDecoratorOptions,
) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isIdentityCard',
        value: locale,
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid EAN (European Article Number).
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsEAN()
 *   barcode: string;
 * }
 * ```
 */
export function IsEAN(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isEAN',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid ISIN (International Securities Identification Number).
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class SecurityDto {
 *   @IsISIN()
 *   isin: string;
 * }
 * ```
 */
export function IsISIN(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISIN',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Medium Priority Validators - Network & URI
// ============================================================================

/**
 * Checks if the string is a valid Magnet URI.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class TorrentDto {
 *   @IsMagnetURI()
 *   magnetLink: string;
 * }
 * ```
 */
export function IsMagnetURI(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isMagnetURI',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid Data URI.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ImageDto {
 *   @IsDataURI()
 *   dataUri: string;
 * }
 * ```
 */
export function IsDataURI(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isDataURI',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}


// ============================================================================
// Medium Priority Validators - Localization
// ============================================================================

/**
 * Checks if the string is a valid ISO 3166-1 alpha-2 country code.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class AddressDto {
 *   @IsISO31661Alpha2()
 *   countryCode: string; // e.g., "US", "RU", "GB"
 * }
 * ```
 */
export function IsISO31661Alpha2(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISO31661Alpha2',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid ISO 3166-1 alpha-3 country code.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class AddressDto {
 *   @IsISO31661Alpha3()
 *   countryCode: string; // e.g., "USA", "RUS", "GBR"
 * }
 * ```
 */
export function IsISO31661Alpha3(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isISO31661Alpha3',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid locale.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsLocale()
 *   locale: string; // e.g., "en-US", "ru-RU", "fr-FR"
 * }
 * ```
 */
export function IsLocale(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isLocale',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

// ============================================================================
// Medium Priority Validators - Formats & Standards
// ============================================================================

/**
 * Checks if the string is a valid semantic version.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class PackageDto {
 *   @IsSemVer()
 *   version: string; // e.g., "1.2.3", "2.0.0-beta.1"
 * }
 * ```
 */
export function IsSemVer(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isSemVer',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid MIME type.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class FileDto {
 *   @IsMimeType()
 *   contentType: string; // e.g., "text/html", "application/json"
 * }
 * ```
 */
export function IsMimeType(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isMimeType',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid timezone.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsTimeZone()
 *   timezone: string; // e.g., "America/New_York", "Europe/Moscow"
 * }
 * ```
 */
export function IsTimeZone(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isTimeZone',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

/**
 * Checks if the string is a valid RFC 3339 date.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class EventDto {
 *   @IsRFC3339()
 *   timestamp: string;
 * }
 * ```
 */
export function IsRFC3339(options?: ValidationDecoratorOptions) {
  return function (target: undefined, context: ClassFieldDecoratorContext): any {
    const propertyKey = context.name;

    context.addInitializer(function (this: any) {
      addValidationConstraint(this.constructor, propertyKey, {
        type: 'isRFC3339',
        message: options?.message,
        groups: options?.groups,
        always: options?.always,
      });
    });
  };
}

