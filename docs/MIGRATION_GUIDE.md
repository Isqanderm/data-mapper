# Migration Guide: BaseMapper → Decorator API

This guide helps you migrate from the legacy BaseMapper API to the modern Decorator API.

---

## Why Migrate?

### Performance Improvements

| Scenario | BaseMapper | Decorator API | Improvement |
|----------|-----------|---------------|-------------|
| Simple Mapping | 32M ops/sec | 152M ops/sec | **+374%** 🚀 |
| Complex Transformations | 3.1M ops/sec | 3.6M ops/sec | **+16%** ⚡ |
| Nested Objects | 35.6M ops/sec | 69.7M ops/sec | **+96%** 🚀 |
| Array Operations | 588K ops/sec | 660K ops/sec | **+12%** ⚡ |

### Developer Experience

- ✅ **Cleaner syntax**: Declarative decorators vs imperative config
- ✅ **Better type safety**: Full TypeScript support
- ✅ **Better IDE support**: IntelliSense, auto-completion
- ✅ **Better maintainability**: Class-based structure

---

## Prerequisites

### TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,  // Use TC39 decorators, not legacy
    "useDefineForClassFields": true,
    "target": "ES2022"
  }
}
```

---

## Migration Patterns

### 1. Simple Path Mapping

**Before (BaseMapper)**:
```typescript
const mapper = Mapper.create<Source, Target>({
  userName: 'name',
  userEmail: 'email',
  userAge: 'age',
});
```

**After (Decorator API)**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @Map('email')
  userEmail!: string;

  @Map('age')
  userAge!: number;
}
```

### 2. Nested Path Mapping

**Before**:
```typescript
const mapper = Mapper.create<Source, Target>({
  userName: 'user.profile.name',
  userCity: 'user.address.city',
});
```

**After**:
```typescript
@Mapper()
class UserMapper {
  @Map('user.profile.name')
  userName!: string;

  @Map('user.address.city')
  userCity!: string;
}
```

### 3. Transform Functions

**Before**:
```typescript
const mapper = Mapper.create<Source, Target>({
  fullName: (src) => `${src.firstName} ${src.lastName}`,
  age: (src) => new Date().getFullYear() - src.birthYear,
  isActive: (src) => src.status === 'active',
});
```

**After**:
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

### 4. Default Values

**Before**:
```typescript
const mapper = Mapper.create<Source, Target>(
  {
    userName: 'name',
    userScore: 'score',
    isPremium: 'premium',
  },
  {
    userScore: 0,
    isPremium: false,
  }
);
```

**After**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;

  @Map('score')
  @Default(0)
  userScore!: number;

  @Map('premium')
  @Default(false)
  isPremium!: boolean;
}
```

### 5. Nested Mappers

**Before**:
```typescript
const addressMapper = Mapper.create<SourceAddress, TargetAddress>({
  street: 'street',
  city: 'city',
});

const userMapper = Mapper.create<SourceUser, TargetUser>({
  name: 'name',
  address: addressMapper,
});
```

**After**:
```typescript
@Mapper()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

@Mapper()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: any;
}
```

### 6. Nested Object Mapping

**Before**:
```typescript
const mapper = Mapper.create<Source, Target>({
  user: {
    name: 'userName',
    email: 'userEmail',
  },
});
```

**After**:
```typescript
// Option 1: Nested mapper
@Mapper()
class UserInfoMapper {
  @Map('userName')
  name!: string;

  @Map('userEmail')
  email!: string;
}

@Mapper()
class MainMapper {
  @MapWith(UserInfoMapper)
  user!: any;
}

// Option 2: Transform function
@Mapper()
class MainMapper {
  @Transform((src: Source) => ({
    name: src.userName,
    email: src.userEmail,
  }))
  user!: any;
}
```

### 7. Configuration Options

**Before**:
```typescript
const mapper = Mapper.create<Source, Target>(
  mappingConfig,
  defaultValues,
  { useUnsafe: true }
);
```

**After**:
```typescript
@Mapper({ unsafe: true })
class UserMapper {
  // ...
}
```

---

## Complete Example

### Before (BaseMapper)

```typescript
import { Mapper } from 'om-data-mapper';

interface Source {
  firstName: string;
  lastName: string;
  birthYear: number;
  email: string;
  score?: number;
  status: string;
  address: {
    street: string;
    city: string;
  };
}

interface Target {
  fullName: string;
  age: number;
  email: string;
  userScore: number;
  isActive: boolean;
  location: {
    street: string;
    city: string;
  };
}

const addressMapper = Mapper.create({
  street: 'street',
  city: 'city',
});

const userMapper = Mapper.create<Source, Target>(
  {
    fullName: (src) => `${src.firstName} ${src.lastName}`,
    age: (src) => new Date().getFullYear() - src.birthYear,
    email: 'email',
    userScore: 'score',
    isActive: (src) => src.status === 'active',
    location: addressMapper,
  },
  {
    userScore: 0,
  }
);

const result = userMapper.execute(sourceData);
```

### After (Decorator API)

```typescript
import { Mapper, Map, Transform, Default, MapWith } from 'om-data-mapper';

interface Source {
  firstName: string;
  lastName: string;
  birthYear: number;
  email: string;
  score?: number;
  status: string;
  address: {
    street: string;
    city: string;
  };
}

@Mapper()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

@Mapper()
class UserMapper {
  @Transform((src: Source) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Transform((src: Source) => new Date().getFullYear() - src.birthYear)
  age!: number;

  @Map('email')
  email!: string;

  @Map('score')
  @Default(0)
  userScore!: number;

  @Transform((src: Source) => src.status === 'active')
  isActive!: boolean;

  @MapWith(AddressMapper)
  @Map('address')
  location!: any;
}

const mapper = new UserMapper();
const result = mapper.transform(sourceData);
```

---

## Migration Checklist

- [ ] Update `tsconfig.json` to use TC39 decorators
- [ ] Install latest version of `om-data-mapper`
- [ ] Convert mapping config to decorator classes
- [ ] Replace `Mapper.create()` with `@Mapper()` class
- [ ] Replace path strings with `@Map()` decorators
- [ ] Replace transform functions with `@Transform()` decorators
- [ ] Move default values to `@Default()` decorators
- [ ] Convert nested mappers to `@MapWith()` decorators
- [ ] Replace `mapper.execute()` with `mapper.transform()`
- [ ] Update tests
- [ ] Run benchmarks to verify performance improvements

---

## Common Pitfalls

### 1. Using Legacy Decorators

**Wrong**:
```json
{
  "experimentalDecorators": true  // ❌ Legacy decorators
}
```

**Correct**:
```json
{
  "experimentalDecorators": false  // ✅ TC39 decorators
}
```

### 2. Forgetting `!` on Properties

**Wrong**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName: string;  // ❌ TypeScript error
}
```

**Correct**:
```typescript
@Mapper()
class UserMapper {
  @Map('name')
  userName!: string;  // ✅ Definite assignment assertion
}
```

### 3. Using `execute()` Instead of `transform()`

**Wrong**:
```typescript
const mapper = new UserMapper();
const result = mapper.execute(source);  // ❌ Method doesn't exist
```

**Correct**:
```typescript
const mapper = new UserMapper();
const result = mapper.transform(source);  // ✅ Correct method
```

---

## Gradual Migration

You can use both APIs in the same project during migration:

```typescript
// Old code (still works)
const oldMapper = Mapper.create<Source, Target>({
  userName: 'name',
});

// New code (recommended)
@Mapper()
class NewMapper {
  @Map('name')
  userName!: string;
}

// Both work together
const oldResult = oldMapper.execute(source);
const newResult = new NewMapper().transform(source);
```

---

## Performance Testing

After migration, verify performance improvements:

```typescript
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

// Old mapper
const oldMapper = Mapper.create<Source, Target>({ /* ... */ });

// New mapper
@Mapper()
class NewMapper { /* ... */ }
const newMapper = new NewMapper();

suite
  .add('BaseMapper', () => {
    oldMapper.execute(testData);
  })
  .add('Decorator API', () => {
    newMapper.transform(testData);
  })
  .on('cycle', (event: any) => {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
```

---

## Need Help?

- Check [Decorator API Documentation](./DECORATOR_API.md)
- See [Examples](../examples/)
- Review [Performance Report](../benchmarks/FINAL_PERFORMANCE_REPORT.md)
- Open an issue on GitHub

