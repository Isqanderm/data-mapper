# om-data-mapper

`om-data-mapper` is a flexible and powerful tool for object mapping in JavaScript and TypeScript, supporting simple mapping, deep mapping, and mapping through composition.

## Installation

Install `om-data-mapper` using npm:

```bash
npm i --save om-data-mapper
```

## Features

`om-data-mapper` offers the following features:

### Simple Mapping

Simple mapping allows you to easily transform one object into another by copying or transforming its properties.

```ts
const mapper = new UserMapper<User, TargeetUser>({
  name: 'firstName',
  fullName: (user) => `${user.firstName} ${user.lastName}`
});

const target = mapper.execute(sourceObject);
```

### Deep Mapping

Deep mapping supports the mapping of nested objects and allows the construction of complex data structures.

```ts
const addressMapper = new AddressMapper<Address, TargetAddress>({
  fullAddress: (address) => `${address.city}, ${address.street}, ${address.appartment}`
})
const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  addressStreet: 'address.street',
  addressCity: 'address.city',
});

const target = mapper.execute(sourceObject);
```

### Mapping with Composition

Mapping with composition allows combining multiple mappers to create complex data transformations.

```ts
const addressMapper = new AddressMapper<Address, TargetAddress>({
  fullAddress: (address) => `${address.city}, ${address.street}, ${address.appartment}`
})
const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  address: addressMapper,
});

const target = mapper.execute(sourceObject);
```

### Mapping with nested config

Mapping with composition allows combining multiple mappers to create complex data transformations.

```typescript
const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  address: {
    city: 'address.city',
    street: 'address.street',
  },
});

const target = mapper.execute(sourceObject);
```

### Limitations

When using functions in the mapping configuration, consider the following limitations:

Use Pure Functions: Functions used in the mapping configuration should be pure functions, meaning they should not have side effects and should return the same value for the same set of inputs.

Avoid Using Context (this): Functions should not depend on the this context. They should be defined as regular functions rather than methods of objects.

Serialization Safety: When using functions, they are compiled into string form and then back into functions. This can lead to serialization issues if the function depends on variables or objects outside its scope. Avoid using closures that depend on external variables.

Avoid Complex Constructs: Avoid using complex constructs such as recursion or global objects within mapping functions.

Example of using a function in the mapping configuration:

```typescript
const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  fullName: (user) => `${user.firstName} ${user.lastName}`
});
```

Example of an inappropriate function (not recommended):

```typescript
const externalVariable = 'some value';

const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  fullName: (user) => `${user.firstName} ${externalVariable}`
});
```

In this example, the fullName function depends on the external variable externalVariable, which can lead to errors during compilation and execution of the mapping.

## License

`om-data-mapper` is distributed under the MIT license. See the LICENSE file in the root directory of the project for more information.
