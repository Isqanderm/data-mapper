# Migration Guide: class-transformer to om-data-mapper

This guide helps you migrate from `class-transformer` to `om-data-mapper` for better performance while maintaining compatibility.

## Quick Start: Drop-in Replacement

The easiest way to migrate is using the compatibility layer:

```ts
// Before (class-transformer)
import { plainToClass, Expose, Type } from 'class-transformer';

// After (om-data-mapper) - Just change the import!
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';

// Your existing code works exactly the same, backed by JIT compilation instead of interpretation 🚀
```

## Migration Patterns

### Pattern 1: Basic Property Mapping

**Before (class-transformer):**

```ts
import 'reflect-metadata';
import { plainToClass, Expose } from 'class-transformer';

class UserDTO {
  @Expose()
  id: number;

  @Expose({ name: 'user_name' })
  name: string;
}

const user = plainToClass(UserDTO, { id: 1, user_name: 'John' });
```

**After (om-data-mapper - Compatibility Layer):**

```ts
// No reflect-metadata needed!
import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  @Expose()
  id: number;

  @Expose({ name: 'user_name' })
  name: string;
}

const user = plainToClass(UserDTO, { id: 1, user_name: 'John' });
```

**After (om-data-mapper - Native API, Recommended):**

```ts
import { Mapper, Map, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('id')
  id!: number;

  @Map('user_name')
  name!: string;
}

const user = plainToInstance(UserMapper, { id: 1, user_name: 'John' });
```

---

### Pattern 2: Nested Objects with Type

**Before (class-transformer):**

```ts
import { plainToClass, Type } from 'class-transformer';

class AddressDTO {
  street: string;
  city: string;
}

class UserDTO {
  name: string;

  @Type(() => AddressDTO)
  address: AddressDTO;
}

const user = plainToClass(UserDTO, data);
```

**After (om-data-mapper - Compatibility Layer):**

```ts
import { plainToClass, Type } from 'om-data-mapper/class-transformer-compat';

class AddressDTO {
  street: string;
  city: string;
}

class UserDTO {
  name: string;

  @Type(() => AddressDTO)
  address: AddressDTO;
}

const user = plainToClass(UserDTO, data);
```

**After (om-data-mapper - Native API, Recommended):**

```ts
import { Mapper, Map, MapWith, plainToInstance } from 'om-data-mapper';

@Mapper<AddressSource, AddressDTO>()
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
  address!: AddressDTO;
}

const user = plainToInstance(UserMapper, data);
```

---

### Pattern 3: Custom Transformations

**Before (class-transformer):**

```ts
import { plainToClass, Transform } from 'class-transformer';

class UserDTO {
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Transform(({ value }) => new Date(value))
  createdAt: Date;
}

const user = plainToClass(UserDTO, data);
```

**After (om-data-mapper - Compatibility Layer):**

```ts
import { plainToClass, Transform } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Transform(({ value }) => new Date(value))
  createdAt: Date;
}

const user = plainToClass(UserDTO, data);
```

**After (om-data-mapper - Native API, Recommended):**

```ts
import { Mapper, MapFrom, Transform, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => src.name.toUpperCase())
  name!: string;

  @MapFrom((src: UserSource) => new Date(src.createdAt))
  createdAt!: Date;
}

const user = plainToInstance(UserMapper, data);
```

---

### Pattern 4: Array Transformations

**Before (class-transformer):**

```ts
import { plainToClass } from 'class-transformer';

const users = data.map((item) => plainToClass(UserDTO, item));
```

**After (om-data-mapper - Compatibility Layer):**

```ts
import { plainToClass } from 'om-data-mapper/class-transformer-compat';

const users = data.map((item) => plainToClass(UserDTO, item));
```

**After (om-data-mapper - Native API, Recommended):**

```ts
import { plainToInstanceArray } from 'om-data-mapper';

// More efficient - single mapper instance
const users = plainToInstanceArray(UserMapper, data);
```

---

### Pattern 5: Excluding Properties

**Before (class-transformer):**

```ts
import { Exclude } from 'class-transformer';

class UserDTO {
  name: string;

  @Exclude()
  password: string;
}
```

**After (om-data-mapper - Compatibility Layer):**

```ts
import { Exclude } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  name: string;

  @Exclude()
  password: string;
}
```

**After (om-data-mapper - Native API, Recommended):**

```ts
import { Mapper, Map, Ignore } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @Ignore()
  password!: string;
}
```

---

## Key Differences

| Feature          | class-transformer           | om-data-mapper                       |
| ---------------- | --------------------------- | ------------------------------------ |
| **Metadata**     | Requires `reflect-metadata` | No metadata needed                   |
| **Decorators**   | Legacy experimental         | TC39 Stage 3 (standard)              |
| **Compilation**  | Interpreted at runtime      | JIT-compiled once, reused thereafter |
| **Dependencies** | Has dependencies            | Zero dependencies                    |
| **Bundle Size**  | Larger                      | Smaller (tree-shakeable)             |
| **Type Safety**  | Limited                     | Full TypeScript support              |

## Migration Checklist

- [ ] Remove `import 'reflect-metadata'` from your code
- [ ] Update `tsconfig.json` to use TC39 decorators (see [TypeScript Configuration](#typescript-configuration))
- [ ] Change imports from `class-transformer` to `om-data-mapper/class-transformer-compat`
- [ ] Test your transformations
- [ ] (Optional) Migrate to native API for better performance and type safety

## TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": false, // Do not use legacy decorators
    "emitDecoratorMetadata": false // Not needed
  }
}
```

## Performance Tips

For measured throughput against class-transformer, see
[`../benchmarks/README.md`](../benchmarks/README.md), which runs this
package's own code against the real class-transformer library. The tips
below help either way:

1. **Reuse mapper instances** instead of creating new ones:

   ```ts
   // ❌ Slow
   data.map((item) => plainToClass(UserDTO, item));

   // ✅ Fast
   const mapper = getMapper(UserMapper);
   data.map((item) => mapper.transform(item));
   ```

2. **Use batch functions** for arrays:

   ```ts
   // ✅ More efficient
   plainToInstanceArray(UserMapper, data);
   ```

3. **Enable unsafe mode** for trusted data:
   ```ts
   @Mapper<Source, Target>({ unsafe: true })
   class FastMapper {
     /* ... */
   }
   ```

## Need Help?

- **Documentation**: [README.md](../README.md)
- **API Reference**: [TypeDoc](https://isqanderm.github.io/data-mapper/)
- **Issues**: [GitHub Issues](https://github.com/Isqanderm/data-mapper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Isqanderm/data-mapper/discussions)
