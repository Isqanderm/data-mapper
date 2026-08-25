# Transformer Module - Руководство пользователя

## Обзор

The `om-data-mapper` трансформер module provides two powerful APIs for transforming objects:

1. **Decorator API** - Modern, высокопроизводительный API using TC39 Stage 3 декораторs (Рекомендуется)
2. **class-трансформер API совместимости** - готовая замена для поддерживаемого подмножества class-transformer (см. [таблицу совместимости](./compat-class-transformer.md))

Both APIs use JIT-компиляция for maximum performance.

---

## Установка

```bash
npm install om-data-mapper
# or
pnpm add om-data-mapper
# or
yarn add om-data-mapper
```

**Не требуются дополнительные зависимости** - unlike class-трансформер, you don't need `reflect-metadata`.

---

## Быстрый старт

### Decorator API (Рекомендуется)

```typescript
import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

type UserSource = {
  firstName: string;
  lastName: string;
  age: number;
};

type UserDTO = {
  fullName: string;
  isAdult: boolean;
};

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @MapFrom((src: UserSource) => src.age >= 18)
  isAdult!: boolean;
}

const source = { firstName: 'John', lastName: 'Doe', age: 30 };
const result = plainToInstance(UserMapper, source);
// { fullName: 'John Doe', isAdult: true }
```

### class-трансформер API совместимости

```typescript
import { plainToClass, Expose, Type, Transform } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  @Expose({ name: 'firstName' })
  name: string;

  @Expose()
  @Transform(({ value }) => value >= 18)
  isAdult: boolean;
}

const plain = { firstName: 'John', age: 30 };
const user = plainToClass(UserDTO, plain);
// UserDTO { name: 'John', isAdult: true }
```

---

## Decorator API

### Путь импорта

```typescript
import {
  Mapper,
  Map,
  MapFrom,
  MapWith,
  Transform,
  Default,
  Ignore,
  plainToInstance,
  plainToInstanceArray,
  tryPlainToInstance,
  createMapper,
  getMapper,
} from 'om-data-mapper';
```

---

### Основные декораторы

#### `@Mapper<Source, Target>(options?)`

Class декоратор that marks a class as a маппер.

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  // Property mappings...
}

// With options
@Mapper<UserSource, UserDTO>({ unsafe: true })
class UnsafeUserMapper {
  // No error handling - maximum performance
}
```

**Опции:**

- `unsafe?: boolean` - Disable error handling for maximum performance
- `useUnsafe?: boolean` - Alias for `unsafe`

---

#### `@Map(sourcePath)`

Отображает свойство из a source path.

```typescript
@Mapper<Source, Target>()
class UserMapper {
  // Простое отображение
  @Map('firstName')
  name!: string;

  // Nested path
  @Map('user.profile.email')
  email!: string;

  // Deep nesting
  @Map('data.user.address.city')
  city!: string;
}
```

---

#### `@MapFrom(transformer)`

Отображает свойство используя a custom трансформация function.

```typescript
@Mapper<Source, Target>()
class UserMapper {
  // Combine fields
  @MapFrom((src: Source) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  // Boolean трансформация
  @MapFrom((src: Source) => src.age >= 18)
  isAdult!: boolean;

  // Complex logic
  @MapFrom((src: Source) => {
    const total = src.items.reduce((sum, item) => sum + item.price, 0);
    return total * 1.1; // Add 10% tax
  })
  totalWithTax!: number;
}
```

---

#### `@Transform(transformer)`

Трансформирует значение after mapping.

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('name')
  @Transform((value: string) => value.toUpperCase())
  name!: string;

  @Map('price')
  @Transform((value: number) => value.toFixed(2))
  price!: string;

  @Map('tags')
  @Transform((value: string[]) => value.join(', '))
  tagsString!: string;
}
```

**Chaining**: `@Transform` может быть chained with `@Map` or `@MapFrom`.

---

#### `@Default(value)`

Provides a default value if the source value is unОпределитьd.

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('score')
  @Default(0)
  score!: number;

  @Map('status')
  @Default('active')
  status!: string;

  @MapFrom((src) => src.premium?.features)
  @Default([])
  features!: string[];
}
```

---

#### Условное отображение с помощью `@MapFrom`

Отдельного декоратора «условия» не существует — `@MapFrom` получает весь
исходный объект, поэтому условная логика выражается обычной функцией,
которая возвращает `undefined`, когда условие не выполняется:

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapFrom((src: Source) => (src.isPremium ? src.premiumFeatures : undefined))
  features?: string[];

  @MapFrom((src: Source) => (src.age >= 18 ? src.adultContent : undefined))
  adultContent?: string;

  @MapFrom((src: Source) => (src.role === 'admin' ? src.adminData : undefined))
  adminData?: any;
}
```

---

#### `@Ignore()`

Ignores a property (won't be mapped).

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('name')
  name!: string;

  @Ignore()
  internalField!: string; // Won't be mapped
}
```

---

#### `@MapWith(MapperClass)`

Maps nested objects using another маппер. Ставится над `@Map()` или
`@MapFrom()`, который предоставляет вложенное исходное значение:

```typescript
class Address {
  street: string;
  city: string;
}

@Mapper<AddressSource, Address>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: Address;
}
```

---

### Функции трансформации

#### `plainToInstance(MapperClass, source)`

Transforms a plain object to a class instance.

```typescript
const result = plainToInstance(UserMapper, source);
// Возвращает: UserDTO
```

#### `plainToInstanceArray(MapperClass, sources)`

Transforms an array of plain objects.

```typescript
const results = plainToInstanceArray(UserMapper, sources);
// Возвращает: UserDTO[]
```

#### `tryPlainToInstance(MapperClass, source)`

Transforms with error information.

```typescript
const { result, errors } = tryPlainToInstance(UserMapper, source);
if (errors.length > 0) {
  console.log('Transformation errors:', errors);
}
```

#### `createMapper(MapperClass)`

Создатьs a маппер instance for reuse.

```typescript
const mapper = createMapper(UserMapper);
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
```

#### `getMapper(MapperClass)`

Gets or Создатьs a singleton маппер instance.

```typescript
const mapper = getMapper(UserMapper);
const result = mapper.transform(source);
```

---

### Advanced Примерs

#### Пример 1: E-commerce Product Mapping

```typescript
type ProductSource = {
  id: string;
  name: string;
  price: number;
  discount?: number;
  category: {
    id: string;
    name: string;
  };
  tags: string[];
};

type ProductDTO = {
  id: string;
  name: string;
  finalPrice: number;
  categoryName: string;
  tagsString: string;
  isOnSale: boolean;
};

@Mapper<ProductSource, ProductDTO>()
class ProductMapper {
  @Map('id')
  id!: string;

  @Map('name')
  @Transform((v: string) => v.toUpperCase())
  name!: string;

  @MapFrom((src: ProductSource) => {
    const discount = src.discount || 0;
    return src.price * (1 - discount / 100);
  })
  finalPrice!: number;

  @Map('category.name')
  categoryName!: string;

  @Map('tags')
  @Transform((tags: string[]) => tags.join(', '))
  tagsString!: string;

  @MapFrom((src: ProductSource) => (src.discount || 0) > 0)
  isOnSale!: boolean;
}

const product = {
  id: '123',
  name: 'laptop',
  price: 1000,
  discount: 10,
  category: { id: 'cat1', name: 'Electronics' },
  tags: ['new', 'featured'],
};

const dto = plainToInstance(ProductMapper, product);
// {
// id: '123',
// name: 'LAPTOP',
// finalPrice: 900,
// categoryName: 'Electronics',
// tagsString: 'new, featured',
// isOnSale: true
// }
```

#### Пример 2: User Profile with Nested Objects

```typescript
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;

  @Map('zipCode')
  zip!: string;
}

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;

  @MapFrom((src) => src.age >= 18)
  isAdult!: boolean;

  @MapFrom((src) => (src.isPremium ? src.premiumFeatures : undefined))
  features?: string[];
}
```

#### Пример 3: Conditional and По умолчанию Values

```typescript
@Mapper<Source, Target>()
class OrderMapper {
  @Map('orderId')
  id!: string;

  @Map('total')
  @Default(0)
  total!: number;

  @Map('status')
  @Default('pending')
  status!: string;

  @MapFrom((src) => (src.isPaid ? src.paymentMethod : undefined))
  paymentMethod?: string;

  @MapFrom((src) => (src.isShipped ? src.trackingNumber : undefined))
  trackingNumber?: string;

  @MapFrom((src) => src.items?.length || 0)
  itemCount!: number;
}
```

---

## class-трансформер API совместимости

### Путь импорта

```typescript
import {
  plainToClass,
  plainToInstance,
  plainToClassFromExist,
  classToPlain,
  instanceToPlain,
  classToClass,
  instanceToInstance,
  serialize,
  deserialize,
  deserializeArray,
  Expose,
  Exclude,
  Type,
  Transform,
  TransformClassToPlain,
  TransformClassToClass,
  TransformPlainToClass,
} from 'om-data-mapper/class-transformer-compat';
```

---

### Decorators

#### `@Expose(options?)`

Marks a property to be exposed during трансформация.

```typescript
class UserDTO {
  @Expose()
  id: number;

  @Expose({ name: 'userName' })
  name: string;

  @Expose({ groups: ['admin'] })
  email: string;

  @Expose({ since: 2.0, until: 3.0 })
  legacyField: string;
}
```

**Опции:**

- `name?: string` - Map from different property name
- `groups?: string[]` - Only expose in specific groups
- `since?: number` - Expose starting from Версия
- `until?: number` - Expose until Версия
- `toClassOnly?: boolean` - Only when transforming to class
- `toPlainOnly?: boolean` - Only when transforming to plain

---

#### `@Exclude(options?)`

Excludes a property from трансформация.

```typescript
class UserDTO {
  @Expose()
  name: string;

  @Exclude()
  password: string;

  @Exclude({ toPlainOnly: true })
  internalId: number;
}
```

**Опции:**

- `toClassOnly?: boolean` - Only exclude when transforming to class
- `toPlainOnly?: boolean` - Only exclude when transforming to plain

---

#### `@Type(typeFunction, options?)`

Specifies the type for nested трансформацияs.

```typescript
class Address {
  @Expose()
  street: string;

  @Expose()
  city: string;
}

class UserDTO {
  @Expose()
  name: string;

  @Expose()
  @Type(() => Address)
  address: Address;

  @Expose()
  @Type(() => Date)
  createdAt: Date;
}

const plain = {
  name: 'John',
  address: { street: '123 Main St', city: 'NYC' },
  createdAt: '2024-01-01',
};

const user = plainToClass(UserDTO, plain);
console.log(user.address instanceof Address); // true
console.log(user.createdAt instanceof Date); // true
```

---

#### `@Transform(transformFn, options?)`

Трансформирует значение using a custom function.

```typescript
class UserDTO {
  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @Expose()
  @Transform(({ value, obj }) => value + obj.bonus)
  totalScore: number;
}
```

**Transform Function Параметры:**

- `value` - The property value
- `key` - The property key
- `obj` - The source object
- `type` - Transformation type ('plainToClass' | 'classToPlain' | 'classToClass')
- `options` - Transformation options

**Опции:**

- `toClassOnly?: boolean` - Only apply when transforming to class
- `toPlainOnly?: boolean` - Only apply when transforming to plain

---

### Функции трансформации

#### `plainToClass(Class, plain, options?)`

Converts a plain object to a class instance.

```typescript
const user = plainToClass(UserDTO, plainObject);
```

#### `plainToInstance(Class, plain, options?)`

Alias for `plainToClass`.

```typescript
const user = plainToInstance(UserDTO, plainObject);
```

#### `plainToClassFromExist(instance, plain, options?)`

Updates an existing instance with plain object data.

```typescript
const user = new UserDTO();
plainToClassFromExist(user, plainObject);
```

#### `classToPlain(instance, options?)`

Converts a class instance to a plain object.

```typescript
const plain = classToPlain(userInstance);
```

#### `instanceToPlain(instance, options?)`

Alias for `classToPlain`.

```typescript
const plain = instanceToPlain(userInstance);
```

#### `classToClass(instance, options?)`

Создатьs a deep clone of a class instance.

```typescript
const clone = classToClass(userInstance);
```

#### `instanceToInstance(instance, options?)`

Alias for `classToClass`.

```typescript
const clone = instanceToInstance(userInstance);
```

#### `serialize(instance, options?)`

Serializes a class instance to JSON string.

```typescript
const json = serialize(userInstance);
```

#### `deserialize(Class, json, options?)`

Deserializes JSON string to class instance.

```typescript
const user = deserialize(UserDTO, jsonString);
```

#### `deserializeArray(Class, json, options?)`

Deserializes JSON array to class instances.

```typescript
const users = deserializeArray(UserDTO, jsonArrayString);
```

---

### Transformation Опции

```typescript
interface ClassTransformOptions {
  strategy?: 'excludeAll' | 'exposeAll';
  excludeExtraneousValues?: boolean;
  groups?: string[];
  version?: number;
  excludePrefixes?: string[];
  ignoreDecorators?: boolean;
  enableImplicitConversion?: boolean;
}
```

#### Пример with Опции:

```typescript
const user = plainToClass(UserDTO, plain, {
  excludeExtraneousValues: true, // Only @Expose properties
  groups: ['admin'], // Only admin group
  version: 2.0, // Version 2.0 properties
});
```

---

### Advanced Примерs

#### Пример 1: Nested Objects with @Type

```typescript
class Photo {
  @Expose()
  url: string;

  @Expose()
  @Type(() => Date)
  uploadedAt: Date;
}

class Album {
  @Expose()
  name: string;

  @Expose()
  @Type(() => Photo)
  photos: Photo[];
}

class UserDTO {
  @Expose()
  name: string;

  @Expose()
  @Type(() => Album)
  albums: Album[];
}

const plain = {
  name: 'John',
  albums: [
    {
      name: 'Vacation',
      photos: [
        { url: 'photo1.jpg', uploadedAt: '2024-01-01' },
        { url: 'photo2.jpg', uploadedAt: '2024-01-02' },
      ],
    },
  ],
};

const user = plainToClass(UserDTO, plain);
console.log(user.albums[0].photos[0] instanceof Photo); // true
console.log(user.albums[0].photos[0].uploadedAt instanceof Date); // true
```

#### Пример 2: Groups and Версияing

```typescript
class UserDTO {
  @Expose({ groups: ['user', 'admin'] })
  id: number;

  @Expose({ groups: ['user', 'admin'] })
  name: string;

  @Expose({ groups: ['admin'] })
  email: string;

  @Expose({ since: 2.0 })
  newFeature: string;

  @Expose({ until: 2.0 })
  legacyField: string;
}

// Transform for regular users
const userView = plainToClass(UserDTO, plain, { groups: ['user'] });
// { id, name } - no email

// Transform for admins
const adminView = plainToClass(UserDTO, plain, { groups: ['admin'] });
// { id, name, email }

// Transform for Версия 2.0
const v2View = plainToClass(UserDTO, plain, { version: 2.0 });
// Includes newFeature, excludes legacyField
```

#### Пример 3: Custom Transformations

```typescript
class ProductDTO {
  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toFixed(2)))
  price: number;

  @Expose()
  @Transform(({ value }) => value.map((tag: string) => tag.toLowerCase()))
  tags: string[];

  @Expose()
  @Transform(({ value, obj }) => {
    const discount = obj.discount || 0;
    return value * (1 - discount / 100);
  })
  finalPrice: number;
}
```

---

## Migration from class-трансформер

API совместимости - это **готовая замена для поддерживаемого подмножества** class-трансформер - точный охват смотрите в [таблице совместимости](./compat-class-transformer.md). Simply change the import:

```typescript
// Before
import { plainToClass, Expose, Type } from 'class-transformer';

// After
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
```

**Преимущества:**

- ✅ JIT-компиляция - никакой рефлексии на каждый вызов после того, как функция трансформации сгенерирована
- ✅ No reflect-metadata dependency
- ✅ Same API for the supported subset - см. таблицу совместимости по пробелам
- ✅ Full TypeScript support

Реальные цифры производительности смотрите в [`../benchmarks/README.md`](../benchmarks/README.md).

---

## Лучшие практики

### 1. Choose the Right API

```typescript
// ✅ New projects: Use Decorator API
@Mapper<Source, Target>()
class UserMapper { ... }

// ✅ Migrating from class-трансформер: Use API совместимости
class UserDTO {
  @Expose()
  name: string;
}
```

### 2. Reuse Mapper Instances

```typescript
// ✅ Good: Reuse маппер
const mapper = createMapper(UserMapper);
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);

// ❌ Bad: Создать new маппер each time
const result1 = plainToInstance(UserMapper, source1);
const result2 = plainToInstance(UserMapper, source2);
```

### 3. Use Type Safety

```typescript
// ✅ Good: Type-safe
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => src.firstName)
  name!: string;
}

// ❌ Bad: No type safety
@Mapper()
class UserMapper {
  @MapFrom((src: any) => src.firstName)
  name!: string;
}
```

### 4. Leverage Nested Mappers

```typescript
// ✅ Good: Reusable nested маппер
@MapWith(AddressMapper)
@Map('address')
address!: Address;

// ❌ Bad: Inline трансформация
@MapFrom((src) => ({
  street: src.address.street,
  city: src.address.city
}))
address!: Address;
```

### 5. Use Conditional Mapping Wisely

`@MapFrom` получает весь исходный объект, поэтому и простые, и составные
условия обрабатываются одним и тем же способом:

```typescript
// ✅ Good: Simple condition
@MapFrom((src) => (src.isPremium ? src.features : undefined))
features?: string[];

// ✅ Also fine: compound condition, same decorator
@MapFrom((src) => (src.role === 'admin' && src.permissions.includes('read') ? src.data : undefined))
data?: any;
```

---

---

## Распространённые паттерны

### Pattern 1: API Response Transformation

```typescript
// API Response
type ApiResponse = {
  user_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  created_at: string;
  is_active: boolean;
};

// Frontend DTO
type UserDTO = {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
};

@Mapper<ApiResponse, UserDTO>()
class ApiResponseMapper {
  @Map('user_id')
  id!: string;

  @MapFrom((src) => `${src.first_name} ${src.last_name}`)
  fullName!: string;

  @Map('email_address')
  email!: string;

  @Map('created_at')
  @Transform((value: string) => new Date(value))
  createdAt!: Date;

  @Map('is_active')
  isActive!: boolean;
}
```

### Pattern 2: Form Data to API Payload

```typescript
// Form Data
type FormData = {
  name: string;
  email: string;
  phone: string;
  agreeToTerms: boolean;
};

// API Payload
type ApiPayload = {
  user_name: string;
  contact_email: string;
  contact_phone: string;
  terms_accepted: boolean;
  created_at: string;
};

@Mapper<FormData, ApiPayload>()
class FormToApiMapper {
  @Map('name')
  user_name!: string;

  @Map('email')
  contact_email!: string;

  @Map('phone')
  contact_phone!: string;

  @Map('agreeToTerms')
  terms_accepted!: boolean;

  @MapFrom(() => new Date().toISOString())
  created_at!: string;
}
```

### Pattern 3: Database Entity to DTO

```typescript
// Database Entity
type UserEntity = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  role: string;
};

// Public DTO (exclude sensitive data)
type PublicUserDTO = {
  id: number;
  username: string;
  email: string;
  memberSince: string;
  role: string;
};

@Mapper<UserEntity, PublicUserDTO>()
class UserEntityMapper {
  @Map('id')
  id!: number;

  @Map('username')
  username!: string;

  @Map('email')
  email!: string;

  @Map('created_at')
  @Transform((date: Date) => date.toLocaleDateString())
  memberSince!: string;

  @Map('role')
  role!: string;

  // password_hash is automatically excluded
}
```

### Pattern 4: Aggregation and Calculation

```typescript
type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

type OrderSource = {
  orderId: string;
  items: OrderItem[];
  taxRate: number;
  shippingCost: number;
};

type OrderSummary = {
  orderId: string;
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

@Mapper<OrderSource, OrderSummary>()
class OrderSummaryMapper {
  @Map('orderId')
  orderId!: string;

  @MapFrom((src) => src.items.length)
  itemCount!: number;

  @MapFrom((src) => src.items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  subtotal!: number;

  @MapFrom((src) => {
    const subtotal = src.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * src.taxRate;
  })
  tax!: number;

  @Map('shippingCost')
  shipping!: number;

  @MapFrom((src) => {
    const subtotal = src.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * src.taxRate;
    return subtotal + tax + src.shippingCost;
  })
  total!: number;
}
```

---

## Устранение неполадок

### Issue 1: UnОпределитьd Values

**Problem**: Properties are unОпределитьd in the result.

```typescript
// ❌ Problem
@Map('user.name')
name!: string;

const result = plainToInstance(UserMapper, { user: null });
// result.name is unОпределитьd
```

**Solution**: Use `@Default()` or handle in трансформер.

```typescript
// ✅ Solution 1: По умолчанию value
@Map('user.name')
@Default('Unknown')
name!: string;

// ✅ Solution 2: Handle in трансформер
@MapFrom((src) => src.user?.name || 'Unknown')
name!: string;
```

### Issue 2: Type ConВерсия

**Problem**: Types don't match expected format.

```typescript
// ❌ Problem
@Map('createdAt')
createdAt!: Date;

const result = plainToInstance(UserMapper, { createdAt: '2024-01-01' });
// result.СоздатьdAt is a string, not a Date
```

**Solution**: Use `@Transform()` to convert types.

```typescript
// ✅ Solution
@Map('createdAt')
@Transform((value: string) => new Date(value))
createdAt!: Date;
```

### Issue 3: Nested Objects Not Transforming

**Problem**: Nested objects remain as plain objects.

```typescript
// ❌ Problem
@Map('address')
address!: Address;

const result = plainToInstance(UserMapper, source);
// result.address is a plain object, not an Address instance
```

**Solution**: Use `@MapWith()` or `@Type()`.

```typescript
// ✅ Solution 1: Decorator API
@MapWith(AddressMapper)
@Map('address')
address!: Address;

// ✅ Solution 2: API совместимости
@Type(() => Address)
address!: Address;
```

### Issue 4: Производительность Issues

**Problem**: Transformations are slow.

**Solution**: Reuse маппер instances and enable unsafe mode.

```typescript
// ✅ Solution 1: Reuse маппер
const mapper = createMapper(UserMapper);
// Use маппер.transform() multiple times

// ✅ Solution 2: Unsafe mode (no error handling)
@Mapper<Source, Target>({ unsafe: true })
class FastUserMapper { ... }
```

### Issue 5: Circular References

**Problem**: Objects with circular references cause stack overflow.

**Solution**: Avoid circular references or handle manually.

```typescript
// ✅ Solution: Break circular reference
@MapFrom((src) => {
  const { parent, ...rest } = src;
  return rest;
})
data!: any;
```

---

## TypeScript Конфигурация

Ensure your `tsconfig.json` is configured correctly:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "experimentalDecorators": false,
    "useDefineForClassFields": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Важно:**

- ✅ `experimentalDecorators: false` - Use TC39 Stage 3 декораторs
- ✅ `useDefineForClassFields: true` - Обязательно for декораторs
- ✅ `target: "ES2022"` - For optional chaining support

---

## Справочник API Summary

### Decorator API

**Class Decorators:**

- `@Mapper<Source, Target>(options?)` - Mark class as маппер

**Property Decorators:**

- `@Map(sourcePath)` - Map from source path
- `@MapFrom(transformer)` - Map using трансформер function (также используется для условного отображения, так как получает весь source)
- `@Transform(transformer)` - Transform value after mapping
- `@Default(value)` - Provide default value
- `@Ignore()` - Ignore property
- `@MapWith(MapperClass)` - Map nested object using another mapper

**Functions:**

- `plainToInstance(MapperClass, source)` - Transform to instance
- `plainToInstanceArray(MapperClass, sources)` - Transform array
- `tryPlainToInstance(MapperClass, source)` - Transform with errors
- `createMapper(MapperClass)` - Создать маппер instance
- `getMapper(MapperClass)` - Get singleton маппер

### API совместимости

**Decorators:**

- `@Expose(options?)` - Expose property
- `@Exclude(options?)` - Exclude property
- `@Type(typeFunction, options?)` - Specify type
- `@Transform(transformFn, options?)` - Transform value
- `@TransformClassToPlain(options?)` - Method декоратор
- `@TransformClassToClass(options?)` - Method декоратор
- `@TransformPlainToClass(classType, options?)` - Method декоратор

**Functions:**

- `plainToClass(Class, plain, options?)` - Plain to class
- `plainToInstance(Class, plain, options?)` - Alias for plainToClass
- `plainToClassFromExist(instance, plain, options?)` - Update instance
- `classToPlain(instance, options?)` - Class to plain
- `instanceToPlain(instance, options?)` - Alias for classToPlain
- `classToClass(instance, options?)` - Clone instance
- `instanceToInstance(instance, options?)` - Alias for classToClass
- `serialize(instance, options?)` - Serialize to JSON
- `deserialize(Class, json, options?)` - Deserialize from JSON
- `deserializeArray(Class, json, options?)` - Deserialize array

---

## Conclusion

The трансформер module provides:

- ✅ **JIT-компиляция** - специализированная функция трансформации компилируется один раз и переиспользуется, без рефлексии на каждый вызов
- ✅ **Two powerful APIs** - Decorator API and API совместимости
- ✅ **Type-safe** with full TypeScript support
- ✅ **Zero dependencies** - no reflect-metadata needed
- ✅ **Easy migration** - готовая замена для поддерживаемого подмножества class-трансформер
- ✅ **Flexible** - handles simple to complex трансформацияs
- ✅ **Production-ready** - battle-tested and reliable

Start transforming with confidence! 🚀
