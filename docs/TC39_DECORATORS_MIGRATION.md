# TC39 Stage 3 Decorators Migration Guide

## Overview

The om-data-mapper class-transformer compatibility layer now uses **TC39 Stage 3 decorators** (modern decorators) instead of legacy experimental decorators. This provides better performance, type safety, and aligns with the JavaScript standard.

## Key Differences from Legacy Decorators

### 1. Decorator Syntax

**Legacy Decorators (Old):**
```typescript
// Applied directly to prototype
Expose()(User.prototype, 'id');
```

**TC39 Stage 3 Decorators (New):**
```typescript
// Must be used with class syntax
class User {
  @Expose()
  id: number;
}
```

### 2. TypeScript Configuration

The project uses the following TypeScript configuration for TC39 Stage 3 decorators:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,  // Use standard decorators, not legacy
    "useDefineForClassFields": true,  // Required for modern decorators
    "target": "ES2022"
  }
}
```

### 3. Metadata Storage

**Legacy Decorators:**
- Used `reflect-metadata` or WeakMap with manual prototype manipulation
- Decorators received `(target, propertyKey, descriptor)` parameters

**TC39 Stage 3 Decorators:**
- Use `context.addInitializer()` for metadata storage
- Decorators receive `(target, context)` parameters
- Context provides `kind`, `name`, and other metadata

## Usage Examples

### Basic Usage

```typescript
import { plainToClass, Expose, Exclude } from 'om-data-mapper/class-transformer-compat';

class User {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Exclude()
  password: string;
}

const plain = { id: 1, name: 'John', password: 'secret' };
const user = plainToClass(User, plain);

console.log(user.id); // 1
console.log(user.name); // 'John'
console.log(user.password); // undefined
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

## Limitations

### Cannot Apply Decorators Dynamically

With TC39 Stage 3 decorators, you **cannot** apply decorators dynamically to prototypes:

```typescript
// ❌ This does NOT work with TC39 Stage 3 decorators
Expose()(User.prototype, 'id');

// ✅ This is the correct way
class User {
  @Expose()
  id: number;
}
```

### JavaScript Files

TC39 Stage 3 decorators require TypeScript or a build step. You cannot use them directly in plain JavaScript files without a transpiler.

**Workaround for JavaScript:**
If you need to use the compatibility layer in plain JavaScript, you have two options:

1. **Use the built files** - Import from the compiled `build/` directory
2. **Use a transpiler** - Use Babel or TypeScript to compile your JavaScript

## Performance Benefits

The TC39 Stage 3 decorator implementation provides:

1. **Better Performance** - Metadata is stored more efficiently using `context.addInitializer()`
2. **Type Safety** - Better TypeScript integration and type checking
3. **Standards Compliance** - Aligns with the JavaScript standard
4. **Future-Proof** - Will work with native JavaScript decorators when they land in browsers

## Migration from Legacy Implementation

If you were using the legacy decorator implementation, here's how to migrate:

### Before (Legacy Decorators)

```typescript
// tsconfig.json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": false,
  "useDefineForClassFields": false
}

// Usage
class User {
  @Expose()
  id: number;
}
```

### After (TC39 Stage 3 Decorators)

```typescript
// tsconfig.json
{
  "experimentalDecorators": false,
  "emitDecoratorMetadata": false,
  "useDefineForClassFields": true
}

// Usage - Same!
class User {
  @Expose()
  id: number;
}
```

The usage is identical! Only the internal implementation and TypeScript configuration changed.

## Testing

All tests pass with the TC39 Stage 3 decorator implementation:

```bash
npm test -- tests/class-transformer-compat-tc39.test.ts
```

Results:
- ✅ 14/14 tests passing
- ✅ All decorator features working
- ✅ Full API compatibility maintained

## Benchmarking

To benchmark the TC39 Stage 3 decorator implementation, use TypeScript test files instead of plain JavaScript:

```bash
npm test -- bench/class-transformer-comparison.bench.ts
```

Note: The JavaScript benchmark runner (`bench/class-transformer-comparison-runner.js`) is not compatible with TC39 Stage 3 decorators because it tries to apply decorators dynamically to prototypes.

## Troubleshooting

### Error: "Cannot apply decorator to prototype"

**Problem:** Trying to apply decorators dynamically in JavaScript

**Solution:** Use TypeScript class syntax with decorators

### Error: "useDefineForClassFields must be true"

**Problem:** Incorrect TypeScript configuration

**Solution:** Update `tsconfig.json`:
```json
{
  "useDefineForClassFields": true,
  "experimentalDecorators": false
}
```

### Error: "Decorator can only be applied to class fields"

**Problem:** Trying to use a field decorator on a method or vice versa

**Solution:** Use the correct decorator for the target:
- `@Expose()`, `@Exclude()`, `@Type()`, `@Transform()` - for fields
- `@TransformClassToPlain()`, etc. - for methods

## Resources

- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [TypeScript 5.0 Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)

## Support

For issues or questions:
- GitHub Issues: https://github.com/Isqanderm/data-mapper/issues
- Documentation: See `docs/CLASS_TRANSFORMER_COMPATIBILITY.md`

