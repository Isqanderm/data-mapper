# Class-Transformer Compatibility Benchmarks

## Status: ⚠️ Currently Not Working

The `class-transformer-comparison.js` benchmark is currently not functional due to decorator incompatibility.

### Problem

The benchmark uses **legacy decorators** (experimentalDecorators), but om-data-mapper uses **TC39 Stage 3 decorators**. These are incompatible.

**Error:**
```
Error: @Type can only be applied to class fields
```

### Why This Happens

The benchmark applies decorators manually using the legacy syntax:
```javascript
OmType(() => OmAddress)(OmCompany.prototype, 'address');
```

This syntax is for legacy decorators and doesn't work with TC39 Stage 3 decorators.

### Solutions

#### Option 1: Rewrite Benchmark for TC39 Decorators (Recommended)

Rewrite the benchmark to use proper TC39 Stage 3 decorator syntax:

```javascript
class OmCompany {
  @OmExpose()
  name;

  @OmExpose()
  @OmType(() => OmAddress)
  address;
}
```

**Problem:** This requires the benchmark to be a TypeScript file with proper decorator support.

#### Option 2: Use Decorator API Instead

Instead of testing class-transformer compatibility, test the native Decorator API:

```javascript
const { Mapper, Map, MapFrom, plainToInstance } = require('../../../build/decorators/index.js');

@Mapper()
class UserMapper {
  @Map('name')
  fullName;
}

const result = plainToInstance(UserMapper, source);
```

#### Option 3: Remove This Benchmark

Since the Decorator API benchmarks in `benchmarks/suites/core/` already test performance, this compatibility benchmark may not be necessary.

### Current Workaround

Use the core benchmarks instead:

```bash
# Run all core benchmarks
npm run bench:core

# Or run all benchmarks (which includes core)
npm run bench
```

### TODO

- [ ] Decide whether to keep class-transformer compatibility benchmarks
- [ ] If keeping: Rewrite using TC39 Stage 3 decorators
- [ ] If removing: Delete this directory and update package.json scripts
- [ ] Update documentation to reflect the decision

### Related Files

- `benchmarks/suites/core/` - Working benchmarks for core functionality
- `src/compat/class-transformer/` - Compatibility layer implementation
- `tests/unit/compat/` - Tests for compatibility layer (these work fine)

