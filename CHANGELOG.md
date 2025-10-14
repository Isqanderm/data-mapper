# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Project Structure** - Reorganized benchmark files for better code organization
  - Moved `src/benchmarks/` to `benchmarks/src/` to keep source code clean
  - Updated benchmark compilation configuration to use TC39 decorators
  - Cleaned up build artifacts and outdated compiled files

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
