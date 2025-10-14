# BaseMapper API Documentation

**File**: `src/core/Mapper.ts`  
**Status**: Legacy API - Maintained for compatibility  
**Recommended**: Use Decorator API (`@Mapper()`) for new projects

---

## Overview

BaseMapper is the original functional API for creating data mappers in om-data-mapper. It uses JIT (Just-In-Time) compilation to generate optimized transformation functions.

While still fully supported, the **Decorator API is now recommended** for new projects due to:
- Better developer experience (declarative syntax)
- Superior performance (112-474% faster)
- Better type safety
- Better maintainability

---

## Basic Usage

### Simple Mapping

```typescript
import { Mapper } from 'om-data-mapper';

interface Source {
  firstName: string;
  lastName: string;
  age: number;
}

interface Target {
  fullName: string;
  userAge: number;
}

const mapper = Mapper.create<Source, Target>({
  fullName: (src) => `${src.firstName} ${src.lastName}`,
  userAge: 'age', // Simple path mapping
});

const result = mapper.execute({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
});

console.log(result.result);
// { fullName: 'John Doe', userAge: 30 }
```

### Path Mapping

```typescript
interface Source {
  user: {
    profile: {
      name: string;
    };
  };
}

interface Target {
  userName: string;
}

const mapper = Mapper.create<Source, Target>({
  userName: 'user.profile.name', // Nested path
});
```

### Default Values

```typescript
const mapper = Mapper.create<Source, Target>(
  {
    userName: 'name',
    userScore: 'score',
  },
  {
    userScore: 0, // Default value if score is undefined
  }
);
```

### Nested Mappers

```typescript
interface Address {
  street: string;
  city: string;
}

interface User {
  name: string;
  address: Address;
}

const addressMapper = Mapper.create<any, Address>({
  street: 'street',
  city: 'city',
});

const userMapper = Mapper.create<any, User>({
  name: 'name',
  address: addressMapper, // Nested mapper
});
```

---

## API Reference

### `Mapper.create<Source, Target>()`

Creates a new mapper instance.

**Parameters**:
- `mappingConfig: MappingConfiguration<Source, Target>` - Mapping configuration object
- `defaultValues?: DefaultValues<Target>` - Optional default values
- `config?: MapperConfig` - Optional configuration

**Returns**: `Mapper<Source, Target>`

**Example**:
```typescript
const mapper = Mapper.create<Source, Target>(
  {
    targetField: 'sourceField',
    computed: (src) => src.value * 2,
  },
  { computed: 0 }, // defaults
  { useUnsafe: false } // config
);
```

### `mapper.execute(source)`

Executes the mapping transformation.

**Parameters**:
- `source: Source` - Source object to transform

**Returns**: `MappingResult<Target>`
```typescript
interface MappingResult<T> {
  result: T;
  errors: string[];
}
```

**Example**:
```typescript
const result = mapper.execute(sourceData);

if (result.errors.length > 0) {
  console.error('Mapping errors:', result.errors);
}

console.log(result.result);
```

---

## Mapping Configuration

### Configuration Types

```typescript
type MappingConfiguration<Source, Target> = {
  [K in keyof Target]:
    | string                    // Path mapping: 'user.name'
    | ((source: Source) => Target[K])  // Transform function
    | Mapper<any, Target[K]>    // Nested mapper
    | object;                   // Nested object mapping
};
```

### 1. Path Mapping (String)

Map a field using a path string:

```typescript
{
  targetField: 'sourceField',           // Simple
  userName: 'user.profile.name',        // Nested
  items: 'data.items',                  // Arrays
}
```

**Features**:
- Supports nested paths with dot notation
- Handles optional chaining automatically (`?.`)
- Works with arrays

### 2. Transform Function

Use a function for custom transformations:

```typescript
{
  fullName: (src) => `${src.firstName} ${src.lastName}`,
  age: (src) => new Date().getFullYear() - src.birthYear,
  isActive: (src) => src.status === 'active',
}
```

**Features**:
- Full access to source object
- Can perform any computation
- Type-safe with TypeScript

### 3. Nested Mapper

Use another mapper for nested objects:

```typescript
const addressMapper = Mapper.create<SourceAddress, TargetAddress>({
  street: 'street',
  city: 'city',
});

const userMapper = Mapper.create<SourceUser, TargetUser>({
  name: 'name',
  address: addressMapper, // Nested mapper
});
```

### 4. Nested Object Mapping

Define nested mappings inline:

```typescript
{
  user: {
    name: 'userName',
    email: 'userEmail',
  }
}
```

---

## Configuration Options

### `MapperConfig`

```typescript
interface MapperConfig {
  useUnsafe?: boolean;  // Skip error handling for performance
}
```

**Example**:
```typescript
const mapper = Mapper.create<Source, Target>(
  mappingConfig,
  defaultValues,
  { useUnsafe: true } // Skip try-catch for max performance
);
```

**Warning**: `useUnsafe: true` disables error handling. Use only when you're certain the mapping won't throw errors.

---

## Default Values

Provide default values for fields that might be undefined:

```typescript
const mapper = Mapper.create<Source, Target>(
  {
    userName: 'name',
    userScore: 'score',
    isPremium: 'premium',
  },
  {
    userScore: 0,      // Default if score is undefined
    isPremium: false,  // Default if premium is undefined
  }
);
```

**Note**: Default values only apply to path mappings, not transform functions.

---

## Error Handling

The mapper collects errors during transformation:

```typescript
const result = mapper.execute(source);

if (result.errors.length > 0) {
  console.error('Mapping errors:');
  result.errors.forEach(error => console.error(error));
}

// Result is still available (partial transformation)
console.log(result.result);
```

**Error messages include**:
- Field name where error occurred
- Error description
- Source path (for path mappings)

---

## Performance

BaseMapper uses JIT compilation for optimal performance:

1. **First call**: Generates optimized code via `new Function()`
2. **Subsequent calls**: Executes pre-compiled function

**Benchmark results** (vs Decorator API):
- Simple mappings: ~30M ops/sec (Decorator: 150M ops/sec)
- Complex transformations: ~3M ops/sec (Decorator: 3.6M ops/sec)
- Array operations: ~600K ops/sec (Decorator: 660K ops/sec)

**Recommendation**: Use Decorator API for better performance.

---

## Migration to Decorator API

### Before (BaseMapper)

```typescript
const mapper = Mapper.create<Source, Target>({
  userName: 'name',
  userAge: 'age',
  fullName: (src) => `${src.firstName} ${src.lastName}`,
}, {
  userAge: 0,
});

const result = mapper.execute(source);
```

### After (Decorator API)

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

const mapper = new UserMapper();
const result = mapper.transform(source);
```

**Benefits**:
- ✅ 112-474% faster
- ✅ Better type safety
- ✅ Cleaner syntax
- ✅ Better IDE support

---

## When to Use BaseMapper

Use BaseMapper when:
- ✅ You need dynamic mapping configuration at runtime
- ✅ You can't use TypeScript decorators (legacy projects)
- ✅ You prefer functional programming style
- ✅ You're migrating from an older version

Use Decorator API when:
- ⚡ You want maximum performance
- ⚡ You want better developer experience
- ⚡ You're starting a new project
- ⚡ You want type safety

---

## Examples

See `examples/01-basic/` for more examples using BaseMapper.

For Decorator API examples, see `examples/02-advanced/`.

---

## See Also

- [Decorator API Documentation](./DECORATOR_API.md) - Recommended for new projects
- [Migration Guide](./MIGRATION_GUIDE.md) - How to migrate from BaseMapper to Decorator API
- [Performance Comparison](../benchmarks/FINAL_PERFORMANCE_REPORT.md) - Detailed performance analysis

