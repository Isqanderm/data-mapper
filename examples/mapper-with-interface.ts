/**
 * Example: Using MapperMethods for type safety
 *
 * This example demonstrates how to use the MapperMethods type
 * to get full TypeScript type checking and autocomplete for
 * mapper classes decorated with @Mapper()
 */

import { Mapper, Map, MapFrom, Transform, MapperMethods } from '../src/decorators';

// Define source and target types
type UserSource = {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
};

type UserDTO = {
  fullName: string;
  email: string;
  isAdult: boolean;
};

// Mapper class with type-safe methods
// The @Mapper decorator adds transform() and tryTransform() methods at runtime
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  @MapFrom((src: UserSource) => src.age >= 18)
  isAdult!: boolean;
}

// Usage with type assertion for TypeScript type safety
const mapper = new UserMapper() as UserMapper & MapperMethods<UserSource, UserDTO>;

const source: UserSource = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  age: 25,
};

// TypeScript knows that result is UserDTO
const result = mapper.transform(source);

console.log('Result:', result);
// Output: { fullName: 'John Doe', email: 'john.doe@example.com', isAdult: true }

// TypeScript autocomplete works for result properties
console.log('Full name:', result.fullName);
console.log('Email:', result.email);
console.log('Is adult:', result.isAdult);

// Safe transformation with error handling
const safeResult = mapper.tryTransform(source);
console.log('Safe result:', safeResult.result);
console.log('Errors:', safeResult.errors);

// Example with nested mappers
type AddressSource = {
  street: string;
  city: string;
  country: string;
};

type AddressDTO = {
  fullAddress: string;
};

type PersonSource = {
  name: string;
  address: AddressSource;
};

type PersonDTO = {
  name: string;
  location: AddressDTO;
};

// Nested mappers example
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}, ${src.country}`)
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

const personMapper = new PersonMapper() as PersonMapper & MapperMethods<PersonSource, PersonDTO>;
const personSource: PersonSource = {
  name: 'Jane Smith',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
  },
};

const personResult = personMapper.transform(personSource);
console.log('Person result:', personResult);
// Output: { name: 'Jane Smith', location: { fullAddress: '123 Main St, New York, USA' } }

// TypeScript knows the exact type of personResult
console.log('Location:', personResult.location.fullAddress);

