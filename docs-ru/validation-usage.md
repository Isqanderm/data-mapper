# Validation Module - Руководство пользователя

## Обзор

The `om-data-mapper` валидация module provides a высокопроизводительный, class-валидатор-compatible API for validating objects using декораторs. It's разработан как **прямая замена** for `class-validator` with **10x better performance** through JIT-компиляция.

---

## Установка

```bash
npm install om-data-mapper
# or
pnpm add om-data-mapper
# or
yarn add om-data-mapper
```

**Не требуются дополнительные зависимости** - unlike class-валидатор, you don't need `reflect-metadata`.

---

## Быстрый старт

### Базовый пример

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
// {
// property: 'name',
// constraints: { minLength: 'name должно быть at least 3 characters' }
// },
// {
// property: 'email',
// constraints: { isEmail: 'email должно быть a valid email' }
// }
// ]
```

---

## Путь импорта

```typescript
// Import from class-валидатор-compat submodule
import {
  validate,
  validateSync,
  IsString,
  IsNumber,
  MinLength,
  // ... other валидаторs
} from 'om-data-mapper/class-validator-compat';
```

---

## Функции валидации

### `validate(object, options?)`

Асинхронно валидирует an object. Supports async custom валидаторs.

```typescript
const errors = await validate(userDto);
if (errors.length > 0) {
  console.log('Validation failed:', errors);
}
```

### `validateSync(object, options?)`

Синхронно валидирует an object. Не поддерживает async валидаторs.

```typescript
const errors = validateSync(userDto);
if (errors.length > 0) {
  console.log('Validation failed:', errors);
}
```

### `validateOrReject(object, options?)`

Валидирует и выбрасывает an error if валидация fails.

```typescript
try {
  await validateOrReject(userDto);
  console.log('Validation passed!');
} catch (errors) {
  console.log('Validation failed:', errors);
}
```

### `validateOrRejectSync(object, options?)`

Synchronous Версия of `validateOrReject`.

```typescript
try {
  validateOrRejectSync(userDto);
  console.log('Validation passed!');
} catch (errors) {
  console.log('Validation failed:', errors);
}
```

### `validateMany(objects, options?)`

Валидирует массив of objects.

```typescript
const users = [user1, user2, user3];
const allErrors = await validateMany(users);
// Возвращает: ValidationError[][]
```

### `validateManySync(objects, options?)`

Synchronous Версия of `validateMany`.

```typescript
const allErrors = validateManySync(users);
```

---

## Опции валидации

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

### Пример with Опции:

```typescript
const errors = await validate(user, {
  skipMissingProperties: true,
  groups: ['create'],
  stopAtFirstError: true
});
```

---

## Доступные декораторы

### Общие валидаторы

#### `@IsOptional()`
Помечает свойство как необязательное - skips валидация if unОпределитьd.

```typescript
class UserDto {
  @IsOptional()
  @IsString()
  middleName?: string;
}
```

#### `@IsDefined()`
Проверяет, является ли значение Определитьd (not unОпределитьd).

```typescript
class UserDto {
  @IsDefined()
  name: string;
}
```

#### `@IsNotEmpty()`
Проверяет, является ли значение not empty.

```typescript
class UserDto {
  @IsNotEmpty()
  name: string;
}
```

#### `@Equals(value)`
Проверяет, является ли значение equals the specified value.

```typescript
class ConfigDto {
  @Equals('production')
  environment: string;
}
```

#### `@NotEquals(value)`
Проверяет, является ли значение does not equal the specified value.

```typescript
class UserDto {
  @NotEquals('admin')
  role: string;
}
```

#### `@IsIn(values)`
Проверяет, является ли значение in an array of allowed values.

```typescript
class UserDto {
  @IsIn(['admin', 'user', 'guest'])
  role: string;
}
```

#### `@IsNotIn(values)`
Проверяет, является ли значение not in an array of disallowed values.

```typescript
class UserDto {
  @IsNotIn(['root', 'administrator'])
  username: string;
}
```

---

### Валидаторы строк

#### `@IsString()`
Проверяет, является ли значение a string.

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
Проверяет, является ли значение a valid email.

```typescript
class UserDto {
  @IsEmail()
  email: string;
}
```

#### `@IsURL()`
Проверяет, является ли значение a valid URL.

```typescript
class UserDto {
  @IsURL()
  website: string;
}
```

#### `@IsUUID()`
Проверяет, является ли значение a valid UUID.

```typescript
class UserDto {
  @IsUUID()
  id: string;
}
```

#### `@IsJSON()`
Проверяет, является ли значение valid JSON.

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
Проверяет, является ли значение a valid hex color.

```typescript
class ThemeDto {
  @IsHexColor()
  primaryColor: string;
}
```

#### `@IsIP()`
Проверяет, является ли значение a valid IP address.

```typescript
class ServerDto {
  @IsIP()
  ipAddress: string;
}
```

#### `@IsCreditCard()`
Проверяет, является ли значение a valid credit card number.

```typescript
class PaymentDto {
  @IsCreditCard()
  cardNumber: string;
}
```

#### `@IsISBN()`
Проверяет, является ли значение a valid ISBN.

```typescript
class BookDto {
  @IsISBN()
  isbn: string;
}
```

#### `@IsPhoneNumber(region?)`
Проверяет, является ли значение a valid phone number.

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

#### `@IsFQDN()`
Проверяет, является ли значение полным доменным именем (FQDN).

```typescript
class WebsiteDto {
  @IsFQDN()
  domain: string; // 'example.com', 'subdomain.example.com'
}
```

#### `@IsISO8601()`
Проверяет, является ли значение валидной датой в формате ISO 8601.

```typescript
class EventDto {
  @IsISO8601()
  startDate: string; // '2024-01-15T10:30:00Z', '2024-01-15'
}
```

#### `@IsDateString()`
Алиас для `@IsISO8601()`. Проверяет, является ли значение валидной датой в формате ISO 8601.

```typescript
class EventDto {
  @IsDateString()
  createdAt: string; // '2024-01-15T10:30:00Z'
}
```

#### `@IsMobilePhone(locale?)`
Проверяет, является ли значение валидным номером мобильного телефона. Поддерживает валидацию для конкретных локалей.

```typescript
class UserDto {
  @IsMobilePhone('en-US')
  phone: string; // '+1-555-123-4567', '555-123-4567'
}

// Без указания локали (принимает различные форматы)
class ContactDto {
  @IsMobilePhone()
  mobile: string;
}
```

#### `@IsPostalCode(locale?)`
Проверяет, является ли значение валидным почтовым индексом. Поддерживает локали US, RU и GB.

```typescript
class AddressDto {
  @IsPostalCode('US')
  zipCode: string; // '12345', '12345-6789'
}

class RussianAddressDto {
  @IsPostalCode('RU')
  postalCode: string; // '123456'
}
```

#### `@IsMongoId()`
Проверяет, является ли значение валидным MongoDB ObjectId (24-символьная шестнадцатеричная строка).

```typescript
class DocumentDto {
  @IsMongoId()
  id: string; // '507f1f77bcf86cd799439011'
}
```

#### `@IsJWT()`
Проверяет, является ли значение валидным JWT токеном.

```typescript
class AuthDto {
  @IsJWT()
  token: string; // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
}
```

#### `@IsStrongPassword()`
Проверяет, является ли значение надежным паролем (минимум 8 символов, заглавные и строчные буквы, цифры, спецсимволы).

```typescript
class UserDto {
  @IsStrongPassword()
  password: string; // 'MyP@ssw0rd123'
}
```

#### `@IsPort()`
Проверяет, является ли значение валидным номером порта (0-65535).

```typescript
class ServerDto {
  @IsPort()
  port: string; // '8080', '3000', '443'
}
```

#### `@IsMACAddress()`
Проверяет, является ли значение валидным MAC-адресом.

```typescript
class DeviceDto {
  @IsMACAddress()
  macAddress: string; // '00:1B:44:11:3A:B7', '00-1B-44-11-3A-B7'
}
```

#### `@IsBase64()`
Проверяет, является ли значение валидной строкой в кодировке base64.

```typescript
class FileDto {
  @IsBase64()
  content: string; // 'SGVsbG8gV29ybGQ=', 'SGVsbG8gV29ybGQ'
}
```

#### `@IsIBAN()`
Проверяет, является ли значение валидным международным номером банковского счета (IBAN).

```typescript
class BankAccountDto {
  @IsIBAN()
  iban: string; // 'GB82WEST12345698765432', 'DE89370400440532013000'
}
```

#### `@IsBIC()`
Проверяет, является ли значение валидным банковским идентификационным кодом (BIC/SWIFT).

```typescript
class BankDto {
  @IsBIC()
  swiftCode: string; // 'DEUTDEFF', 'DEUTDEFF500'
}
```

#### `@IsCurrency()`
Проверяет, является ли значение валидной денежной суммой.

```typescript
class PaymentDto {
  @IsCurrency()
  amount: string; // '$100.00', '€50.99', '¥1000'
}
```

#### `@IsISO4217CurrencyCode()`
Проверяет, является ли значение валидным кодом валюты по стандарту ISO 4217.

```typescript
class TransactionDto {
  @IsISO4217CurrencyCode()
  currency: string; // 'USD', 'EUR', 'RUB', 'GBP'
}
```

#### `@IsEthereumAddress()`
Проверяет, является ли значение валидным адресом Ethereum.

```typescript
class WalletDto {
  @IsEthereumAddress()
  address: string; // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
}
```

#### `@IsBtcAddress()`
Проверяет, является ли значение валидным адресом Bitcoin (legacy или SegWit).

```typescript
class CryptoDto {
  @IsBtcAddress()
  btcAddress: string; // '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
}
```

#### `@IsPassportNumber(locale?)`
Проверяет, является ли значение валидным номером паспорта. Поддерживает валидацию для конкретных локалей.

```typescript
class TravelDto {
  @IsPassportNumber('US')
  passport: string; // '123456789'
}

class InternationalDto {
  @IsPassportNumber()
  passportNumber: string; // Принимает различные форматы
}
```

#### `@IsIdentityCard(locale?)`
Проверяет, является ли значение валидным номером удостоверения личности.

```typescript
class IdentityDto {
  @IsIdentityCard('ES')
  idCard: string; // 'AB12345678'
}
```

#### `@IsEAN()`
Проверяет, является ли значение валидным европейским артикульным номером (EAN-8 или EAN-13).

```typescript
class ProductDto {
  @IsEAN()
  barcode: string; // '12345678' (EAN-8), '1234567890123' (EAN-13)
}
```

#### `@IsISIN()`
Проверяет, является ли значение валидным международным идентификационным номером ценной бумаги (ISIN).

```typescript
class SecurityDto {
  @IsISIN()
  isin: string; // 'US0378331005'
}
```

#### `@IsMagnetURI()`
Проверяет, является ли значение валидным Magnet URI.

```typescript
class TorrentDto {
  @IsMagnetURI()
  magnetLink: string; // 'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a'
}
```

#### `@IsDataURI()`
Проверяет, является ли значение валидным Data URI.

```typescript
class ImageDto {
  @IsDataURI()
  dataUri: string; // 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
}
```

#### `@IsISO31661Alpha2()`
Проверяет, является ли значение валидным двухбуквенным кодом страны по стандарту ISO 3166-1 alpha-2.

```typescript
class AddressDto {
  @IsISO31661Alpha2()
  countryCode: string; // 'US', 'RU', 'GB', 'FR'
}
```

#### `@IsISO31661Alpha3()`
Проверяет, является ли значение валидным трёхбуквенным кодом страны по стандарту ISO 3166-1 alpha-3.

```typescript
class CountryDto {
  @IsISO31661Alpha3()
  code: string; // 'USA', 'RUS', 'GBR', 'FRA'
}
```

#### `@IsLocale()`
Проверяет, является ли значение валидным кодом локали.

```typescript
class UserDto {
  @IsLocale()
  locale: string; // 'en-US', 'ru-RU', 'fr-FR', 'en'
}
```

#### `@IsSemVer()`
Проверяет, является ли значение валидной семантической версией.

```typescript
class PackageDto {
  @IsSemVer()
  version: string; // '1.2.3', '2.0.0-beta.1', '1.0.0+20130313144700'
}
```

#### `@IsMimeType()`
Проверяет, является ли значение валидным MIME-типом.

```typescript
class FileDto {
  @IsMimeType()
  contentType: string; // 'text/html', 'application/json', 'image/png'
}
```

#### `@IsTimeZone()`
Проверяет, является ли значение валидным часовым поясом.

```typescript
class EventDto {
  @IsTimeZone()
  timezone: string; // 'America/New_York', 'Europe/Moscow', 'UTC'
}
```

#### `@IsRFC3339()`
Проверяет, является ли значение валидной датой в формате RFC 3339.

```typescript
class TimestampDto {
  @IsRFC3339()
  timestamp: string; // '2024-01-15T10:30:00Z', '2024-01-15T10:30:00+03:00'
}
```

---

### Валидаторы чисел

#### `@IsNumber()`
Проверяет, является ли значение a number.

```typescript
class ProductDto {
  @IsNumber()
  price: number;
}
```

#### `@IsInt()`
Проверяет, является ли значение an integer.

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
Проверяет, является ли значение a decimal number.

```typescript
class ProductDto {
  @IsDecimal()
  price: number;
}
```

---

### Валидаторы дат

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

### Валидаторы массивов

#### `@IsArray()`
Проверяет, является ли значение an array.

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
Проверяет, является ли значение a boolean.

```typescript
class UserDto {
  @IsBoolean()
  isActive: boolean;
}
```

#### `@IsDate()`
Проверяет, является ли значение a Date object.

```typescript
class EventDto {
  @IsDate()
  startDate: Date;
}
```

#### `@IsObject()`
Проверяет, является ли значение an object.

```typescript
class UserDto {
  @IsObject()
  metadata: object;
}
```

#### `@IsEnum(enum)`
Проверяет, является ли значение a valid enum value.

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
Проверяет, является ли значение an instance of a class.

```typescript
class UserDto {
  @IsInstance(Date)
  createdAt: Date;
}
```

#### `@IsNotEmptyObject()`
Проверяет, является ли значение a non-empty object.

```typescript
class UserDto {
  @IsNotEmptyObject()
  settings: object;
}
```

---

### Geographic Validators

#### `@IsLatLong()`
Проверяет, является ли значение a valid latitude-longitude pair.

```typescript
class LocationDto {
  @IsLatLong()
  coordinates: string;  // "40.7128,-74.0060"
}
```

#### `@IsLatitude()`
Проверяет, является ли значение a valid latitude.

```typescript
class LocationDto {
  @IsLatitude()
  lat: string;
}
```

#### `@IsLongitude()`
Проверяет, является ли значение a valid longitude.

```typescript
class LocationDto {
  @IsLongitude()
  lng: string;
}
```

---

## Advanced Возможности

### Вложенная валидация

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
// Errors will include nested валидация errors
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

### Группы валидации

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

// Validate for Создать
const createErrors = await validate(user, { groups: ['create'] });

// Validate for update
const updateErrors = await validate(user, { groups: ['update'] });
```

---

### Custom Сообщения об ошибках

Provide custom error messages for валидаторs.

```typescript
class UserDto {
  @IsString({ message: 'Please provide a valid name' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @IsEmail({ message: 'Please provide a valid email address' })
  email: string;
}
```

### Dynamic Сообщения об ошибках

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

## Пользовательские валидаторы

Создать custom валидаторs for complex валидация logic.

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

### Async Пользовательские валидаторы

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

## Лучшие практики

### 1. Use Synchronous Validation When Possible

```typescript
// ✅ Faster
const errors = validateSync(dto);

// ❌ Slower (unless you have async валидаторs)
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

### 3. Use Группы валидации

```typescript
// Different валидация rules for different scenarios
class UserDto {
  @IsString({ groups: ['create'] })
  password: string;

  @IsString({ groups: ['update'] })
  @IsOptional()
  newPassword?: string;
}
```

### 4. Leverage @IsНеобязательно()

```typescript
class UserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  middleName?: string;  // Only validated if provided
}
```

### 5. Use Пользовательские валидаторы for Complex Logic

```typescript
// Instead of multiple декораторs, Создать a custom валидатор
@Validate(IsComplexBusinessRuleConstraint)
complexField: string;
```

---

## Migration from class-валидатор

The API is **100% compatible** with class-валидатор. Simply change the import:

```typescript
// Before
import { validate, IsString } from 'class-validator';

// After
import { validate, IsString } from 'om-data-mapper/class-validator-compat';
```

**No other changes needed!** Your existing code will work with 10x better performance.

---

## Производительность Советs

1. **Reuse DTOs**: Создать DTO instances once and reuse them
2. **Use validateSync**: When you don't need async валидаторs
3. **Limit Nested Depth**: Deep nesting impacts performance
4. **Use Groups**: Validate only what you need
5. **Cache Validators**: The first валидация compiles the валидатор, subsequent calls are cached

---

## Справочник API Summary

### Functions
- `validate(object, options?)` - Async валидация
- `validateSync(object, options?)` - Sync валидация
- `validateOrReject(object, options?)` - Async валидация with throw
- `validateOrRejectSync(object, options?)` - Sync валидация with throw
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

The валидация module provides:

- ✅ **10x faster** than class-валидатор
- ✅ **100% API compatible** - прямая замена
- ✅ **No dependencies** - no reflect-metadata needed
- ✅ **Type-safe** - full TypeScript support
- ✅ **Extensible** - custom валидаторs supported

Start validating with confidence! 🚀

