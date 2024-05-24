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

```ts
const mapper = new UserMapper<User, TargetUser>({
  name: 'firstName',
  address: {
    city: 'address.city',
    street: 'address.street',
  },
});

const target = mapper.execute(sourceObject);
```

## License

`om-data-mapper` is distributed under the MIT license. See the LICENSE file in the root directory of the project for more information.
