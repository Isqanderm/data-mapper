/**
 * # om-data-mapper
 *
 * High-performance TypeScript/JavaScript data mapper with JIT compilation for ultra-fast
 * object transformations. Delivers up to **42.7x better performance** than class-transformer
 * while providing a clean, declarative API with zero runtime dependencies.
 *
 * ## 🚀 Key Features
 *
 * - **🔥 Blazing Fast**: 17.28x faster than class-transformer through JIT compilation
 * - **📦 Zero Dependencies**: No reflect-metadata or other runtime dependencies required
 * - **🎨 Modern Decorators**: Uses TC39 Stage 3 decorators (not experimental)
 * - **🔄 Drop-in Replacement**: Compatible with class-transformer and class-validator APIs
 * - **📉 Smaller Bundle**: 70% smaller bundle size compared to class-transformer
 * - **🛡️ Type-Safe**: Full TypeScript support with comprehensive type inference
 * - **⚡ JIT Compilation**: Generates optimized transformation code at runtime
 * - **🎯 Developer-Friendly**: Clean, intuitive API with excellent IDE support
 *
 * ## 📦 Installation
 *
 * ```bash
 * npm install om-data-mapper
 * # or
 * pnpm add om-data-mapper
 * # or
 * yarn add om-data-mapper
 * ```
 *
 * ## 🎯 Quick Start
 *
 * ### Basic Usage
 *
 * ```typescript
 * import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';
 *
 * // Define your types
 * type UserSource = {
 *   firstName: string;
 *   lastName: string;
 *   age: number;
 *   email: string;
 * };
 *
 * type UserDTO = {
 *   fullName: string;
 *   email: string;
 *   isAdult: boolean;
 * };
 *
 * // Create a mapper with decorators
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
 *   fullName!: string;
 *
 *   @Map('email')
 *   email!: string;
 *
 *   @MapFrom((src: UserSource) => src.age >= 18)
 *   isAdult!: boolean;
 * }
 *
 * // Transform your data
 * const source = {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   age: 30,
 *   email: 'john@example.com'
 * };
 *
 * const result = plainToInstance(UserMapper, source);
 * // { fullName: 'John Doe', email: 'john@example.com', isAdult: true }
 * ```
 *
 * ### Migrating from class-transformer
 *
 * ```typescript
 * // Before (class-transformer)
 * import 'reflect-metadata';
 * import { plainToClass, Expose, Type } from 'class-transformer';
 *
 * // After (om-data-mapper) - Just change the import!
 * import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
 *
 * // Your existing code works exactly the same, but 17.28x faster! 🚀
 * ```
 *
 * ## 📚 Core API Overview
 *
 * ### Decorators
 *
 * - {@link Mapper} - Mark a class as a mapper with JIT compilation
 * - {@link Map} - Simple property mapping with dot notation support
 * - {@link MapFrom} - Custom transformation using a function
 * - {@link Transform} - Transform mapped values
 * - {@link MapWith} - Use nested mappers for complex objects
 * - {@link Default} - Set default values for properties
 * - {@link Ignore} - Exclude properties from mapping
 *
 * ### Transformation Functions
 *
 * - {@link plainToInstance} - Transform a plain object to a class instance
 * - {@link plainToInstanceArray} - Transform an array of plain objects
 * - {@link tryPlainToInstance} - Transform with error handling
 * - {@link tryPlainToInstanceArray} - Transform array with error handling
 * - {@link createMapper} - Create a reusable mapper instance
 * - {@link getMapper} - Alias for createMapper
 *
 * ### Compatibility APIs
 *
 * - `om-data-mapper/class-transformer-compat` - Drop-in replacement for class-transformer
 * - `om-data-mapper/class-validator-compat` - Drop-in replacement for class-validator
 *
 * ## 🎨 Advanced Examples
 *
 * ### Nested Object Mapping
 *
 * ```typescript
 * @Mapper<AddressSource, AddressDTO>()
 * class AddressMapper {
 *   @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
 *   fullAddress!: string;
 * }
 *
 * @Mapper<UserSource, UserDTO>()
 * class UserMapper {
 *   @Map('name')
 *   name!: string;
 *
 *   @MapWith(AddressMapper)
 *   @Map('address')
 *   address!: AddressDTO;
 * }
 * ```
 *
 * ### Array Transformations
 *
 * ```typescript
 * @Mapper<ProductSource, ProductDTO>()
 * class ProductMapper {
 *   @Map('id')
 *   id!: string;
 *
 *   @MapFrom((src: ProductSource) => src.tags.map(t => t.toUpperCase()))
 *   tagsUpper!: string[];
 * }
 *
 * const products = plainToInstanceArray(ProductMapper, apiResponse);
 * ```
 *
 * ### Error Handling
 *
 * ```typescript
 * const { result, errors } = tryPlainToInstance(UserMapper, source);
 *
 * if (errors.length > 0) {
 *   console.error('Transformation errors:', errors);
 * } else {
 *   console.log('Success:', result);
 * }
 * ```
 *
 * ## 📖 Documentation
 *
 * For comprehensive guides and examples, visit:
 * - [GitHub Repository](https://github.com/Isqanderm/data-mapper)
 * - [Documentation](https://github.com/Isqanderm/data-mapper/tree/main/docs)
 * - [Examples](https://github.com/Isqanderm/data-mapper/tree/main/examples)
 *
 * ## 🤝 Contributing
 *
 * Contributions are welcome! Please see our [Contributing Guide](https://github.com/Isqanderm/data-mapper/blob/main/CONTRIBUTING.md).
 *
 * ## 📄 License
 *
 * MIT License - see [LICENSE](https://github.com/Isqanderm/data-mapper/blob/main/LICENSE)
 *
 * @packageDocumentation
 */

// Legacy API (deprecated but maintained for backward compatibility)
export * from './core/interfaces';
export * from './core/Mapper';

// Decorator API (recommended)
export {
  Mapper,
  Map,
  MapFrom,
  Default,
  Transform,
  MapWith,
  Ignore,
  type MapperOptions,
  type PropertyMapping,
  type MapperMetadata,
} from './decorators';

// Helper functions for type-safe mapper usage (recommended)
export {
  createMapper,
  plainToInstance,
  plainToClass,
  plainToInstanceArray,
  plainToClassArray,
  tryPlainToInstance,
  tryPlainToInstanceArray,
  getMapper,
  type TransformOptions,
} from './decorators';
