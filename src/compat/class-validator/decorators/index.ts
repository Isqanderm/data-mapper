/**
 * Export all validation decorators
 */

// Common decorators
export { IsOptional, IsDefined, IsNotEmpty } from './common';

// String decorators
export {
  IsString,
  MinLength,
  MaxLength,
  Length,
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
  // Specialized
  IsCreditCard,
  IsISBN,
  IsPhoneNumber,
  // String Content
  Contains,
  NotContains,
  IsLowercase,
  IsUppercase,
  Matches,
} from './string';

// Number decorators
export {
  IsNumber,
  IsInt,
  Min,
  Max,
  IsPositive,
  IsNegative,
  IsDivisibleBy,
  IsDecimal,
} from './number';

// Date decorators
export { MinDate, MaxDate } from './date';

// Array decorators
export {
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayContains,
  ArrayNotContains,
  ArrayUnique,
} from './array';

// Type checker decorators
export { IsBoolean, IsDate, IsObject, IsEnum, IsInstance } from './typechecker';

// Nested validation decorators
export { ValidateNested, ValidateIf, ValidatePromise } from './nested';

// Custom validator decorators
export {
  Validate,
  ValidateBy,
  Allow,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidatorConstraintOptions,
} from './custom';

