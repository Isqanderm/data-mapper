# om-data-mapper Examples

This directory contains practical examples demonstrating various features and use cases of om-data-mapper.

## 📁 Directory Structure

### 01-basic/

Basic examples for getting started with om-data-mapper.

- **simple-mapping/** - Simple property mapping
  - Direct field mapping
  - Basic transformations
- **nested-mapping/** - Working with nested objects
  - Deep property access
  - Nested object transformations
- **array-mapping/** - Array transformations
  - Mapping arrays of objects
  - Array element transformations

### 02-advanced/

Advanced examples showcasing powerful features.

- **complex-transformations/** - Complex mapping scenarios
  - Multiple transformations
  - Conditional mapping
  - Custom transformers
- **error-handling/** - Error handling patterns
  - Validation
  - Error collection
  - Safe mode vs unsafe mode
- **composition/** - Mapper composition
  - Nested mappers
  - Reusable mapping configurations
  - Combining multiple mappers

## 🚀 Running Examples

Each example can be run using ts-node:

```bash
# Run a specific example
npx ts-node examples/01-basic/simple-mapping/index.ts

# Or using npm script (if configured)
npm run examples
```

## 📚 Learning Path

We recommend following this order:

1. **Start with basics:**
   - `01-basic/simple-mapping` - Understand core concepts
   - `01-basic/nested-mapping` - Learn deep property access
   - `01-basic/array-mapping` - Work with collections

2. **Move to advanced:**
   - `02-advanced/complex-transformations` - Master transformations
   - `02-advanced/error-handling` - Handle errors properly
   - `02-advanced/composition` - Build reusable mappers

## 💡 Tips

- Each example is self-contained and can be run independently
- Examples include comments explaining key concepts
- Check the main [README.md](../README.md) for API documentation
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for adding new examples

## 🔗 Related Documentation

- [API Documentation](../README.md#api-documentation)
- [Performance Benchmarks](../benchmarks/README.md)
- [Contributing Guide](../CONTRIBUTING.md)
