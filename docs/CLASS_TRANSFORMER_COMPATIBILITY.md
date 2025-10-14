# class-transformer Compatibility Layer

## Overview

om-data-mapper provides a **full API compatibility layer** for the popular [class-transformer](https://github.com/typestack/class-transformer) library. This allows you to use om-data-mapper as a **drop-in replacement** for class-transformer with **significantly better performance** (average **376.73% faster**).

## Why Use om-data-mapper Instead of class-transformer?

### Performance Benefits

om-data-mapper's compatibility layer is **3-7x faster** than class-transformer across all scenarios:

| Scenario | Performance Improvement |
|----------|------------------------|
| Simple Transformation | **5.17x faster** |
| Nested Objects | **3.65x faster** |
| Array Transformation | **3.81x faster** |
| Complex Decorators | **3.56x faster** |
| Serialization | **7.02x faster** |
| Large Objects | **5.39x faster** |

See [Performance Comparison](../bench/PERFORMANCE_COMPARISON.md) for detailed benchmarks.

### Key Advantages

✅ **100% API Compatible** - No code changes required  
✅ **3-7x Faster** - JIT compilation and optimized code paths  
✅ **Drop-in Replacement** - Just change the import path  
✅ **Same Decorators** - `@Expose`, `@Exclude`, `@Type`, `@Transform`  
✅ **Same Functions** - `plainToClass`, `classToPlain`, etc.  
✅ **Better Scalability** - Performance improves with object size  

---

## Migration Guide

### Step 1: Install om-data-mapper

```bash
npm install om-data-mapper
# or
yarn add om-data-mapper
```

### Step 2: Update Imports

Simply change your import statements:

```typescript
// Before (class-transformer)
import { 
  plainToClass, 
  classToPlain,
  Expose,
  Exclude,
  Type,
  Transform
} from 'class-transformer';

// After (om-data-mapper)
import { 
  plainToClass, 
  classToPlain,
  Expose,
  Exclude,
  Type,
  Transform
} from 'om-data-mapper/class-transformer-compat';
```

### Step 3: That's It!

No other changes needed. Your existing code will work exactly the same, but faster.

---

## API Reference

### Decorators

#### `@Expose(options?)`

Marks a property to be exposed during transformation.

```typescript
class User {
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

**Options:**
- `name?: string` - Expose under a different name
- `groups?: string[]` - Only expose in specific groups
- `since?: number` - Expose starting from this version
- `until?: number` - Expose until this version
- `toClassOnly?: boolean` - Only expose when transforming to class
- `toPlainOnly?: boolean` - Only expose when transforming to plain

#### `@Exclude(options?)`

Marks a property to be excluded during transformation.

```typescript
class User {
  id: number;
  name: string;

  @Exclude()
  password: string;

  @Exclude({ toPlainOnly: true })
  internalId: string;
}
```

**Options:**
- `toClassOnly?: boolean` - Only exclude when transforming to class
- `toPlainOnly?: boolean` - Only exclude when transforming to plain

#### `@Type(typeFunction, options?)`

Specifies the type for proper transformation of nested objects.

```typescript
class Photo {
  id: number;
  url: string;
}

class User {
  name: string;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Photo)
  photos: Photo[];
}
```

#### `@Transform(transformFn, options?)`

Applies a custom transformation function.

```typescript
class User {
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Transform(({ value }) => value >= 18)
  isAdult: boolean;
}
```

**Transform Function Parameters:**
```typescript
interface TransformFnParams {
  value: any;        // The value to transform
  key: string;       // The property key
  obj: any;          // The source object
  type: TransformationType;  // 'plainToClass' | 'classToPlain' | 'classToClass'
  options: ClassTransformOptions;  // Transformation options
}
```

---

### Functions

#### `plainToClass(cls, plain, options?)`

Converts a plain object to a class instance.

```typescript
class User {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

const plain = { id: 1, name: 'John' };
const user = plainToClass(User, plain);
// user is an instance of User
```

**Alias:** `plainToInstance`

#### `classToPlain(object, options?)`

Converts a class instance to a plain object.

```typescript
const user = new User();
user.id = 1;
user.name = 'John';

const plain = classToPlain(user);
// plain is { id: 1, name: 'John' }
```

**Alias:** `instanceToPlain`

#### `plainToClassFromExist(clsObject, plain, options?)`

Transforms a plain object into an existing class instance.

```typescript
const user = new User();
plainToClassFromExist(user, { id: 1, name: 'John' });
// user is updated with the plain object data
```

#### `classToClass(object, options?)`

Creates a deep clone of a class instance.

```typescript
const user = new User();
const clone = classToClass(user);
// clone is a deep copy of user
```

**Alias:** `instanceToInstance`

#### `serialize(object, options?)`

Serializes a class instance to a JSON string.

```typescript
const user = new User();
const json = serialize(user);
// json is '{"id":1,"name":"John"}'
```

#### `deserialize(cls, json, options?)`

Deserializes a JSON string to a class instance.

```typescript
const json = '{"id":1,"name":"John"}';
const user = deserialize(User, json);
// user is an instance of User
```

#### `deserializeArray(cls, json, options?)`

Deserializes a JSON array to class instances.

```typescript
const json = '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]';
const users = deserializeArray(User, json);
// users is an array of User instances
```

---

### Transformation Options

All transformation functions accept an optional `options` parameter:

```typescript
interface ClassTransformOptions {
  strategy?: 'excludeAll' | 'exposeAll';  // Default: 'exposeAll'
  excludeExtraneousValues?: boolean;      // Only include @Expose properties
  groups?: string[];                      // Filter by groups
  version?: number;                       // Filter by version
  excludePrefixes?: string[];             // Exclude properties with these prefixes
  ignoreDecorators?: boolean;             // Ignore all decorators
  enableImplicitConversion?: boolean;     // Auto-convert types
}
```

**Examples:**

```typescript
// Only include properties with @Expose decorator
plainToClass(User, plain, { excludeExtraneousValues: true });

// Filter by groups
plainToClass(User, plain, { groups: ['admin'] });

// Filter by version
plainToClass(User, plain, { version: 2.0 });

// Exclude properties starting with underscore
classToPlain(user, { excludePrefixes: ['_'] });
```

---

## Examples

### Basic Usage

```typescript
import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';

class User {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

const plain = { id: 1, name: 'John', email: 'john@example.com' };
const user = plainToClass(User, plain);

console.log(user instanceof User); // true
console.log(user.name); // 'John'
```

### Nested Objects

```typescript
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';

class Address {
  @Expose()
  street: string;

  @Expose()
  city: string;
}

class User {
  @Expose()
  name: string;

  @Expose()
  @Type(() => Address)
  address: Address;
}

const plain = {
  name: 'John',
  address: { street: '123 Main St', city: 'New York' }
};

const user = plainToClass(User, plain);
console.log(user.address instanceof Address); // true
```

### Custom Transformations

```typescript
import { plainToClass, Expose, Transform } from 'om-data-mapper/class-transformer-compat';

class User {
  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;
}

const plain = { name: 'john', createdAt: '2024-01-01' };
const user = plainToClass(User, plain);

console.log(user.name); // 'JOHN'
console.log(user.createdAt instanceof Date); // true
```

### Excluding Properties

```typescript
import { classToPlain, Expose, Exclude } from 'om-data-mapper/class-transformer-compat';

class User {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Exclude()
  password: string;
}

const user = new User();
user.id = 1;
user.name = 'John';
user.password = 'secret';

const plain = classToPlain(user);
console.log(plain); // { id: 1, name: 'John' }
// password is excluded
```

---

## Known Differences

While om-data-mapper aims for 100% compatibility, there are a few minor differences:

1. **Performance Characteristics**: om-data-mapper is significantly faster, especially for large objects and arrays.

2. **Error Messages**: Error messages may differ slightly in wording, though they convey the same information.

3. **Internal Implementation**: om-data-mapper uses JIT compilation instead of reflection, but the external API is identical.

These differences should not affect your application's functionality.

---

## Performance Tips

1. **Reuse Class Definitions**: Define your classes once and reuse them for better performance.

2. **Use `excludeExtraneousValues`**: When you only need specific properties, use this option to skip unnecessary processing.

3. **Batch Transformations**: Transform arrays in a single call rather than individual items.

4. **Cache Instances**: If transforming the same data repeatedly, consider caching the result.

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues**: https://github.com/Isqanderm/data-mapper/issues
- **Documentation**: https://github.com/Isqanderm/data-mapper
- **Performance Benchmarks**: See `bench/PERFORMANCE_COMPARISON.md`

---

## License

MIT License - See LICENSE file for details.

