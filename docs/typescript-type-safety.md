# TypeScript Type Safety with Mapper Decorators

This guide explains how to get full TypeScript type safety and autocomplete when using the `@Mapper()` decorator.

## The Challenge

Due to TypeScript limitations with TC39 Stage 3 decorators, the `transform()` and `tryTransform()` methods added by the `@Mapper()` decorator at runtime are not visible to TypeScript at compile time. This means you won't get autocomplete or type checking for these methods.

## The Solution: MapperMethods Type

The `MapperMethods<Source, Target>` type provides a way to declare the mapper methods in your class, giving you full TypeScript support while the actual implementation is still provided by the decorator.

## Basic Usage

### Option 1: Implements MapperMethods (Recommended)

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
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  // Declare methods (implementation provided by @Mapper decorator)
  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };
}

// TypeScript knows the exact types!
const mapper = new UserMapper();
const result = mapper.transform({ 
  firstName: 'John', 
  lastName: 'Doe', 
  email: 'john@example.com' 
});

// Full autocomplete for result properties
console.log(result.fullName); // ✅ TypeScript knows this exists
console.log(result.email);    // ✅ TypeScript knows this exists
```

### Option 2: Manual Method Declarations

If you prefer not to use `implements`, you can declare the methods manually:

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  // Manually declare methods
  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };
}
```

## Benefits

### 1. Type-Safe Transform Calls

```typescript
const mapper = new UserMapper();

// ✅ TypeScript checks source type
const result = mapper.transform(source);

// ❌ TypeScript error: wrong source type
const badResult = mapper.transform({ wrong: 'type' });
```

### 2. Autocomplete for Result Properties

```typescript
const result = mapper.transform(source);

// ✅ Autocomplete shows: fullName, email
result.fullName;
result.email;

// ❌ TypeScript error: property doesn't exist
result.nonExistent;
```

### 3. Type-Safe Error Handling

```typescript
const { result, errors } = mapper.tryTransform(source);

// ✅ TypeScript knows result is UserDTO
console.log(result.fullName);

// ✅ TypeScript knows errors is string[]
if (errors.length > 0) {
  console.error(errors);
}
```

## Working with Nested Mappers

When using nested mappers with `@MapWith`, both mappers should implement `MapperMethods`:

```typescript
type AddressSource = { street: string; city: string };
type AddressDTO = { fullAddress: string };

type PersonSource = { name: string; address: AddressSource };
type PersonDTO = { name: string; location: AddressDTO };

@Mapper<AddressSource, AddressDTO>()
class AddressMapper implements MapperMethods<AddressSource, AddressDTO> {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}`)
  fullAddress!: string;

  transform!: (source: AddressSource) => AddressDTO;
  tryTransform!: (source: AddressSource) => { result: AddressDTO; errors: string[] };
}

@Mapper<PersonSource, PersonDTO>()
class PersonMapper implements MapperMethods<PersonSource, PersonDTO> {
  @Map('name')
  name!: string;

  @MapFrom((src: PersonSource) => new AddressMapper().transform(src.address))
  location!: AddressDTO;

  transform!: (source: PersonSource) => PersonDTO;
  tryTransform!: (source: PersonSource) => { result: PersonDTO; errors: string[] };
}

// ✅ Full type safety throughout the chain
const personMapper = new PersonMapper();
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
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  // ...
}

// ❌ Bad: No types (loses type safety)
@Mapper()
class UserMapper {
  // ...
}
```

### 2. Use Non-Null Assertion for Method Declarations

The `!` operator tells TypeScript that the property will be initialized (by the decorator):

```typescript
// ✅ Good: Non-null assertion
transform!: (source: UserSource) => UserDTO;

// ❌ Bad: Optional (makes the method optional in TypeScript)
transform?: (source: UserSource) => UserDTO;
```

### 3. Keep Source and Target Types Close to Mapper

```typescript
// ✅ Good: Types defined near mapper
type UserSource = { /* ... */ };
type UserDTO = { /* ... */ };

@Mapper<UserSource, UserDTO>()
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  // ...
}
```

## Common Patterns

### Pattern 1: Mapper with Validation

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  @MapFrom((src: UserSource) => src.email.toLowerCase())
  email!: string;

  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };

  // Custom validation method
  validate(source: UserSource): boolean {
    return source.email.includes('@');
  }
}
```

### Pattern 2: Mapper with Helper Methods

```typescript
@Mapper<UserSource, UserDTO>()
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  @MapFrom((src: UserSource) => this.formatName(src))
  fullName!: string;

  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };

  // Helper method
  private formatName(src: UserSource): string {
    return `${src.firstName} ${src.lastName}`.trim();
  }
}
```

### Pattern 3: Mapper Factory

```typescript
function createMapper<S, T>(
  MapperClass: new () => MapperMethods<S, T>
): MapperMethods<S, T> {
  return new MapperClass();
}

const userMapper = createMapper(UserMapper);
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
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };
}

const mapper = new UserMapper();
const result = mapper.transform(source);
```

## Troubleshooting

### Issue: "Property 'transform' does not exist"

**Solution**: Make sure you've declared the methods in your class:

```typescript
@Mapper<Source, Target>()
class MyMapper implements MapperMethods<Source, Target> {
  // Add these declarations:
  transform!: (source: Source) => Target;
  tryTransform!: (source: Source) => { result: Target; errors: string[] };
}
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

- Use `MapperMethods<Source, Target>` for full TypeScript type safety
- Declare `transform!` and `tryTransform!` methods in your mapper class
- Always specify Source and Target types in `@Mapper<Source, Target>()`
- Use `implements MapperMethods<Source, Target>` for cleaner code
- The decorator provides the implementation at runtime

