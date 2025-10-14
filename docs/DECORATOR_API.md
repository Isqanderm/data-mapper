# Decorator API Documentation

**File**: `src/decorators/core.ts`  
**Status**: ✅ **RECOMMENDED** - Primary API for new projects  
**Performance**: 112-474% faster than BaseMapper

---

## Overview

The Decorator API is the modern, high-performance way to create data mappers in om-data-mapper. It uses TC39 Stage 3 decorators and JIT compilation to achieve superior performance while providing a clean, declarative syntax.

### Why Use Decorator API?

- 🚀 **Superior Performance**: 112-474% faster than BaseMapper
- 🎨 **Better DX**: Clean, declarative syntax
- 🔒 **Type Safety**: Full TypeScript support
- 📦 **Maintainability**: Class-based structure
- ⚡ **JIT Compilation**: Generates optimized code automatically

---

## Quick Start

### Installation

```bash
npm install om-data-mapper
```

### TypeScript Configuration

Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,  // Use TC39 decorators
    "useDefineForClassFields": true,
    "target": "ES2022"
  }
}
```

### Basic Example

```typescript
import { Mapper, Map, Transform, Default } from 'om-data-mapper';

interface Source {
  firstName: string;
  lastName: string;
  age: number;
  score?: number;
}

@Mapper()
class UserMapper {
  @Map('firstName')
  name!: string;

  @Map('age')
  userAge!: number;

  @Transform((src: Source) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('score')
  @Default(0)
  userScore!: number;
}

// Usage
const mapper = new UserMapper();
const result = mapper.transform({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
});

console.log(result);
// { name: 'John', userAge: 30, fullName: 'John Doe', userScore: 0 }
```

---

## Core Decorators

### `@Mapper(options?)`

Class decorator that marks a class as a mapper.

**Parameters**:
- `options?: MapperOptions` - Optional configuration

```typescript
interface MapperOptions {
  unsafe?: boolean;      // Skip error handling for max performance
  useUnsafe?: boolean;   // Alias for unsafe
}
```

**Example**:
```typescript
@Mapper()
class MyMapper {
  // ...
}

// With options
@Mapper({ unsafe: true })
class UnsafeMapper {
  // ...
}
```

### `@Map(sourcePath)`

Maps a field from a source path.

**Parameters**:
- `sourcePath: string` - Path to source field (supports nested paths)

**Example**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @Map('user.profile.email')  // Nested path
  email!: string;

  @Map('data.items')  // Arrays
  items!: any[];
}
```

### `@Transform(transformer)`

Applies a custom transformation function.

**Parameters**:
- `transformer: (source: any) => any` - Transformation function

**Example**:
```typescript
@Mapper()
class UserMapper {
  @Transform((src: Source) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Transform((src: Source) => new Date().getFullYear() - src.birthYear)
  age!: number;

  @Transform((src: Source) => src.status === 'active')
  isActive!: boolean;
}
```

### `@Default(value)`

Provides a default value if the field is undefined.

**Parameters**:
- `value: any` - Default value

**Example**:
```typescript
@Mapper()
class UserMapper {
  @Map('score')
  @Default(0)
  userScore!: number;

  @Map('premium')
  @Default(false)
  isPremium!: boolean;

  @Transform((src: Source) => src.value)
  @Default('N/A')
  displayValue!: string;
}
```

**Note**: Can be combined with `@Map()` or `@Transform()`.

### `@When(condition)`

Conditionally maps a field based on a predicate.

**Parameters**:
- `condition: (source: any) => boolean` - Condition function

**Example**:
```typescript
@Mapper()
class UserMapper {
  @When((src: Source) => src.status === 'active')
  @Map('name')
  activeName?: string;

  @When((src: Source) => src.age >= 18)
  @Transform((src: Source) => src.email)
  adultEmail?: string;
}
```

**Note**: Field will be `undefined` if condition is false.

### `@MapWith(MapperClass)`

Uses a nested mapper for complex objects.

**Parameters**:
- `MapperClass: new () => any` - Mapper class to use

**Example**:
```typescript
@Mapper()
class AddressMapper {
  @Map('street')
  streetName!: string;

  @Map('city')
  cityName!: string;
}

@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @Map('address')  // Optional: specify source path
  userAddress!: any;
}
```

### `@TransformValue(transformer)`

Transforms the value after mapping.

**Parameters**:
- `transformer: (value: any) => any` - Value transformation function

**Example**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  @TransformValue((value: string) => value.toUpperCase())
  userName!: string;

  @Map('score')
  @TransformValue((value: number) => value * 100)
  percentage!: number;
}
```

### `@Ignore()`

Excludes a field from mapping.

**Example**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @Ignore()
  internalField!: string;  // Won't be mapped
}
```

---

## Advanced Usage

### Combining Decorators

Decorators can be combined for complex mappings:

```typescript
@Mapper()
class UserMapper {
  // Map + Default
  @Map('score')
  @Default(0)
  userScore!: number;

  // Transform + Default
  @Transform((src: Source) => src.value)
  @Default('N/A')
  displayValue!: string;

  // When + Map + Default
  @When((src: Source) => src.status === 'active')
  @Map('name')
  @Default('Unknown')
  activeName!: string;

  // Map + TransformValue
  @Map('email')
  @TransformValue((email: string) => email.toLowerCase())
  normalizedEmail!: string;
}
```

### Nested Mappers

```typescript
@Mapper()
class AddressMapper {
  @Map('street')
  streetName!: string;

  @Map('city')
  cityName!: string;

  @Map('zipCode')
  @Default('00000')
  zip!: string;
}

@Mapper()
class ContactMapper {
  @Map('email')
  emailAddress!: string;

  @Map('phone')
  phoneNumber!: string;
}

@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @MapWith(AddressMapper)
  @Map('address')
  userAddress!: any;

  @MapWith(ContactMapper)
  @Map('contact')
  contactInfo!: any;
}
```

### Array Mapping

```typescript
@Mapper()
class ItemMapper {
  @Map('id')
  itemId!: number;

  @Map('name')
  itemName!: string;
}

@Mapper()
class OrderMapper {
  @Map('orderId')
  id!: string;

  // Map array of items
  @Transform((src: Source) => src.items.map(item => {
    const mapper = new ItemMapper();
    return mapper.transform(item);
  }))
  orderItems!: any[];
}
```

---

## Mapper Methods

### `transform<Source>(source: Source): any`

Transforms a source object to target object.

**Parameters**:
- `source: Source` - Source object

**Returns**: Transformed object

**Example**:
```typescript
const mapper = new UserMapper();
const result = mapper.transform(sourceData);
```

**Note**: This is the recommended method. It's optimized for performance and skips error checking.

### `tryTransform<Source>(source: Source): { result: any; errors: string[] }`

Transforms with error handling.

**Parameters**:
- `source: Source` - Source object

**Returns**: Object with `result` and `errors`

**Example**:
```typescript
const mapper = new UserMapper();
const { result, errors } = mapper.tryTransform(sourceData);

if (errors.length > 0) {
  console.error('Mapping errors:', errors);
}

console.log(result);
```

---

## Performance

The Decorator API uses JIT compilation to achieve superior performance:

### Benchmark Results (vs BaseMapper)

| Scenario | BaseMapper | Decorator API | Performance |
|----------|-----------|---------------|-------------|
| Simple Mapping | 32M ops/sec | **152M ops/sec** | **474%** 🚀 |
| Complex Transformations | 3.1M ops/sec | **3.6M ops/sec** | **116%** ⚡ |
| Nested Objects | 35.6M ops/sec | **69.7M ops/sec** | **196%** 🚀 |
| Array Operations | 588K ops/sec | **660K ops/sec** | **112%** ⚡ |
| Conditional Mappings | 53-58M ops/sec | **66-74M ops/sec** | **125-128%** ⚡ |

**Conclusion**: Decorator API is 12-374% faster across all scenarios!

### How It Works

1. **Metadata Collection**: Decorators collect mapping metadata at class definition
2. **JIT Compilation**: On first instantiation, generates optimized JavaScript code
3. **Code Execution**: Executes pre-compiled function (no wrapper overhead)

**Example Generated Code**:
```javascript
// For @Map('score') @Default(0)
target.userScore = source?.score ?? cache['__defValues']['userScore'];

// For @Transform((src) => src.value * 2)
target.result = cache['result__transformer'](source);

// For @When((src) => src.active) @Map('name')
if (cache['userName__condition'](source)) {
  target.userName = source?.name;
}
```

---

## Migration from BaseMapper

See [Migration Guide](./MIGRATION_GUIDE.md) for detailed migration instructions.

### Quick Comparison

**BaseMapper**:
```typescript
const mapper = Mapper.create<Source, Target>({
  userName: 'name',
  userAge: 'age',
  fullName: (src) => `${src.firstName} ${src.lastName}`,
}, { userAge: 0 });
```

**Decorator API**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @Map('age')
  @Default(0)
  userAge!: number;

  @Transform((src: Source) => `${src.firstName} ${src.lastName}`)
  fullName!: string;
}
```

---

## See Also

- [BaseMapper API](./BASE_MAPPER_API.md) - Legacy functional API
- [Migration Guide](./MIGRATION_GUIDE.md) - How to migrate
- [Performance Report](../benchmarks/FINAL_PERFORMANCE_REPORT.md) - Detailed benchmarks
- [Examples](../examples/) - Code examples

