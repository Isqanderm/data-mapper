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

