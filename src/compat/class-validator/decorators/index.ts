/**
 * Export all validation decorators
 */

// Common decorators
export {
  IsOptional,
  IsDefined,
  IsNotEmpty,
  // Comparison
  Equals,
  NotEquals,
  IsIn,
  IsNotIn,
  IsEmpty,
} from './common';

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
  // High Priority Validators
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
  // Medium Priority Validators - Banking & Financial
  IsIBAN,
  IsBIC,
  IsCurrency,
  IsISO4217CurrencyCode,
  // Medium Priority Validators - Cryptocurrency
  IsEthereumAddress,
  IsBtcAddress,
  // Medium Priority Validators - Documents & Identifiers
  IsPassportNumber,
  IsIdentityCard,
  IsEAN,
  IsISIN,
  // Medium Priority Validators - Network & URI
  IsMagnetURI,
  IsDataURI,
  // Medium Priority Validators - Localization
  IsISO31661Alpha2,
  IsISO31661Alpha3,
  IsLocale,
  // Medium Priority Validators - Formats & Standards
  IsSemVer,
  IsMimeType,
  IsTimeZone,
  IsRFC3339,
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
export {
  IsBoolean,
  IsDate,
  IsObject,
  IsEnum,
  IsInstance,
  IsNotEmptyObject,
} from './typechecker';

// Geographic validators
export { IsLatLong, IsLatitude, IsLongitude } from './geo';

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

