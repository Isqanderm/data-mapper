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

- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

### Compatibility & Migration

- **[class-transformer Compatibility](./compat-class-transformer.md)** - API-by-API status of `@tech-pioneer/data-mapper-class-transformer` vs `class-transformer@0.5`, generated from the current source
- **[class-validator Compatibility](./compat-class-validator.md)** - API-by-API status of `@tech-pioneer/data-mapper-class-validator` vs `class-validator@0.14`, generated from the current source
- **[Migrating from class-transformer](./migration-class-transformer.md)** - Step-by-step migration patterns from `class-transformer` to `om-data-mapper`
- **[Migrating v4 → v5](./migration-v4-to-v5.md)** - Upgrading from the pre-monorepo `om-data-mapper` v4 package layout

### Internal Architecture

#### Validation JIT Compilation

- **[Validation JIT Internals](./validation-jit-internals.md)** - Deep dive into validation JIT compilation
  - Architecture components
  - Metadata storage system
  - Code generation strategy
  - Optimization techniques
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
  - Comparison with BaseMapper

### Benchmarks & Examples

- **[Benchmarks](../benchmarks/README.md)** - How to run and interpret the workspace's own throughput measurements
- **[Examples](../examples/README.md)** - Practical, runnable examples covering both modules

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
- ✅ Migration from class-transformer

### Validation JIT Internals

- ✅ Architecture overview
- ✅ Metadata storage with Symbols
- ✅ Validator registry and caching
- ✅ JIT compilation process
- ✅ Code generation for sync and async validation
- ✅ Optimization techniques (caching, inlining, etc.)
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

→ Read [Migrating from class-transformer](./migration-class-transformer.md) and the [class-transformer Compatibility](./compat-class-transformer.md) tables

### I'm upgrading from om-data-mapper v4

→ Read [Migrating v4 → v5](./migration-v4-to-v5.md)

### Something isn't working

→ Check [Troubleshooting](./troubleshooting.md)

### I want to understand how it works internally

→ Read [Validation JIT Internals](./validation-jit-internals.md) and [Transformer JIT Internals](./transformer-jit-internals.md)

### I want to contribute

→ Read all internal architecture docs, then check the main repository README for contribution guidelines

---

## 🔥 Key Features

### Validation Module

- **JIT-compiled** - each class compiles a specialized validation function once; subsequent validations reuse it, with no per-call reflection
- **Drop-in for the supported subset** - see the [compat tables](./compat-class-validator.md) for exact coverage
- **No dependencies** - no reflect-metadata needed
- **Custom validators** supported
- **Nested validation** with full type safety

### Transformer Module

- **Two powerful APIs** - Decorator API and Compatibility API
- **Decorator API is JIT-compiled** - each mapper compiles a specialized transform function once; subsequent transforms reuse it, with no per-call reflection
- **Compatibility API interprets metadata at call time** - no reflect-metadata, no per-call decorator re-evaluation
- **Drop-in for the supported subset** - see the [compat tables](./compat-class-transformer.md) for exact coverage
- **No dependencies** - no reflect-metadata needed
- **Type-safe** with full TypeScript support

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
3. **Use @MapWith()** for nested objects
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
