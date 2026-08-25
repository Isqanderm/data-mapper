# om-data-mapper Documentation

Welcome to the `om-data-mapper` documentation! This directory contains comprehensive guides for both users and contributors.

---

## 📚 Documentation Index

### User Guides

#### Validation Module

- **[Validation Usage Guide](./validation-usage.md)** - Complete guide on how to use the validation module
  - Available validators and decorators
  - Validation functions (validate, validateSync, etc.)
  - Custom validators
  - Nested validation
  - Validation groups
  - Best practices and examples

#### Transformer Module

- **[Transformer Usage Guide](./transformer-usage.md)** - Complete guide on how to use the transformer module
  - Decorator API (recommended for new projects)
  - class-transformer Compatibility API (for migration)
  - Transformation decorators (@Map, @MapFrom, @Transform, etc.)
  - Transformation functions (plainToInstance, plainToClass, etc.)
  - Nested transformations
  - Common patterns and examples
  - Migration guide from class-transformer

#### Troubleshooting

- [Troubleshooting](./troubleshooting.md) — common issues and solutions

### Internal Architecture

#### Validation JIT Compilation

- **[Validation JIT Internals](./validation-jit-internals.md)** - Deep dive into validation JIT compilation
  - Architecture components
  - Metadata storage system
  - Code generation strategy
  - Optimization techniques
  - Performance characteristics
  - Custom validator integration
  - Debugging and profiling

#### Transformer JIT Compilation

- **[Transformer JIT Internals](./transformer-jit-internals.md)** - Deep dive into transformer JIT compilation
  - Architecture components
  - Metadata storage (Symbol-based vs WeakMap-based)
  - Code generation strategy
  - Safe property access generation
  - Error handling strategies
  - Optimization techniques
  - Performance characteristics
  - Comparison with BaseMapper

---

## 🚀 Quick Start

### For Users

If you're new to `om-data-mapper`, start here:

1. **Validation**: Read [Validation Usage Guide](./validation-usage.md)
2. **Transformation**: Read [Transformer Usage Guide](./transformer-usage.md)

### For Contributors

If you want to understand the internals or contribute:

1. **Validation Internals**: Read [Validation JIT Internals](./validation-jit-internals.md)
2. **Transformer Internals**: Read [Transformer JIT Internals](./transformer-jit-internals.md)

---

## 📖 What's in Each Guide?

### Validation Usage Guide

- ✅ Installation and setup
- ✅ All available validators with examples
- ✅ Validation functions (async and sync)
- ✅ Custom validators
- ✅ Nested validation
- ✅ Validation groups and conditional validation
- ✅ Error messages customization
- ✅ Best practices
- ✅ Migration from class-validator

### Transformer Usage Guide

- ✅ Two APIs: Decorator API and Compatibility API
- ✅ All transformation decorators with examples
- ✅ Transformation functions
- ✅ Nested transformations
- ✅ Common patterns (API responses, form data, etc.)
- ✅ Troubleshooting guide
- ✅ Performance tips
- ✅ Migration from class-transformer

### Validation JIT Internals

- ✅ Architecture overview
- ✅ Metadata storage with Symbols
- ✅ Validator registry and caching
- ✅ JIT compilation process
- ✅ Code generation for sync and async validation
- ✅ Optimization techniques (caching, inlining, etc.)
- ✅ Performance benchmarks
- ✅ Custom validator integration
- ✅ Debugging generated code

### Transformer JIT Internals

- ✅ Architecture overview
- ✅ Two metadata storage systems
- ✅ JIT compilation process
- ✅ Code generation strategies
- ✅ Safe property access with optional chaining
- ✅ Error handling (safe vs unsafe mode)
- ✅ Optimization techniques
- ✅ Performance benchmarks
- ✅ Comparison with class-transformer
- ✅ Debugging generated code

---

## 🎯 Choose Your Path

### I want to validate objects

→ Start with [Validation Usage Guide](./validation-usage.md)

### I want to transform objects

→ Start with [Transformer Usage Guide](./transformer-usage.md)

### I'm migrating from class-validator

→ Read the "Migration from class-validator" section in [Validation Usage Guide](./validation-usage.md)

### I'm migrating from class-transformer

→ Read the "Migration from class-transformer" section in [Transformer Usage Guide](./transformer-usage.md)

### I want to understand how it works internally

→ Read [Validation JIT Internals](./validation-jit-internals.md) and [Transformer JIT Internals](./transformer-jit-internals.md)

### I want to contribute

→ Read all internal architecture docs, then check the main repository README for contribution guidelines

---

## 🔥 Key Features

### Validation Module

- **10x faster** than class-validator
- **100% API compatible** - drop-in replacement
- **No dependencies** - no reflect-metadata needed
- **JIT compilation** for maximum performance
- **Custom validators** supported
- **Nested validation** with full type safety

### Transformer Module

- **10x faster** than class-transformer
- **Two powerful APIs** - Decorator API and Compatibility API
- **100% compatible** with class-transformer
- **No dependencies** - no reflect-metadata needed
- **JIT compilation** for maximum performance
- **Type-safe** with full TypeScript support

---

## 📊 Performance

Both modules use JIT compilation to achieve exceptional performance:

### Validation Performance

| Validation Type     | class-validator | om-data-mapper | Speedup |
| ------------------- | --------------- | -------------- | ------- |
| Simple (1 field)    | ~50K ops/sec    | ~500K ops/sec  | **10x** |
| Complex (10 fields) | ~10K ops/sec    | ~100K ops/sec  | **10x** |
| Nested objects      | ~5K ops/sec     | ~50K ops/sec   | **10x** |

### Transformation Performance

| Transformation Type     | class-transformer | om-data-mapper | Speedup |
| ----------------------- | ----------------- | -------------- | ------- |
| Simple mapping          | 326K ops/sec      | 3.2M ops/sec   | **10x** |
| Complex transformations | 150K ops/sec      | 1.5M ops/sec   | **10x** |
| Nested objects          | 80K ops/sec       | 800K ops/sec   | **10x** |

---

## 💡 Best Practices

### General

1. **Use TypeScript** - Full type safety and better developer experience
2. **Reuse instances** - Mappers and validators are compiled once
3. **Enable strict mode** - Catch errors early
4. **Read the guides** - Comprehensive examples for common scenarios

### Validation

1. **Use validateSync** when you don't need async validators
2. **Leverage validation groups** for different scenarios
3. **Create custom validators** for complex business logic
4. **Use @IsOptional()** for optional fields

### Transformation

1. **Choose the right API** - Decorator API for new projects, Compatibility API for migration
2. **Reuse mapper instances** - Use createMapper() or getMapper()
3. **Use @MapNested()** for nested objects
4. **Enable unsafe mode** for maximum performance when data is trusted

---

## 🤝 Contributing

We welcome contributions! If you find issues or want to improve the documentation:

1. Read the internal architecture docs to understand the system
2. Check the main repository for contribution guidelines
3. Submit issues or pull requests on GitHub

---

## 📝 License

This project is licensed under the MIT License.

---

## 🔗 Links

- **GitHub Repository**: [https://github.com/Isqanderm/data-mapper](https://github.com/Isqanderm/data-mapper)
- **NPM Package**: [https://www.npmjs.com/package/om-data-mapper](https://www.npmjs.com/package/om-data-mapper)

---

## 📧 Support

If you have questions or need help:

1. Check the documentation guides
2. Search existing GitHub issues
3. Create a new issue with a detailed description

---

**Happy coding! 🚀**
