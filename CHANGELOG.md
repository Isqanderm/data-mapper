# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2025-10-14

### BREAKING CHANGES

This is a **major release** introducing a modern Decorator API with JIT compilation. While the BaseMapper API remains fully supported for backward compatibility, the new Decorator API is now the recommended approach.

**Migration:** No breaking changes for existing BaseMapper users. The new Decorator API is opt-in. See [Migration Guide](docs/MIGRATION_GUIDE.md) for details.

### Added

- **Performance Benchmarks vs class-transformer** - Comprehensive comparison showing om-data-mapper is **17.28x faster** on average
  - Simple transformation: **12.3x faster** (326K vs 4.3M ops/sec)
  - Complex nested objects: **42.7x faster** (154K vs 6.7M ops/sec)
  - Array transformation: **12.3x faster** (5.2K vs 69K ops/sec)
  - Custom logic: **13.4x faster** (333K vs 4.8M ops/sec)
  - Exclude/Expose: **5.8x faster** (263K vs 1.8M ops/sec)
  - New benchmark suite in `benchmarks/suites/compat/`
  - Automated benchmark command: `npm run bench:compat`
  - Comprehensive comparison document: [docs/COMPARISON.md](docs/COMPARISON.md)
  - Updated README with performance comparison tables

- **Ergonomic API** - New recommended way to use mappers with full TypeScript type safety
  - `plainToInstance<Source, Target>(MapperClass, source)` - Transform plain object (recommended)
  - `plainToInstanceArray<Source, Target>(MapperClass, sources)` - Transform array of objects
  - `tryPlainToInstance<Source, Target>(MapperClass, source)` - Transform with error handling
  - `tryPlainToInstanceArray<Source, Target>(MapperClass, sources)` - Transform array with error handling
  - `createMapper<Source, Target>(MapperClass)` - Create reusable mapper instance
  - `getMapper<Source, Target>(MapperClass)` - Alias for createMapper
  - Inspired by class-transformer's API design
  - Clean, ergonomic API without type assertions
  - Full TypeScript type safety out of the box
  - See [Ergonomic API Guide](docs/ERGONOMIC_API.md) for details
  - Example:
    ```typescript
    import { Mapper, Map, plainToInstance } from 'om-data-mapper';

    @Mapper<UserSource, UserDTO>()
    class UserMapper {
      @Map('name')
      fullName!: string;
    }

    // ✅ Clean and type-safe!
    const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
    ```

- **Decorator API** - Enhanced `@MapWith` decorator for nested mapper composition
  - Fully restored nested mapper composition from legacy BaseMapper API
  - Works seamlessly with `@Map`, `@MapFrom`, `@Transform`, and `@Default` decorators
  - Supports both safe and unsafe modes with proper error handling
  - Handles undefined/null nested sources gracefully
  - Applies `@Transform` to nested mapper results (including undefined values)
  - Added 13 comprehensive tests covering all use cases
  - Example:
    ```typescript
    @Mapper()
    class AddressMapper {
      @MapFrom((src) => `${src.street}, ${src.city}`)
      fullAddress!: string;
    }

    @Mapper()
    class UserMapper {
      @MapWith(AddressMapper)
      @Map('address')
      location!: AddressTarget;
    }
    ```

### Fixed

- **Decorator API** - Fixed nested path access in generated mapper code
  - Now properly guards all segments of nested paths with optional chaining
  - Prevents runtime errors when intermediate properties are missing
  - Example: `@Map('user.profile.email')` now generates `source?.user?.profile?.email`
  - Added comprehensive tests for missing nested properties with and without defaults

### Changed

- **Project Structure** - Reorganized benchmark files for better code organization
  - Moved `src/benchmarks/` to `benchmarks/src/` to keep source code clean
  - Updated benchmark compilation configuration to use TC39 decorators
  - Cleaned up build artifacts and outdated compiled files

- **Test Coverage** - Significantly improved test coverage from ~63% to 83.4%
  - Added comprehensive tests for BaseMapper (legacy API)
  - Added extensive tests for class-transformer compatibility layer
  - Added advanced decorator combination tests
  - Added edge case tests for error handling and complex transformations
  - Added 13 tests for `@MapWith` nested mapper composition
  - Total test count increased from 44 to 138 tests

### Added

#### 🚀 Decorator API with JIT Compilation (MAJOR FEATURE)

- **Modern Decorator API** using TC39 Stage 3 decorators
  - `@Mapper()` - Class decorator to mark mapper classes
  - `@Map(path)` - Map from source path
  - `@MapFrom(fn)` - Map using transformer function
  - `@Transform(fn)` - Transform mapped value
  - `@Default(value)` - Provide default values
  - `@When(condition)` - Conditional mapping
  - `@MapWith(MapperClass)` - Nested mappers
  - `@Ignore()` - Exclude fields from mapping

- **JIT (Just-In-Time) Compilation**
  - Generates optimized JavaScript code via `new Function()`
  - Eliminates wrapper function overhead
  - **Performance: 112-474% faster than BaseMapper**
    - Simple mappings: +374% (4.7x faster!)
    - Complex transformations: +16%
    - Nested objects: +96% (nearly 2x faster!)
    - Array operations: +12%
    - Conditional mappings: +25-28%

- **Comprehensive Documentation**
  - `docs/DECORATOR_API.md` - Complete Decorator API reference
  - `docs/BASE_MAPPER_API.md` - BaseMapper (legacy) API reference
  - `docs/MIGRATION_GUIDE.md` - Step-by-step migration guide
  - Performance benchmarks and analysis

- **class-transformer Compatibility Layer**
  - Drop-in replacement for class-transformer decorators
  - `@Type()`, `@Expose()`, `@Exclude()`, `@Transform()`
  - `plainToClass()`, `classToPlain()`, `plainToInstance()`
  - See `docs/CLASS_TRANSFORMER_COMPATIBILITY.md`

### Changed

- **README.md** - Promoted Decorator API as primary/recommended approach
- **BaseMapper** - Marked as `@deprecated` and `@internal` for new projects
  - Still fully supported for backward compatibility
  - Recommended for dynamic mapping scenarios only
- **Smoke tests** - Updated to use Decorator API
- **Performance benchmarks** - Updated with Decorator API results

### Deprecated

- **BaseMapper (`Mapper.create()`)** - Legacy functional API
  - Still fully supported and maintained
  - Recommended to migrate to Decorator API for better performance
  - See `docs/MIGRATION_GUIDE.md` for migration instructions

### Removed

- Obsolete benchmark reports (superseded by `FINAL_PERFORMANCE_REPORT.md`)
- Temporary setup/audit files from `reports/` directory
- BaseMapper public API tests (internal API tests retained)

### Performance

- **Decorator API**: 112-474% faster than BaseMapper
- **JIT Compilation**: Generates optimized code automatically
- **Zero overhead**: Direct code execution, no wrapper functions
- **Production-ready**: Millions of operations per second

### Migration

For existing users:
1. Both APIs work side-by-side (no breaking changes)
2. Gradual migration supported
3. See `docs/MIGRATION_GUIDE.md` for detailed instructions
4. Performance improvements are automatic after migration

### Documentation

- Repository audit and inventory reports
- Code quality tooling setup (Prettier, ESLint, EditorConfig)
- Testing framework with coverage (Vitest)
- Renamed `LICENCE` to `LICENSE` for consistency
- Renamed `Readme.md` to `README.md` for standard naming
- Added badges section to README

## [2.0.5] - 2024-XX-XX

### Note

This changelog was introduced after version 2.0.5. Previous version history can be found in git commit messages.

[Unreleased]: https://github.com/Isqanderm/data-mapper/compare/v2.0.5...HEAD
[2.0.5]: https://github.com/Isqanderm/data-mapper/releases/tag/v2.0.5
