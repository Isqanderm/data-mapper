# Troubleshooting

Common issues and solutions when working with `om-data-mapper`.

## Quick Navigation

- [TypeScript Decorator Errors](#typescript-decorator-errors)
- [Performance Not as Expected](#performance-not-as-expected)
- [Migration from class-transformer Issues](#migration-from-class-transformer-issues)
- [Nested Object Mapping Not Working](#nested-object-mapping-not-working)
- [Type Inference Issues](#type-inference-issues)
- [Transformation Errors Not Visible](#transformation-errors-not-visible)
- [Default Values Not Applied](#default-values-not-applied)
- [Bundle Size Concerns](#bundle-size-concerns)
- [Runtime Errors in Production](#runtime-errors-in-production)
- [Getting Help](#getting-help)

---

## TypeScript Decorator Errors

**Problem:** You see errors like `Experimental support for decorators is a feature that is subject to change`, or decorators don't work as expected.

**Root Cause:** `om-data-mapper` uses **TC39 Stage 3 decorators** (the modern JavaScript standard), not the legacy experimental decorators. Setting `experimentalDecorators: true` enables the old decorator syntax, which is incompatible.

**Solution:** Update your `tsconfig.json` to use TC39 decorators. This is also the configuration used by this repo itself (see the root `tsconfig.json`):

**Incorrect:**

```json
{
  "compilerOptions": {
    "experimentalDecorators": true, // Wrong! This enables legacy decorators
    "emitDecoratorMetadata": true // Not needed for om-data-mapper
  }
}
```

**Correct:**

```json
{
  "compilerOptions": {
    "target": "ES2022", // Required for TC39 decorators
    "experimentalDecorators": false, // Must be false (or omit entirely)
    "useDefineForClassFields": true // Required for modern decorators
  }
}
```

> Do not set `experimentalDecorators: true`. `emitDecoratorMetadata` is not required — `om-data-mapper` does not use `reflect-metadata`.

### Environment-Specific Configurations

<details>
<summary><strong>Node.js (ts-node / Jest / SWC)</strong></summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

`module: "NodeNext"` is recommended for Node.js projects — it gives better ESM/CJS interop.

</details>

<details>
<summary><strong>Next.js / Vite</strong></summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

</details>

---

## Performance Not as Expected

**Problem:** Transformations feel slower than expected.

**Solution 1:** Reuse mapper instances instead of creating a new one per transformation. `getMapper`/`createMapper` cache the JIT-compiled mapper so the compilation cost is paid once, not on every call.

**Inefficient (re-invokes the mapper class each call):**

```ts
function transformUsers(users: UserSource[]) {
  return users.map((user) => plainToInstance(UserMapper, user));
}
```

**Better (reuses one compiled mapper instance):**

```ts
import { getMapper } from 'om-data-mapper';

const userMapper = getMapper<UserSource, UserDTO>(UserMapper);

function transformUsers(users: UserSource[]) {
  return users.map((user) => userMapper.transform(user));
}
```

**Solution 2:** Use `plainToInstanceArray` for batch transformations instead of mapping `plainToInstance` over an array — it avoids re-instantiating the mapper class for every item:

```ts
import { plainToInstanceArray } from 'om-data-mapper';

const results = plainToInstanceArray(MyMapper, sources);
```

**Solution 3:** Enable unsafe mode only for trusted data. `@Mapper({ unsafe: true })` skips the per-field try/catch error handling, which reduces overhead but means malformed input can throw instead of being reported as a transformation error.

> **Warning:** Use `@Mapper({ unsafe: true })` **only with trusted data** (e.g. internal service boundaries). For untrusted or external data, use the `try*` API (`tryPlainToInstance`, or a mapper's `.tryTransform()`) so errors are reported instead of thrown.

```ts
@Mapper<Source, Target>({ unsafe: true })
class FastMapper {
  @Map('name')
  name!: string;
}

// Safe for trusted internal data
const internalMapper = getMapper<InternalSource, InternalDTO>(FastMapper);
const result = internalMapper.transform(trustedInternalData);

// For untrusted external data, prefer a mapper WITHOUT unsafe mode and the try* API:
const { result, errors } = tryPlainToInstance(SafeMapper, untrustedExternalData);
```

If you want to see how these choices actually affect your workload, run `pnpm bench` locally — see [`../benchmarks/README.md`](../benchmarks/README.md).

---

## Migration from class-transformer Issues

**Problem:** Code that worked with `class-transformer` doesn't behave the same after switching.

**Solution 1:** Use the compatibility layer — it's a drop-in replacement for the supported subset of the class-transformer API (only the import path changes for covered decorators/functions); see the [compat table](./compat-class-transformer.md) for what's covered:

```ts
// Before:
import { plainToClass, Expose, Type } from 'class-transformer';

// After:
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
// or, from the standalone package:
// import { plainToClass, Expose, Type } from '@om-data-mapper/class-transformer';
```

**Solution 2:** Remove the `reflect-metadata` import — it isn't needed:

**Not needed with om-data-mapper:**

```ts
import 'reflect-metadata'; // Remove this line
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

**Correct:**

```ts
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

For detailed migration patterns and a decorator-by-decorator compatibility table, see the [Migration Guide](./migration-class-transformer.md) and the [class-transformer compatibility reference](./compat-class-transformer.md).

---

## Nested Object Mapping Not Working

**Problem:** Nested objects aren't being transformed — they pass through unchanged.

**Solution:** Use the `@MapWith` decorator to point a property at a nested mapper.

**Incorrect (nested object is copied as-is, not transformed):**

```ts
type UserSource = { name: string; address: { street: string; city: string } };
type UserDTO = { name: string; address: AddressDTO };
type AddressDTO = { street: string; city: string };

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @Map('address') // This alone does not run the nested object through a mapper
  address!: AddressDTO;
}
```

**Correct (nested object is transformed by its own mapper):**

```ts
type AddressSource = { street: string; city: string };
type AddressDTO = { street: string; city: string };
type UserSource = { name: string; address: AddressSource };
type UserDTO = { name: string; address: AddressDTO };

// Define the nested mapper first
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

// Reference it with @MapWith on the parent mapper
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;
}

const source: UserSource = {
  name: 'John',
  address: { street: '123 Main St', city: 'NYC' },
};
const result = plainToInstance(UserMapper, source);
// result: { name: 'John', address: { street: '123 Main St', city: 'NYC' } }
```

`@MapWith` also works with `@MapFrom` in place of `@Map`, when the nested source value needs a custom lookup.

---

## Type Inference Issues

**Problem:** TypeScript infers `any` for a transformation result, or shows type errors.

**Solution:** Explicitly specify type parameters or use type annotations.

**Type inference may fail (result type is `any`):**

```ts
const result = plainToInstance(UserMapper, source);
// result: any
```

**Option 1: Explicit generic parameters:**

```ts
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
// result: UserDTO
```

**Option 2: Type annotation on the result:**

```ts
const result: UserDTO = plainToInstance(UserMapper, source);
```

**Option 3: Use `createMapper` for a typed, reusable mapper instance:**

```ts
const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result = mapper.transform(source);
// result: UserDTO, with autocomplete on mapper.transform
```

**Option 4: Type annotation on a wrapping function's return type:**

```ts
function transformUser(source: UserSource): UserDTO {
  return plainToInstance(UserMapper, source);
}
```

---

## Transformation Errors Not Visible

**Problem:** A transformation fails silently — no exception, no indication that something went wrong.

**Solution:** Use `tryPlainToInstance` or a mapper's `.tryTransform()` method to get errors back instead of having them swallowed.

**Errors are hidden:**

```ts
const result = plainToInstance(UserMapper, source);
// If a field transform throws internally, you may not see why.
```

**Option 1: `tryPlainToInstance` (one-off transformations):**

```ts
import { tryPlainToInstance } from 'om-data-mapper';

const { result, errors } = tryPlainToInstance(UserMapper, source);

if (errors.length > 0) {
  console.error('Transformation errors:', errors);
} else {
  console.log('Success:', result);
}
```

**Option 2: `.tryTransform()` on a reused mapper instance:**

```ts
import { getMapper } from 'om-data-mapper';

const mapper = getMapper<UserSource, UserDTO>(UserMapper);
const { result, errors } = mapper.tryTransform(source);

if (errors.length > 0) {
  console.error('Transformation errors:', errors);
  // result may be partial if some fields failed
} else {
  console.log('Success:', result);
}
```

**Option 3: Use it directly in an API handler:**

```ts
app.post('/api/users', (req, res) => {
  const { result, errors } = tryPlainToInstance(UserMapper, req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  res.json(result);
});
```

---

## Default Values Not Applied

**Problem:** A `@Default` value doesn't seem to apply.

**What `@Default` does:** It supplies a fallback value for a field whenever the mapped source value is `undefined` or `null`, regardless of whether the field is populated via `@Map`, `@MapFrom`, or `@MapWith`.

```ts
type UserSource = { name?: string; role?: string; status?: string };
type UserDTO = { name: string; role: string; status: string };

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Default('Anonymous')
  @Map('name')
  name!: string;

  @Default('user')
  @Map('role')
  role!: string;

  @Default('active')
  @Map('status')
  status!: string;
}

const result = plainToInstance(UserMapper, {});
// result: { name: 'Anonymous', role: 'user', status: 'active' }
```

**When to use `@Default`:**

- Handling optional API fields with a fallback value
- Providing sensible defaults for missing configuration
- Ensuring non-null values on your DTOs even when the source is sparse

**If the default still doesn't show up**, check the value that's actually reaching the field: `@Default` only kicks in when the mapped value is `undefined` or `null` — a mapped empty string, `0`, or `false` will not trigger it. If a `@Transform` on the same field always returns a non-nullish value, the default will never be used.

---

## Bundle Size Concerns

**Problem:** Bundle size is larger than expected after adding `om-data-mapper`.

**Good news:** the package is designed for tree-shaking:

- Marked as `"sideEffects": false` in `package.json`
- Ships ESM builds for modern bundlers
- No runtime dependencies

**Solution 1:** Import only what you use — tree-shaking handles the rest:

```ts
import { Mapper, Map, plainToInstance } from 'om-data-mapper';
```

**Solution 2:** Verify your bundler is configured for tree-shaking.

<details>
<summary><strong>Vite (default configuration works)</strong></summary>

Vite tree-shakes by default; no special configuration is required.

</details>

<details>
<summary><strong>Webpack 5+ (production mode)</strong></summary>

```js
// webpack.config.js
module.exports = {
  mode: 'production', // Enables tree-shaking automatically
  optimization: {
    usedExports: true,
    sideEffects: true, // Respect package.json "sideEffects" field
  },
};
```

You typically don't need to set `sideEffects: false` yourself — the package's `package.json` already declares it.

</details>

<details>
<summary><strong>Rollup</strong></summary>

```js
// rollup.config.js
export default {
  treeshake: true, // Enabled by default in Rollup
};
```

</details>

**Solution 3:** Use a bundle analyzer to confirm where the size is actually coming from:

```bash
# Webpack
npm install --save-dev webpack-bundle-analyzer

# Vite / Rollup
npm install --save-dev rollup-plugin-visualizer
```

---

## Runtime Errors in Production

**Problem:** Code works in development but fails in a production build.

**Solution 1:** Make sure your build target doesn't downlevel past the point where TC39 decorators are supported:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022", // Don't downlevel to ES5 — decorators require ES2022+
    "module": "ESNext" // Or "NodeNext" for Node.js projects
  }
}
```

**Solution 2 (situational):** `om-data-mapper` does not rely on class or function names at runtime for its own behavior — JIT-compiled mappers work the same regardless of minification/name-mangling. If you separately rely on class names for logging, error messages, or a debugging tool, configure your minifier to preserve them:

```js
// webpack.config.js — only if you need readable class names in errors/debugging
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: /Mapper$/, // Preserve only *Mapper classes
          keep_fnames: false,
        },
      }),
    ],
  },
};
```

**Solution 3:** Verify the production build actually runs:

```bash
npm run build
NODE_ENV=production node dist/index.js
```

---

## Getting Help

If you're still stuck:

1. **Check the documentation:**
   - [API Reference (TypeDoc)](https://isqanderm.github.io/data-mapper/) — generated API documentation
   - [Transformer Usage Guide](./transformer-usage.md)
   - [Validation Usage Guide](./validation-usage.md)
   - [Migration Guide](./migration-class-transformer.md)
   - [docs/README.md](./README.md) — full documentation index

2. **Search existing issues:** [GitHub Issues](https://github.com/Isqanderm/data-mapper/issues)

3. **Report a bug:** [open a new issue](https://github.com/Isqanderm/data-mapper/issues/new)

When reporting an issue, please include:

- Your TypeScript version (`tsc --version`)
- Your `tsconfig.json` configuration
- A minimal reproducible example
- Expected vs. actual behavior
- Any error messages
