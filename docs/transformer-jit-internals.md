# Transformer JIT Compilation - Internal Architecture

## Overview

The transformer module in `om-data-mapper` uses **Just-In-Time (JIT) compilation** to achieve high-performance object transformations. The system generates optimized JavaScript code using `new Function()` that executes transformation logic directly, eliminating the overhead of runtime interpretation.

This document explains the internal implementation details of the JIT compilation system for the Transformer module.

---

## Architecture Components

### 1. Metadata Storage

Both the native decorator API and the class-transformer compatibility API store their metadata
the same way — in a module-level `WeakMap<Function, ...>` keyed by the class constructor. What
differs between them is the shape of the metadata each one stores, not the storage mechanism.

#### Decorator API (`packages/core/src/decorators/metadata.ts`)

Uses a **`WeakMap`-based metadata store** for the native decorator API:

```typescript
const metadataStore = new WeakMap<Function, MapperMetadata>();

interface MapperMetadata {
  properties: Map<string | symbol, PropertyMapping>;
  options?: MapperOptions;
}

interface PropertyMapping {
  type: 'path' | 'transform' | 'nested' | 'ignore';
  sourcePath?: string;
  transformer?: Function;
  transformValue?: Function;
  nestedMapper?: any;
  defaultValue?: any;
  condition?: Function;
}
```

#### class-transformer Compatibility API (`packages/class-transformer/src/metadata.ts`)

Also uses a **`WeakMap`-based metadata store**, keyed by the class constructor, for
class-transformer compatibility:

```typescript
const metadataStorage = new WeakMap<Function, ClassMetadata>();

interface ClassMetadata {
  properties: Map<string | symbol, PropertyMetadata>;
  classOptions?: {
    expose?: boolean;
    exclude?: boolean;
  };
}

interface PropertyMetadata {
  expose?: boolean;
  exclude?: boolean;
  exposeOptions?: ExposeOptions;
  excludeOptions?: ExcludeOptions;
  typeFunction?: TypeHelpFunction;
  transformFn?: TransformFn;
  name?: string; // Property name mapping
}
```

**Key Differences:**

- **Storage mechanism**: Identical — both use a `WeakMap<Function, ...>` keyed by the class
  constructor, so metadata is garbage-collected along with the class and there is no manual
  cleanup needed.
- **Metadata shape**: Different — the Decorator API stores a flat `properties` map of
  `PropertyMapping` entries plus mapper-level `options`; the compatibility API stores
  `PropertyMetadata` entries (expose/exclude/type/transform info) plus `classOptions`.
- **Both**: Use TC39 Stage 3 decorators

---

### 2. JIT Compilation Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Decorator Application (Class Definition Time)           │
│    - @Map(), @MapFrom(), @Transform(), etc.                │
│    - Metadata stored on class constructor                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Class Instantiation                                      │
│    - new UserMapper() or plainToInstance(UserMapper, data) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Compilation Trigger (context.addInitializer)            │
│    - Runs once during first instantiation                  │
│    - Calls _compileMapper()                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Metadata Retrieval                                       │
│    - getMapperMetadata(this.constructor)                    │
│    - Returns MapperMetadata with all property mappings     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Code Generation                                          │
│    - For each property: _generatePropertyCode()             │
│    - Produces JavaScript code strings                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Function Compilation                                     │
│    - new Function('source', 'target', '__errors', code)     │
│    - Creates executable transformation function             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Mapper Creation                                          │
│    - Wraps compiled function in BaseMapper-compatible API   │
│    - Stores in compiledMapper variable                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Execution                                                │
│    - mapper.transform(source) calls compiled function       │
│    - Returns transformed object                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Generation Strategy

### 1. Path Mapping (`@Map('sourcePath')`)

Generates safe property access with optional chaining:

```typescript
// Decorator: @Map('user.profile.email')
// Generated code:
target['email'] = source?.['user']?.['profile']?.['email'];

// With default value: @Map('score') @Default(0)
target['score'] = source?.['score'] ?? cache['__defValues']['score'];

// With value transform: @Map('name') @Transform(v => v.toUpperCase())
target['name'] = cache['name__valueTransform'](source?.['name']);
```

**Optimization**: Uses optional chaining (`?.`) instead of try-catch for null safety.

### 2. Transform Function (`@MapFrom(fn)`)

Stores transformer in cache and calls it:

```typescript
// Decorator: @MapFrom((src) => src.firstName + ' ' + src.lastName)
// Generated code:
target['fullName'] = cache['fullName__transformer'](source);

// With default: @MapFrom(fn) @Default('Unknown')
target['fullName'] = cache['fullName__transformer'](source) ?? cache['__defValues']['fullName'];

// Conditional codegen exists internally (`PropertyMapping.condition`) but no
// public decorator sets it today — @MapFrom's function receives the full
// source object, so conditional mapping is expressed there instead:
// @MapFrom((src) => (src.isPremium ? src.premiumName : undefined))
```

**Optimization**: Functions stored in cache to avoid closure overhead.

### 3. Nested Mapper (`@MapWith(NestedMapper)`)

Calls the nested mapper's own compiled `transform()`:

```typescript
// Decorators: @MapWith(AddressMapper) @Map('address')
// Generated code:
const __nestedSource = source?.['address'];
target['address'] =
  __nestedSource !== undefined && __nestedSource !== null
    ? cache['address__nestedMapper'].transform(__nestedSource)
    : undefined;
```

**Optimization**: Nested mappers are pre-compiled and cached.

### 4. Array Mapping

Handles array transformations:

```typescript
// Decorator: @MapFrom((src) => src.items.map(i => i.name))
// Generated code:
target['itemNames'] = cache['itemNames__transformer'](source);
```

There is no separate array-of-nested-mappers codegen path — arrays of nested
objects are handled the same way, by calling the nested mapper's `transform()`
from inside a `@MapFrom` function:

```typescript
@MapFrom((src: Source) => src.items.map((item) => new ItemMapper().transform(item)))
items!: ItemTarget[];
```

---

## Safe Property Access Generation

The `generateSafePropertyAccess()` function converts dot-notation paths to optional chaining:

```typescript
function generateSafePropertyAccess(sourcePath: string): string {
  return sourcePath
    .split('.')
    .map((part) => `?.[${JSON.stringify(part)}]`)
    .join('');
}

// The returned string includes the leading accessor - callers emit
// `source${generateSafePropertyAccess(path)}`. Every key is JSON-escaped
// bracket access, so kebab-case, quotes, and unicode keys are data, never code.

// Examples:
// 'name' → '?.["name"]'
// 'user.name' → '?.["user"]?.["name"]'
// 'user.profile.email' → '?.["user"]?.["profile"]?.["email"]'
```

**Why Optional Chaining?**

- ✅ Faster than try-catch
- ✅ More readable generated code
- ✅ Native JavaScript feature (ES2020+)
- ✅ No runtime overhead

---

## Error Handling Strategies

### Unsafe Mode (Default)

No error handling - maximum performance:

```typescript
// Generated code (unsafe mode):
target['name'] = source?.['firstName'];
target['email'] = source?.['user']?.['email'];
```

**Use when**: Data is trusted and performance is critical.

### Safe Mode

Wraps each property in try-catch:

```typescript
// Generated code (safe mode):
try {
  target['name'] = source?.['firstName'];
} catch (error) {
  __errors.push("Mapping error at field 'name': " + error.message);
}

try {
  target['email'] = source?.['user']?.['email'];
} catch (error) {
  __errors.push("Mapping error at field 'email': " + error.message);
}
```

**Use when**: Data is untrusted or debugging is needed.

---

## Optimization Techniques

### 1. **Pre-Compilation**

Mappers are compiled once at class instantiation:

```typescript
// Compilation happens here (once)
const mapper = new UserMapper();

// Execution is fast (uses pre-compiled function)
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
const result3 = mapper.transform(source3);
```

### 2. **Function Caching**

Transformer functions are stored in a cache object:

```typescript
const cache = {
  fullName__transformer: (src) => src.firstName + ' ' + src.lastName,
  age__condition: (src) => src.age !== undefined,
  __defValues: { score: 0, status: 'active' },
};
```

**Benefits:**

- Avoids closure overhead
- Enables function reuse
- Simplifies generated code

### 3. **Inline Code Generation**

Simple operations are inlined instead of function calls:

```typescript
// ❌ Slow: Function call
target.name = transformName(source.firstName);

// ✅ Fast: Inlined
target['name'] = source?.['firstName'];
```

### 4. **Conditional Compilation**

Only generates code for properties that exist:

```typescript
// If no @Ignore() decorator, generates code
// If @Ignore() decorator, skips code generation
if (mapping.type === 'ignore') {
  continue; // Skip this property
}
```

### 5. **Optional Chaining**

Uses native optional chaining instead of manual null checks:

```typescript
// ❌ Slow: Manual checks
if (source && source.user && source.user.profile) {
  target.email = source.user.profile.email;
}

// ✅ Fast: Optional chaining
target['email'] = source?.['user']?.['profile']?.['email'];
```

---

## class-transformer Compatibility Layer

The compatibility layer provides a different transformation approach:

### Transformation Flow:

```
plainToClass(UserDto, plainObject)
         ↓
transformPlainToClass(UserDto, plainObject, 'plainToClass', options)
         ↓
1. Create instance: new UserDto()
2. Get metadata: getCompatMetadata(UserDto)
3. For each property:
   - Check if should expose: shouldExposeProperty()
   - Get source property name: getSourcePropertyName()
   - Transform value: transformValue()
   - Apply @Transform function if exists
   - Apply @Type transformation if exists
   - Set on instance
4. Return instance
```

### Key Differences from Decorator API:

| Feature     | Decorator API                           | class-transformer Compat                           |
| ----------- | --------------------------------------- | -------------------------------------------------- |
| Compilation | JIT at instantiation                    | Interpreted at runtime (walks registered metadata) |
| Metadata    | WeakMap-based (`PropertyMapping` shape) | WeakMap-based (`PropertyMetadata` shape)           |
| API         | `@Map()`, `@MapFrom()`                  | `@Expose()`, `@Type()`                             |
| Use Case    | New projects                            | Migration from class-transformer                   |

---

## Performance Characteristics

The two APIs behave differently here:

- **Decorator/core API**: compiles a specialized transform function once per mapper class, on
  first use (`context.addInitializer` triggers `_compileMapper()`, see
  `packages/core/src/decorators/core.ts` and `packages/core/src/core/Mapper.ts`), and reuses that
  compiled function on every subsequent call — there is no per-call reflection or metadata
  re-parsing after the first instantiation.
- **class-transformer compatibility API**: registers metadata once, at class definition time
  (via the `@Expose()`/`@Exclude()`/`@Type()`/`@Transform()` decorators), but does not compile a
  function. Each call to `plainToClass`/`plainToInstance`/etc. walks that registered metadata and
  interprets it directly — there is no `new Function()` step in this code path.

For measured throughput, see [`../benchmarks/README.md`](../benchmarks/README.md), which runs
this package's actual code against real class-transformer.

---

## Generated Code Examples

### Example 1: Simple Mapping

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('firstName')
  name!: string;

  @Map('email')
  email!: string;
}

// Generated code:
function transform(source, target, __errors, cache) {
  target['name'] = source?.['firstName'];
  target['email'] = source?.['email'];
}
```

### Example 2: Complex Transformations

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapFrom((src) => src.firstName + ' ' + src.lastName)
  fullName!: string;

  @MapFrom((src) => src.age >= 18)
  isAdult!: boolean;

  @Default(0)
  @Map('score')
  score!: number;
}

// Generated code:
function transform(source, target, __errors, cache) {
  target['fullName'] = cache['fullName__transformer'](source);
  target['isAdult'] = cache['isAdult__transformer'](source);
  target['score'] = source?.['score'] ?? cache['__defValues']['score'];
}
```

### Example 3: Conditional Mapping

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapFrom((src) => (src.isPremium ? src.premiumFeatures : undefined))
  features?: string[];
}

// Generated code:
function transform(source, target, __errors, cache) {
  target['features'] = cache['features__transformer'](source);
}
```

### Example 4: Nested Mapping

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapWith(AddressMapper)
  @Map('address')
  address!: Address;
}

// Generated code:
function transform(source, target, __errors, cache) {
  const __nestedSource = source?.['address'];
  target['address'] =
    __nestedSource !== undefined && __nestedSource !== null
      ? cache['address__nestedMapper'].transform(__nestedSource)
      : undefined;
}
```

---

## Debugging Generated Code

### View Generated Code:

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('name')
  name!: string;

  // Add this method to view generated code
  _debugGeneratedCode() {
    const metadata = getMapperMetadata(this.constructor);
    const cache = {};
    const defaultValues = {};
    const codeLines = [];

    for (const [propertyKey, mapping] of metadata.properties) {
      const code = this._generatePropertyCode(
        String(propertyKey),
        mapping,
        cache,
        defaultValues,
        false,
      );
      if (code) codeLines.push(code);
    }

    console.log(codeLines.join('\n'));
  }
}

const mapper = new UserMapper();
mapper._debugGeneratedCode();
```

### Performance Profiling:

```typescript
console.time('compilation');
const mapper = new UserMapper();
console.timeEnd('compilation');

console.time('execution');
const result = mapper.transform(source);
console.timeEnd('execution');

console.time('1000 executions');
for (let i = 0; i < 1000; i++) {
  mapper.transform(source);
}
console.timeEnd('1000 executions');
```

---

## Thread Safety

- **No Global State**: Each mapper instance has isolated compiled function
- **Immutable Metadata**: Metadata is set at class definition time
- **Cache Isolation**: Each mapper has its own cache object
- **Concurrent Safe**: Multiple mappers can run concurrently

---

## Comparison with BaseMapper

The Decorator API uses the same JIT compilation approach as BaseMapper but with better ergonomics:

| Feature         | BaseMapper | Decorator API              |
| --------------- | ---------- | -------------------------- |
| API Style       | Imperative | Declarative                |
| Type Safety     | Manual     | Automatic                  |
| Code Generation | ✅ Yes     | ✅ Yes                     |
| Performance     | Fast       | **Faster** (less overhead) |
| Maintainability | Medium     | High                       |
| Recommended     | ❌ Legacy  | ✅ Modern                  |

---

## Future Optimizations

1. **Ahead-of-Time Compilation**: Pre-compile mappers at build time
2. **WebAssembly**: Compile to WASM for even faster execution
3. **SIMD**: Use SIMD instructions for array transformations
4. **Parallel Execution**: Transform arrays in parallel using Worker Threads
5. **Memoization**: Cache transformation results for identical inputs

---

## Conclusion

The Decorator/core API's JIT compilation approach provides:

- ✅ **JIT-compiled** - a specialized function is generated once per class and reused, with no per-call reflection
- ✅ **Zero runtime overhead** after compilation
- ✅ **Type-safe** with full TypeScript support
- ✅ **Memory efficient** with function caching
- ✅ **Extensible** with custom transformers

The class-transformer compatibility API does not compile a function — see
[Performance Characteristics](#performance-characteristics) above.

For measured throughput against class-transformer, see [`../benchmarks/README.md`](../benchmarks/README.md).
