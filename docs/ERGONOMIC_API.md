# Ergonomic API Guide

This guide explains the new ergonomic API that provides TypeScript type safety without requiring verbose type assertions on every mapper instantiation.

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Comparison with class-transformer](#comparison-with-class-transformer)
- [Migration Guide](#migration-guide)

## Overview

The ergonomic API provides helper functions inspired by `class-transformer` that make it easy to create and use mappers with full TypeScript type safety, without the need for verbose type assertions.

**Key Benefits:**
- ✅ No type assertions needed
- ✅ Full TypeScript type safety
- ✅ Clean, readable code
- ✅ Similar API to class-transformer
- ✅ Works seamlessly with nested mappers

## The Problem

Previously, to get TypeScript type safety, you had to use type assertions on every mapper instantiation:

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  fullName!: string;
}

// ❌ Verbose and repetitive
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const result = mapper.transform(source);
```

This approach works but is:
- Verbose and repetitive
- Easy to forget
- Not ergonomic for common use cases

## The Solution

The new ergonomic API provides helper functions that handle type safety automatically:

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  fullName!: string;
}

// ✅ Clean and type-safe!
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
```

## API Reference

### `plainToInstance<Source, Target>(MapperClass, source, options?): Target`

Transform a plain JavaScript object to a target object in one call.

**Parameters:**
- `MapperClass` - The mapper class decorated with `@Mapper()`
- `source` - The source object to transform
- `options` - Optional transformation options (reserved for future use)

**Returns:** The transformed target object

**Example:**
```typescript
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
```

---

### `plainToInstanceArray<Source, Target>(MapperClass, sources, options?): Target[]`

Transform an array of plain JavaScript objects.

**Parameters:**
- `MapperClass` - The mapper class decorated with `@Mapper()`
- `sources` - Array of source objects to transform
- `options` - Optional transformation options

**Returns:** Array of transformed target objects

**Example:**
```typescript
const users = [{ name: 'John' }, { name: 'Jane' }];
const results = plainToInstanceArray<UserSource, UserDTO>(UserMapper, users);
```

---

### `tryPlainToInstance<Source, Target>(MapperClass, source, options?): { result: Target; errors: string[] }`

Transform with error handling.

**Parameters:**
- `MapperClass` - The mapper class decorated with `@Mapper()`
- `source` - The source object to transform
- `options` - Optional transformation options

**Returns:** Object with `result` and `errors` array

**Example:**
```typescript
const { result, errors } = tryPlainToInstance<UserSource, UserDTO>(UserMapper, source);
if (errors.length > 0) {
  console.error('Transformation errors:', errors);
}
```

---

### `tryPlainToInstanceArray<Source, Target>(MapperClass, sources, options?): Array<{ result: Target; errors: string[] }>`

Transform array with error handling.

**Parameters:**
- `MapperClass` - The mapper class decorated with `@Mapper()`
- `sources` - Array of source objects to transform
- `options` - Optional transformation options

**Returns:** Array of objects with `result` and `errors`

**Example:**
```typescript
const results = tryPlainToInstanceArray<UserSource, UserDTO>(UserMapper, sources);
results.forEach(({ result, errors }) => {
  if (errors.length > 0) {
    console.error('Errors:', errors);
  }
});
```

---

### `createMapper<Source, Target>(MapperClass): MapperMethods<Source, Target>`

Create a reusable mapper instance with full type safety.

**Parameters:**
- `MapperClass` - The mapper class decorated with `@Mapper()`

**Returns:** A mapper instance with `transform()` and `tryTransform()` methods

**Example:**
```typescript
const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
```

---

### `getMapper<Source, Target>(MapperClass): MapperMethods<Source, Target>`

Alias for `createMapper()`. Create a reusable mapper instance.

**Example:**
```typescript
const mapper = getMapper<UserSource, UserDTO>(UserMapper);
```

## Examples

### Basic Usage

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
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);

console.log(result.fullName); // 'John Doe'
console.log(result.isAdult);  // true
```

### Working with Arrays

```typescript
const users = [
  { firstName: 'John', lastName: 'Doe', age: 30 },
  { firstName: 'Jane', lastName: 'Smith', age: 25 },
];

const results = plainToInstanceArray<UserSource, UserDTO>(UserMapper, users);
// results is fully typed as UserDTO[]
```

### Error Handling

```typescript
const { result, errors } = tryPlainToInstance<UserSource, UserDTO>(UserMapper, source);

if (errors.length > 0) {
  console.error('Transformation failed:', errors);
} else {
  console.log('Success:', result);
}
```

### Reusable Mapper

```typescript
// Create once, use many times
const mapper = createMapper<UserSource, UserDTO>(UserMapper);

const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
const result3 = mapper.transform(source3);
```

### Nested Mappers

```typescript
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
  fullAddress!: string;
}

@Mapper<PersonSource, PersonDTO>()
class PersonMapper {
  @Map('name')
  name!: string;

  @MapFrom((src: PersonSource) => 
    plainToInstance<AddressSource, AddressDTO>(AddressMapper, src.address)
  )
  location!: AddressDTO;
}

const result = plainToInstance<PersonSource, PersonDTO>(PersonMapper, personSource);
console.log(result.location.fullAddress); // ✅ Fully typed!
```

## Comparison with class-transformer

Our API is inspired by `class-transformer` and provides similar functionality:

| class-transformer | om-data-mapper | Description |
|-------------------|----------------|-------------|
| `plainToInstance()` | `plainToInstance()` | Transform plain object to instance |
| `plainToClass()` | `plainToClass()` | Alias for plainToInstance |
| `plainToClassFromExist()` | N/A | Not needed (use createMapper) |
| `instanceToPlain()` | N/A | Not applicable (we transform to plain objects) |
| `@Type()` | `@MapFrom()` | Specify transformation logic |
| `@Expose()` | `@Map()` | Expose properties |
| `@Exclude()` | `@Ignore()` | Exclude properties |
| `@Transform()` | `@Transform()` | Transform values |

**Key Differences:**
- om-data-mapper uses JIT compilation for better performance
- om-data-mapper focuses on data transformation, not serialization
- om-data-mapper has simpler API with fewer options
- om-data-mapper uses TC39 Stage 3 decorators (not experimental decorators)

## Migration Guide

### From Type Assertions

**Before:**
```typescript
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const result = mapper.transform(source);
```

**After:**
```typescript
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
```

### From Direct Instantiation

**Before:**
```typescript
const mapper = new UserMapper();
const result = mapper.transform(source); // ❌ No type safety
```

**After:**
```typescript
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source); // ✅ Type safe!
```

### For Reusable Mappers

**Before:**
```typescript
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
```

**After:**
```typescript
const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
```

## Best Practices

1. **Use `plainToInstance()` for one-off transformations**
   ```typescript
   const result = plainToInstance<Source, Target>(MyMapper, source);
   ```

2. **Use `createMapper()` for reusable mappers**
   ```typescript
   const mapper = createMapper<Source, Target>(MyMapper);
   // Use mapper multiple times
   ```

3. **Use `tryPlainToInstance()` when you need error handling**
   ```typescript
   const { result, errors } = tryPlainToInstance<Source, Target>(MyMapper, source);
   ```

4. **Always specify generic types for type safety**
   ```typescript
   // ✅ Good
   plainToInstance<UserSource, UserDTO>(UserMapper, source);
   
   // ❌ Bad (loses type safety)
   plainToInstance(UserMapper, source);
   ```

5. **Use `plainToInstanceArray()` for arrays**
   ```typescript
   const results = plainToInstanceArray<Source, Target>(MyMapper, sources);
   ```

## See Also

- [Decorator API Guide](./DECORATOR_API.md)
- [TypeScript Type Safety Guide](./typescript-type-safety.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Examples](../examples/ergonomic-api.ts)

