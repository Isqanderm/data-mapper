/**
 * Ergonomic API Example
 * 
 * This example demonstrates the new ergonomic API that provides
 * TypeScript type safety without requiring verbose type assertions.
 * 
 * Inspired by class-transformer's API design.
 */

import {
  Mapper,
  Map,
  MapFrom,
  Transform,
  createMapper,
  plainToInstance,
  plainToInstanceArray,
  tryPlainToInstance,
  getMapper,
} from '../src/decorators';

// ============================================================================
// Example 1: Basic Usage with plainToInstance
// ============================================================================

type UserSource = {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
};

type UserDTO = {
  fullName: string;
  email: string;
  isAdult: boolean;
};

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  email!: string;

  @MapFrom((src: UserSource) => src.age >= 18)
  isAdult!: boolean;
}

// ✅ Clean, type-safe API - no type assertions needed!
const userSource: UserSource = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com',
};

const userResult = plainToInstance<UserSource, UserDTO>(UserMapper, userSource);
console.log('User:', userResult);
// Output: { fullName: 'John Doe', email: 'john@example.com', isAdult: true }

// TypeScript knows the exact type - full autocomplete!
console.log('Full name:', userResult.fullName);
console.log('Is adult:', userResult.isAdult);

// ============================================================================
// Example 2: Working with Arrays
// ============================================================================

const users: UserSource[] = [
  { firstName: 'John', lastName: 'Doe', age: 30, email: 'john@example.com' },
  { firstName: 'Jane', lastName: 'Smith', age: 25, email: 'jane@example.com' },
  { firstName: 'Bob', lastName: 'Johnson', age: 17, email: 'bob@example.com' },
];

const userResults = plainToInstanceArray<UserSource, UserDTO>(UserMapper, users);
console.log('\nUsers:', userResults);
// Output: [
//   { fullName: 'John Doe', email: 'john@example.com', isAdult: true },
//   { fullName: 'Jane Smith', email: 'jane@example.com', isAdult: true },
//   { fullName: 'Bob Johnson', email: 'bob@example.com', isAdult: false }
// ]

// ============================================================================
// Example 3: Error Handling with tryPlainToInstance
// ============================================================================

type ProductSource = {
  name: string;
  price?: number;
};

type ProductDTO = {
  name: string;
  formattedPrice: string;
};

@Mapper<ProductSource, ProductDTO>()
class ProductMapper {
  @Map('name')
  name!: string;

  @MapFrom((src: ProductSource) => {
    if (src.price === undefined) {
      throw new Error('Price is required');
    }
    return `$${src.price.toFixed(2)}`;
  })
  formattedPrice!: string;
}

const validProduct: ProductSource = { name: 'Laptop', price: 999.99 };
const invalidProduct: ProductSource = { name: 'Mouse' }; // missing price

const { result: validResult, errors: validErrors } = tryPlainToInstance<ProductSource, ProductDTO>(
  ProductMapper,
  validProduct,
);
console.log('\nValid product:', validResult);
console.log('Errors:', validErrors);
// Output: { name: 'Laptop', formattedPrice: '$999.99' }, []

const { result: invalidResult, errors: invalidErrors } = tryPlainToInstance<ProductSource, ProductDTO>(
  ProductMapper,
  invalidProduct,
);
console.log('\nInvalid product:', invalidResult);
console.log('Errors:', invalidErrors);
// Output: { name: 'Mouse' }, ['Mapping error at field by function ...']

// ============================================================================
// Example 4: Reusable Mapper with createMapper/getMapper
// ============================================================================

// Create a reusable mapper instance
const userMapper = createMapper<UserSource, UserDTO>(UserMapper);

// Use it multiple times
const user1 = userMapper.transform({ firstName: 'Alice', lastName: 'Wonder', age: 28, email: 'alice@example.com' });
const user2 = userMapper.transform({ firstName: 'Bob', lastName: 'Builder', age: 35, email: 'bob@example.com' });

console.log('\nReusable mapper results:');
console.log('User 1:', user1);
console.log('User 2:', user2);

// Alternative: getMapper (alias for createMapper)
const productMapper = getMapper<ProductSource, ProductDTO>(ProductMapper);
const product = productMapper.transform({ name: 'Keyboard', price: 79.99 });
console.log('\nProduct:', product);

// ============================================================================
// Example 5: Nested Mappers
// ============================================================================

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
  age: number;
  address: AddressSource;
};

type PersonDTO = {
  name: string;
  isAdult: boolean;
  location: AddressDTO;
};

@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @MapFrom((src: AddressSource) => `${src.street}, ${src.city}, ${src.country}`)
  fullAddress!: string;
}

@Mapper<PersonSource, PersonDTO>()
class PersonMapper {
  @Map('name')
  name!: string;

  @MapFrom((src: PersonSource) => src.age >= 18)
  isAdult!: boolean;

  // Use plainToInstance for nested transformation
  @MapFrom((src: PersonSource) => plainToInstance<AddressSource, AddressDTO>(AddressMapper, src.address))
  location!: AddressDTO;
}

const personSource: PersonSource = {
  name: 'John Doe',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
  },
};

const personResult = plainToInstance<PersonSource, PersonDTO>(PersonMapper, personSource);
console.log('\nPerson:', personResult);
// Output: {
//   name: 'John Doe',
//   isAdult: true,
//   location: { fullAddress: '123 Main St, New York, USA' }
// }

// TypeScript knows the nested structure!
console.log('Location:', personResult.location.fullAddress);

// ============================================================================
// Example 6: Complex Transformations
// ============================================================================

type OrderSource = {
  id: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  customerEmail: string;
};

type OrderDTO = {
  orderId: string;
  totalAmount: string;
  itemCount: number;
  customer: string;
};

@Mapper<OrderSource, OrderDTO>()
class OrderMapper {
  @MapFrom((src: OrderSource) => `ORD-${src.id.toString().padStart(6, '0')}`)
  orderId!: string;

  @MapFrom((src: OrderSource) => {
    const total = src.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return `$${total.toFixed(2)}`;
  })
  totalAmount!: string;

  @MapFrom((src: OrderSource) => src.items.length)
  itemCount!: number;

  @MapFrom((src: OrderSource) => src.customerEmail.toLowerCase())
  @Transform((email: string) => email.trim())
  customer!: string;
}

const orderSource: OrderSource = {
  id: 42,
  items: [
    { name: 'Laptop', price: 999.99, quantity: 1 },
    { name: 'Mouse', price: 29.99, quantity: 2 },
  ],
  customerEmail: '  JOHN@EXAMPLE.COM  ',
};

const orderResult = plainToInstance<OrderSource, OrderDTO>(OrderMapper, orderSource);
console.log('\nOrder:', orderResult);
// Output: {
//   orderId: 'ORD-000042',
//   totalAmount: '$1059.97',
//   itemCount: 2,
//   customer: 'john@example.com'
// }

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== Summary ===');
console.log('✅ No type assertions needed');
console.log('✅ Full TypeScript type safety');
console.log('✅ Clean, ergonomic API');
console.log('✅ Similar to class-transformer');
console.log('✅ Works with nested mappers');
console.log('✅ Supports error handling');
console.log('✅ Reusable mapper instances');

