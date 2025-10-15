# Validation Module - User Guide

## Overview

The `om-data-mapper` validation module provides a high-performance, class-validator-compatible API for validating objects using decorators. It's designed as a **drop-in replacement** for `class-validator` with **10x better performance** through JIT compilation.

---

## Installation

```bash
npm install om-data-mapper
# or
pnpm add om-data-mapper
# or
yarn add om-data-mapper
```

**No additional dependencies required** - unlike class-validator, you don't need `reflect-metadata`.

---

## Quick Start

### Basic Example

```typescript
import { IsString, IsEmail, MinLength, validate } from 'om-data-mapper/class-validator-compat';

class UserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}

const user = new UserDto();
user.name = 'Jo';  // Too short
user.email = 'invalid-email';

const errors = await validate(user);
console.log(errors);
// [
//   {
//     property: 'name',
//     constraints: { minLength: 'name must be at least 3 characters' }
//   },
//   {
//     property: 'email',
//     constraints: { isEmail: 'email must be a valid email' }
//   }
// ]
```

---

## Import Path

```typescript
// Import from class-validator-compat submodule
import {
  validate,
  validateSync,
  IsString,
  IsNumber,
  MinLength,
  // ... other validators
} from 'om-data-mapper/class-validator-compat';
```

---

## Validation Functions

### `validate(object, options?)`

Asynchronously validates an object. Supports async custom validators.

```typescript
const errors = await validate(userDto);
if (errors.length > 0) {
  console.log('Validation failed:', errors);
}
```

### `validateSync(object, options?)`

Synchronously validates an object. Does not support async validators.

```typescript
const errors = validateSync(userDto);
if (errors.length > 0) {
  console.log('Validation failed:', errors);
}
```

### `validateOrReject(object, options?)`

Validates and throws an error if validation fails.

```typescript
try {
  await validateOrReject(userDto);
  console.log('Validation passed!');
} catch (errors) {
  console.log('Validation failed:', errors);
}
```

### `validateOrRejectSync(object, options?)`

Synchronous version of `validateOrReject`.

```typescript
try {
  validateOrRejectSync(userDto);
  console.log('Validation passed!');
} catch (errors) {
  console.log('Validation failed:', errors);
}
```

### `validateMany(objects, options?)`

Validates an array of objects.

```typescript
const users = [user1, user2, user3];
const allErrors = await validateMany(users);
// Returns: ValidationError[][]
```

### `validateManySync(objects, options?)`

Synchronous version of `validateMany`.

```typescript
const allErrors = validateManySync(users);
```

---

## Validation Options

```typescript
interface ValidatorOptions {
  skipMissingProperties?: boolean;      // Skip undefined properties
  skipNullProperties?: boolean;         // Skip null properties
  skipUndefinedProperties?: boolean;    // Skip undefined properties
  groups?: string[];                    // Validation groups
  always?: boolean;                     // Always validate
  stopAtFirstError?: boolean;           // Stop at first error
  forbidUnknownValues?: boolean;        // Forbid unknown values
  whitelist?: boolean;                  // Remove unknown properties
  forbidNonWhitelisted?: boolean;       // Throw on unknown properties
}
```

### Example with Options:

```typescript
const errors = await validate(user, {
  skipMissingProperties: true,
  groups: ['create'],
  stopAtFirstError: true
});
```

---

## Available Decorators

### Common Validators

#### `@IsOptional()`
Marks property as optional - skips validation if undefined.

```typescript
class UserDto {
  @IsOptional()
  @IsString()
  middleName?: string;
}
```

#### `@IsDefined()`
Checks if value is defined (not undefined).

```typescript
class UserDto {
  @IsDefined()
  name: string;
}
```

#### `@IsNotEmpty()`
Checks if value is not empty.

```typescript
class UserDto {
  @IsNotEmpty()
  name: string;
}
```

#### `@Equals(value)`
Checks if value equals the specified value.

```typescript
class ConfigDto {
  @Equals('production')
  environment: string;
}
```

#### `@NotEquals(value)`
Checks if value does not equal the specified value.

```typescript
class UserDto {
  @NotEquals('admin')
  role: string;
}
```

#### `@IsIn(values)`
Checks if value is in an array of allowed values.

```typescript
class UserDto {
  @IsIn(['admin', 'user', 'guest'])
  role: string;
}
```

#### `@IsNotIn(values)`
Checks if value is not in an array of disallowed values.

```typescript
class UserDto {
  @IsNotIn(['root', 'administrator'])
  username: string;
}
```

---

### String Validators

#### `@IsString()`
Checks if value is a string.

```typescript
class UserDto {
  @IsString()
  name: string;
}
```

#### `@MinLength(min)`
Checks if string length is at least min.

```typescript
class UserDto {
  @MinLength(3)
  username: string;
}
```

#### `@MaxLength(max)`
Checks if string length is at most max.

```typescript
class UserDto {
  @MaxLength(50)
  name: string;
}
```

#### `@Length(min, max)`
Checks if string length is between min and max.

```typescript
class UserDto {
  @Length(3, 20)
  username: string;
}
```

#### `@IsEmail()`
Checks if value is a valid email.

```typescript
class UserDto {
  @IsEmail()
  email: string;
}
```

#### `@IsURL()`
Checks if value is a valid URL.

```typescript
class UserDto {
  @IsURL()
  website: string;
}
```

#### `@IsUUID()`
Checks if value is a valid UUID.

```typescript
class UserDto {
  @IsUUID()
  id: string;
}
```

#### `@IsJSON()`
Checks if value is valid JSON.

```typescript
class ConfigDto {
  @IsJSON()
  settings: string;
}
```

#### `@IsAlpha()`
Checks if string contains only letters.

```typescript
class UserDto {
  @IsAlpha()
  firstName: string;
}
```

#### `@IsAlphanumeric()`
Checks if string contains only letters and numbers.

```typescript
class UserDto {
  @IsAlphanumeric()
  username: string;
}
```

#### `@IsHexColor()`
Checks if value is a valid hex color.

```typescript
class ThemeDto {
  @IsHexColor()
  primaryColor: string;
}
```

#### `@IsIP()`
Checks if value is a valid IP address.

```typescript
class ServerDto {
  @IsIP()
  ipAddress: string;
}
```

#### `@IsCreditCard()`
Checks if value is a valid credit card number.

```typescript
class PaymentDto {
  @IsCreditCard()
  cardNumber: string;
}
```

#### `@IsISBN()`
Checks if value is a valid ISBN.

```typescript
class BookDto {
  @IsISBN()
  isbn: string;
}
```

#### `@IsPhoneNumber(region?)`
Checks if value is a valid phone number.

```typescript
class UserDto {
  @IsPhoneNumber('US')
  phone: string;
}
```

#### `@Contains(seed)`
Checks if string contains the seed.

```typescript
class UserDto {
  @Contains('@')
  email: string;
}
```

#### `@NotContains(seed)`
Checks if string does not contain the seed.

```typescript
class UserDto {
  @NotContains('admin')
  username: string;
}
```

#### `@IsLowercase()`
Checks if string is lowercase.

```typescript
class UserDto {
  @IsLowercase()
  username: string;
}
```

#### `@IsUppercase()`
Checks if string is uppercase.

```typescript
class CodeDto {
  @IsUppercase()
  countryCode: string;
}
```

#### `@Matches(pattern)`
Checks if string matches a regex pattern.

```typescript
class UserDto {
  @Matches(/^[a-zA-Z0-9]+$/)
  username: string;
}
```

---

### Number Validators

#### `@IsNumber()`
Checks if value is a number.

```typescript
class ProductDto {
  @IsNumber()
  price: number;
}
```

#### `@IsInt()`
Checks if value is an integer.

```typescript
class ProductDto {
  @IsInt()
  quantity: number;
}
```

#### `@Min(min)`
Checks if number is at least min.

```typescript
class ProductDto {
  @Min(0)
  price: number;
}
```

#### `@Max(max)`
Checks if number is at most max.

```typescript
class ProductDto {
  @Max(100)
  discount: number;
}
```

#### `@IsPositive()`
Checks if number is positive.

```typescript
class ProductDto {
  @IsPositive()
  price: number;
}
```

#### `@IsNegative()`
Checks if number is negative.

```typescript
class TransactionDto {
  @IsNegative()
  debit: number;
}
```

#### `@IsDivisibleBy(num)`
Checks if number is divisible by num.

```typescript
class ProductDto {
  @IsDivisibleBy(5)
  quantity: number;
}
```

#### `@IsDecimal()`
Checks if value is a decimal number.

```typescript
class ProductDto {
  @IsDecimal()
  price: number;
}
```

---

### Date Validators

#### `@MinDate(date)`
Checks if date is after or equal to the specified date.

```typescript
class EventDto {
  @MinDate(new Date('2024-01-01'))
  startDate: Date;
}
```

#### `@MaxDate(date)`
Checks if date is before or equal to the specified date.

```typescript
class EventDto {
  @MaxDate(new Date('2024-12-31'))
  endDate: Date;
}
```

---

### Array Validators

#### `@IsArray()`
Checks if value is an array.

```typescript
class ProductDto {
  @IsArray()
  tags: string[];
}
```

#### `@ArrayNotEmpty()`
Checks if array is not empty.

```typescript
class ProductDto {
  @ArrayNotEmpty()
  tags: string[];
}
```

#### `@ArrayMinSize(min)`
Checks if array has at least min elements.

```typescript
class ProductDto {
  @ArrayMinSize(1)
  images: string[];
}
```

#### `@ArrayMaxSize(max)`
Checks if array has at most max elements.

```typescript
class ProductDto {
  @ArrayMaxSize(10)
  tags: string[];
}
```

#### `@ArrayContains(values)`
Checks if array contains all specified values.

```typescript
class ProductDto {
  @ArrayContains(['featured'])
  tags: string[];
}
```

#### `@ArrayNotContains(values)`
Checks if array does not contain any of the specified values.

```typescript
class ProductDto {
  @ArrayNotContains(['banned'])
  tags: string[];
}
```

#### `@ArrayUnique()`
Checks if all array elements are unique.

```typescript
class ProductDto {
  @ArrayUnique()
  tags: string[];
}
```

---

### Type Checker Validators

#### `@IsBoolean()`
Checks if value is a boolean.

```typescript
class UserDto {
  @IsBoolean()
  isActive: boolean;
}
```

#### `@IsDate()`
Checks if value is a Date object.

```typescript
class EventDto {
  @IsDate()
  startDate: Date;
}
```

#### `@IsObject()`
Checks if value is an object.

```typescript
class UserDto {
  @IsObject()
  metadata: object;
}
```

#### `@IsEnum(enum)`
Checks if value is a valid enum value.

```typescript
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

class UserDto {
  @IsEnum(UserRole)
  role: UserRole;
}
```

#### `@IsInstance(class)`
Checks if value is an instance of a class.

```typescript
class UserDto {
  @IsInstance(Date)
  createdAt: Date;
}
```

#### `@IsNotEmptyObject()`
Checks if value is a non-empty object.

```typescript
class UserDto {
  @IsNotEmptyObject()
  settings: object;
}
```

---

### Geographic Validators

#### `@IsLatLong()`
Checks if value is a valid latitude-longitude pair.

```typescript
class LocationDto {
  @IsLatLong()
  coordinates: string;  // "40.7128,-74.0060"
}
```

#### `@IsLatitude()`
Checks if value is a valid latitude.

```typescript
class LocationDto {
  @IsLatitude()
  lat: string;
}
```

#### `@IsLongitude()`
Checks if value is a valid longitude.

```typescript
class LocationDto {
  @IsLongitude()
  lng: string;
}
```

---

## Advanced Features

### Nested Validation

Use `@ValidateNested()` to validate nested objects.

```typescript
import { ValidateNested, IsString } from 'om-data-mapper/class-validator-compat';
import { Type } from 'om-data-mapper/class-transformer-compat';

class Address {
  @IsString()
  street: string;

  @IsString()
  city: string;
}

class UserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => Address)
  address: Address;
}

const user = new UserDto();
user.name = 'John';
user.address = new Address();
user.address.street = '';  // Invalid

const errors = await validate(user);
// Errors will include nested validation errors
```

---

### Conditional Validation

Use `@ValidateIf()` to conditionally validate properties.

```typescript
import { ValidateIf, IsString } from 'om-data-mapper/class-validator-compat';

class UserDto {
  @IsString()
  accountType: string;

  @ValidateIf(o => o.accountType === 'premium')
  @IsString()
  premiumFeature?: string;
}
```

---

### Validation Groups

Use groups to validate different scenarios.

```typescript
class UserDto {
  @IsString({ groups: ['create', 'update'] })
  name: string;

  @IsString({ groups: ['create'] })
  password: string;

  @IsString({ groups: ['update'] })
  @IsOptional()
  newPassword?: string;
}

// Validate for create
const createErrors = await validate(user, { groups: ['create'] });

// Validate for update
const updateErrors = await validate(user, { groups: ['update'] });
```

---

### Custom Error Messages

Provide custom error messages for validators.

```typescript
class UserDto {
  @IsString({ message: 'Please provide a valid name' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @IsEmail({ message: 'Please provide a valid email address' })
  email: string;
}
```

### Dynamic Error Messages

Use functions for dynamic error messages.

```typescript
class UserDto {
  @MinLength(3, {
    message: (args) => `${args.property} is too short. Minimum length is ${args.constraints[0]}`
  })
  name: string;
}
```

---

## Custom Validators

Create custom validators for complex validation logic.

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate
} from 'om-data-mapper/class-validator-compat';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && value.length >= 8;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Password must contain uppercase, lowercase, number, special character, and be at least 8 characters';
  }
}

class UserDto {
  @Validate(IsStrongPasswordConstraint)
  password: string;
}
```

### Async Custom Validators

```typescript
@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
class IsUserAlreadyExistConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    // Check database
    const user = await database.findUserByEmail(value);
    return !user;  // Return false if user exists
  }

  defaultMessage(args: ValidationArguments): string {
    return 'User with this email already exists';
  }
}

class CreateUserDto {
  @Validate(IsUserAlreadyExistConstraint)
  email: string;
}

// Must use async validate
const errors = await validate(dto);
```

---

## Best Practices

### 1. Use Synchronous Validation When Possible

```typescript
// ✅ Faster
const errors = validateSync(dto);

// ❌ Slower (unless you have async validators)
const errors = await validate(dto);
```

### 2. Combine Validators

```typescript
class UserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/)
  username: string;
}
```

### 3. Use Validation Groups

```typescript
// Different validation rules for different scenarios
class UserDto {
  @IsString({ groups: ['create'] })
  password: string;

  @IsString({ groups: ['update'] })
  @IsOptional()
  newPassword?: string;
}
```

### 4. Leverage @IsOptional()

```typescript
class UserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  middleName?: string;  // Only validated if provided
}
```

### 5. Use Custom Validators for Complex Logic

```typescript
// Instead of multiple decorators, create a custom validator
@Validate(IsComplexBusinessRuleConstraint)
complexField: string;
```

---

## Migration from class-validator

The API is **100% compatible** with class-validator. Simply change the import:

```typescript
// Before
import { validate, IsString } from 'class-validator';

// After
import { validate, IsString } from 'om-data-mapper/class-validator-compat';
```

**No other changes needed!** Your existing code will work with 10x better performance.

---

## Performance Tips

1. **Reuse DTOs**: Create DTO instances once and reuse them
2. **Use validateSync**: When you don't need async validators
3. **Limit Nested Depth**: Deep nesting impacts performance
4. **Use Groups**: Validate only what you need
5. **Cache Validators**: The first validation compiles the validator, subsequent calls are cached

---

## API Reference Summary

### Functions
- `validate(object, options?)` - Async validation
- `validateSync(object, options?)` - Sync validation
- `validateOrReject(object, options?)` - Async validation with throw
- `validateOrRejectSync(object, options?)` - Sync validation with throw
- `validateMany(objects, options?)` - Validate array async
- `validateManySync(objects, options?)` - Validate array sync

### Decorators
- **Common**: `@IsOptional()`, `@IsDefined()`, `@IsNotEmpty()`, `@Equals()`, `@NotEquals()`, `@IsIn()`, `@IsNotIn()`
- **String**: `@IsString()`, `@MinLength()`, `@MaxLength()`, `@Length()`, `@IsEmail()`, `@IsURL()`, `@IsUUID()`, `@Matches()`
- **Number**: `@IsNumber()`, `@IsInt()`, `@Min()`, `@Max()`, `@IsPositive()`, `@IsNegative()`
- **Date**: `@MinDate()`, `@MaxDate()`
- **Array**: `@IsArray()`, `@ArrayNotEmpty()`, `@ArrayMinSize()`, `@ArrayMaxSize()`, `@ArrayUnique()`
- **Type**: `@IsBoolean()`, `@IsDate()`, `@IsObject()`, `@IsEnum()`, `@IsInstance()`
- **Nested**: `@ValidateNested()`, `@ValidateIf()`, `@ValidatePromise()`
- **Custom**: `@Validate()`, `@ValidateBy()`, `@ValidatorConstraint()`

---

## Conclusion

The validation module provides:

- ✅ **10x faster** than class-validator
- ✅ **100% API compatible** - drop-in replacement
- ✅ **No dependencies** - no reflect-metadata needed
- ✅ **Type-safe** - full TypeScript support
- ✅ **Extensible** - custom validators supported

Start validating with confidence! 🚀

