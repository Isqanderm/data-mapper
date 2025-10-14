# TypeScript Type Safety with Mapper Decorators

This guide explains how to get full TypeScript type safety and autocomplete when using the `@Mapper()` decorator.

## The Challenge

Due to TypeScript limitations with TC39 Stage 3 decorators, the `transform()` and `tryTransform()` methods added by the `@Mapper()` decorator at runtime are not visible to TypeScript at compile time. This means you won't get autocomplete or type checking for these methods without type assertions.

## The Solution: Type Assertions with MapperMethods

The `MapperMethods<Source, Target>` type provides type information for the methods added by the decorator. Use type assertions to get full TypeScript support.

## Basic Usage

### Recommended Pattern: Type Assertion

```typescript
import { Mapper, Map, MapFrom, MapperMethods } from 'om-data-mapper';

type UserSource = {
  firstName: string;
  lastName: string;
  email: string;
};

type UserDTO = {
  fullName: string;
  email: string;
};

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;
}

// Type-safe usage with type assertion
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;

// TypeScript knows the exact types!
const result = mapper.transform({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});

// Full autocomplete for result properties
console.log(result.fullName); // ✅ TypeScript knows this exists
console.log(result.email);    // ✅ TypeScript knows this exists
```

### Alternative: Helper Function

Create a helper function to avoid repeating type assertions:

```typescript
function createMapper<S, T>(MapperClass: new () => any): MapperMethods<S, T> {
  return new MapperClass();
}

const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result = mapper.transform(source); // ✅ Fully typed
```

## Benefits

### 1. Type-Safe Transform Calls

```typescript
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;

// ✅ TypeScript checks source type
const result = mapper.transform(source);

// ❌ TypeScript error: wrong source type
const badResult = mapper.transform({ wrong: 'type' });
```

### 2. Autocomplete for Result Properties

```typescript
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const result = mapper.transform(source);

// ✅ Autocomplete shows: fullName, email
result.fullName;
result.email;

// ❌ TypeScript error: property doesn't exist
result.nonExistent;
```

### 3. Type-Safe Error Handling

```typescript
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const { result, errors } = mapper.tryTransform(source);

// ✅ TypeScript knows result is UserDTO
console.log(result.fullName);

// ✅ TypeScript knows errors is string[]
if (errors.length > 0) {
  console.error(errors);
}
```

## Working with Nested Mappers

When using nested mappers, use type assertions for both mappers:

```typescript
type AddressSource = { street: string; city: string };
type AddressDTO = { fullAddress: string };

type PersonSource = { name: string; address: AddressSource };
type PersonDTO = { name: string; location: AddressDTO };

@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
  fullAddress!: string;
}

@Mapper<PersonSource, PersonDTO>()
class PersonMapper {
  @Map('name')
  name!: string;

  @MapFrom((src: PersonSource) => {
    const addressMapper = new AddressMapper() as AddressMapper & MapperMethods<AddressSource, AddressDTO>;
    return addressMapper.transform(src.address);
  })
  location!: AddressDTO;
}

// ✅ Full type safety throughout the chain
const personMapper = new PersonMapper() as PersonMapper & MapperMethods<PersonSource, PersonDTO>;
const result = personMapper.transform({
  name: 'Jane',
  address: { street: '123 Main St', city: 'New York' }
});

console.log(result.location.fullAddress); // ✅ TypeScript knows this exists
```

## Generic Mappers

You can create generic mapper classes:

```typescript
@Mapper<Source, Target>()
class GenericMapper<Source, Target> implements MapperMethods<Source, Target> {
  transform!: (source: Source) => Target;
  tryTransform!: (source: Source) => { result: Target; errors: string[] };
}
```

## Best Practices

### 1. Always Specify Source and Target Types

```typescript
// ✅ Good: Explicit types
@Mapper<UserSource, UserDTO>()
class UserMapper {
  // ...
}

// ❌ Bad: No types (loses type safety)
@Mapper()
class UserMapper {
  // ...
}
```

### 2. Always Use Type Assertions

```typescript
// ✅ Good: Type assertion for type safety
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;

// ❌ Bad: No type assertion (no type safety)
const mapper = new UserMapper();
```

### 3. Keep Source and Target Types Close to Mapper

```typescript
// ✅ Good: Types defined near mapper
type UserSource = { /* ... */ };
type UserDTO = { /* ... */ };

@Mapper<UserSource, UserDTO>()
class UserMapper {
  // ...
}
```

## Common Patterns

### Pattern 1: Mapper with Validation

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => src.email.toLowerCase())
  email!: string;

  // Custom validation method
  validate(source: UserSource): boolean {
    return source.email.includes('@');
  }
}

const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
```

### Pattern 2: Mapper with Helper Methods

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => this.formatName(src))
  fullName!: string;

  // Helper method
  private formatName(src: UserSource): string {
    return `${src.firstName} ${src.lastName}`.trim();
  }
}

const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
```

### Pattern 3: Mapper Factory

```typescript
function createMapper<S, T>(MapperClass: new () => any): MapperMethods<S, T> {
  return new MapperClass();
}

const userMapper = createMapper<UserSource, UserDTO>(UserMapper);
const result = userMapper.transform(source); // ✅ Fully typed
```

## Migration from Legacy API

If you're migrating from the legacy `Mapper.create()` API:

### Before (Legacy API)
```typescript
const userMapper = Mapper.create<UserSource, UserDTO>({
  fullName: (src) => `${src.firstName} ${src.lastName}`,
  email: 'email',
});

const result = userMapper.transform(source);
```

### After (Decorator API with Type Safety)
```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;
}

const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;
const result = mapper.transform(source);
```

## Troubleshooting

### Issue: "Property 'transform' does not exist"

**Solution**: Make sure you're using type assertion:

```typescript
@Mapper<Source, Target>()
class MyMapper {
  // ... your mappings
}

// Add type assertion
const mapper = new MyMapper() as MyMapper & MapperMethods<Source, Target>;
```

### Issue: "Type 'X' is not assignable to type 'Y'"

**Solution**: Check that your Source and Target types match the actual data structure:

```typescript
// Make sure Source type matches your input data
type UserSource = {
  firstName: string;  // ✅ Matches input
  lastName: string;   // ✅ Matches input
};

// Make sure Target type matches your mapper properties
type UserDTO = {
  fullName: string;  // ✅ Matches @MapFrom property
  email: string;     // ✅ Matches @Map property
};
```

## Summary

- Use `MapperMethods<Source, Target>` type for full TypeScript type safety
- Always use type assertions: `new MyMapper() as MyMapper & MapperMethods<Source, Target>`
- Always specify Source and Target types in `@Mapper<Source, Target>()`
- Create helper functions to avoid repeating type assertions
- The decorator provides the `transform()` and `tryTransform()` methods at runtime
- Do NOT use `implements MapperMethods` in class declaration (it interferes with the decorator)

