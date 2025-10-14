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
// Option 1: Use implements MapperMethods<Source, Target>
@Mapper<UserSource, UserDTO>()
class UserMapper implements MapperMethods<UserSource, UserDTO> {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  @MapFrom((src: UserSource) => src.age >= 18)
  isAdult!: boolean;

  // Methods are declared by MapperMethods interface
  // Implementation is provided by @Mapper decorator at runtime
  transform!: (source: UserSource) => UserDTO;
  tryTransform!: (source: UserSource) => { result: UserDTO; errors: string[] };
}

// Usage example
const mapper = new UserMapper();

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

// Option 2: Implement MapperMethods for nested mappers
@Mapper<AddressSource, AddressDTO>()
class AddressMapper implements MapperMethods<AddressSource, AddressDTO> {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}, ${src.country}`)
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

const personMapper = new PersonMapper();
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

