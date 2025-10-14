# NestJS Integration

High-performance drop-in replacement for NestJS's `ClassSerializerInterceptor` using `om-data-mapper`.

## 🚀 Performance

**17.28x faster** than the built-in NestJS `ClassSerializerInterceptor` (which uses `class-transformer`).

## 📦 Installation

```bash
npm install om-data-mapper
```

**Peer Dependencies:**
```bash
npm install @nestjs/common rxjs
```

## 🎯 Quick Start

### Drop-in Replacement

Simply replace the import statement - everything else stays the same!

**Before:**
```typescript
import { ClassSerializerInterceptor } from '@nestjs/common';
```

**After:**
```typescript
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';
```

That's it! Your application will now use the high-performance `om-data-mapper` for serialization.

## 📖 Usage Examples

### Global Usage (Recommended)

There are two ways to apply the interceptor globally:

#### Option 1: Using APP_INTERCEPTOR Provider (Recommended)

This is the recommended approach as it allows dependency injection and works with all NestJS features.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Option 2: Using app.useGlobalInterceptors()

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply globally
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector))
  );

  await app.listen(3000);
}
bootstrap();
```

**Note:** Option 1 is preferred because:
- ✅ Works with dependency injection
- ✅ Easier to test
- ✅ More idiomatic NestJS
- ✅ Works with all module features

### Controller-Level Usage

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';
import { UserDto } from './dto/user.dto';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  @Get()
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }
}
```

### Route-Level Usage

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';

@Controller('users')
export class UsersController {
  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }
}
```

### Global Usage with Custom Options

#### Using APP_INTERCEPTOR with Custom Options

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => {
        return new ClassSerializerInterceptor(reflector, {
          excludeExtraneousValues: true,
          groups: ['user'],
        });
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
```

#### Using app.useGlobalInterceptors() with Custom Options

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
      groups: ['user'],
    })
  );

  await app.listen(3000);
}
bootstrap();
```

### Using @SerializeOptions Decorator

```typescript
import { Controller, Get } from '@nestjs/common';
import { SerializeOptions } from 'om-data-mapper/nestjs';

@Controller('users')
export class UsersController {
  @Get()
  @SerializeOptions({ excludeExtraneousValues: true, groups: ['admin'] })
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }
  
  @Get('public')
  @SerializeOptions({ groups: ['public'] })
  findPublic(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }
}
```

## 🎨 DTO Examples

### Basic DTO with @Expose and @Exclude

```typescript
import { Expose, Exclude } from 'om-data-mapper/class-transformer-compat';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;  // Will never be serialized
}
```

### Nested Objects with @Type

```typescript
import { Expose, Type } from 'om-data-mapper/class-transformer-compat';

export class AddressDto {
  @Expose()
  street: string;

  @Expose()
  city: string;
}

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Type(() => AddressDto)
  @Expose()
  address: AddressDto;
}
```

### Custom Transformations with @Transform

```typescript
import { Expose, Transform } from 'om-data-mapper/class-transformer-compat';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  createdAt: string;
}
```

### Groups for Different Contexts

```typescript
import { Expose } from 'om-data-mapper/class-transformer-compat';

export class UserDto {
  @Expose({ groups: ['user', 'admin'] })
  id: number;

  @Expose({ groups: ['user', 'admin'] })
  name: string;

  @Expose({ groups: ['user', 'admin'] })
  email: string;

  @Expose({ groups: ['admin'] })
  role: string;  // Only visible to admins

  @Expose({ groups: ['admin'] })
  lastLogin: Date;  // Only visible to admins
}
```

## 🔧 API Reference

### ClassSerializerInterceptor

```typescript
class ClassSerializerInterceptor implements NestInterceptor {
  constructor(
    reflector: Reflector,
    defaultOptions?: ClassSerializerInterceptorOptions
  );
}
```

**Parameters:**
- `reflector` - NestJS Reflector instance (required)
- `defaultOptions` - Default serialization options (optional)

### ClassSerializerInterceptorOptions

```typescript
interface ClassSerializerInterceptorOptions {
  strategy?: 'excludeAll' | 'exposeAll';
  excludeExtraneousValues?: boolean;
  groups?: string[];
  version?: number;
  excludePrefixes?: string[];
  transformPlainObjects?: boolean;
}
```

### SerializeOptions Decorator

```typescript
function SerializeOptions(options: ClassSerializerInterceptorOptions): MethodDecorator;
```

Sets serialization options for a specific route handler.

## 🔄 Migration Guide

### From @nestjs/common ClassSerializerInterceptor

1. **Update imports:**
   ```typescript
   // Before
   import { ClassSerializerInterceptor } from '@nestjs/common';
   
   // After
   import { ClassSerializerInterceptor } from 'om-data-mapper/nestjs';
   ```

2. **Update decorator imports:**
   ```typescript
   // Before
   import { Expose, Exclude, Type, Transform } from 'class-transformer';
   
   // After
   import { Expose, Exclude, Type, Transform } from 'om-data-mapper/class-transformer-compat';
   ```

3. **That's it!** No other code changes required.

### Compatibility

The `om-data-mapper` NestJS integration is **100% compatible** with the built-in NestJS `ClassSerializerInterceptor` API. All decorators and options work exactly the same way.

## ⚡ Performance Comparison

```
Benchmark: Serializing 1000 user objects

class-transformer (NestJS default):  57,900 ops/sec
om-data-mapper:                   1,000,800 ops/sec

Result: 17.28x faster! 🚀
```

## 🎯 Best Practices

1. **Use @Expose for sensitive data:**
   ```typescript
   export class UserDto {
     @Expose()
     id: number;
     
     @Expose()
     name: string;
     
     // password is automatically excluded
   }
   ```

2. **Use groups for different contexts:**
   ```typescript
   @Get('admin')
   @SerializeOptions({ groups: ['admin'] })
   getAdminData() { ... }
   
   @Get('public')
   @SerializeOptions({ groups: ['public'] })
   getPublicData() { ... }
   ```

3. **Apply globally for consistency:**
   ```typescript
   app.useGlobalInterceptors(
     new ClassSerializerInterceptor(app.get(Reflector))
   );
   ```

## 📚 Additional Resources

- [om-data-mapper Documentation](../README.md)
- [class-transformer Compatibility](../README.md#class-transformer-compatibility)
- [NestJS Serialization Docs](https://docs.nestjs.com/techniques/serialization)

## 🐛 Troubleshooting

### Decorators not working?

Make sure you're using decorators from `om-data-mapper/class-transformer-compat`:
```typescript
import { Expose, Exclude } from 'om-data-mapper/class-transformer-compat';
```

### TypeScript errors?

Ensure you have the peer dependencies installed:
```bash
npm install @nestjs/common rxjs
```

### Performance not as expected?

Make sure you're returning class instances from your controllers, not plain objects:
```typescript
// ✅ Good - returns class instances
async findAll(): Promise<UserDto[]> {
  const users = await this.usersService.findAll();
  return users.map(user => Object.assign(new UserDto(), user));
}

// ❌ Bad - returns plain objects
async findAll(): Promise<UserDto[]> {
  return this.usersService.findAll(); // Returns plain objects
}
```

## 📄 License

MIT

