/**
 * Model classes for om-data-mapper benchmarks
 * Pre-compiled JavaScript with decorators applied
 * 
 * Note: We can't use TypeScript decorators directly in benchmarks because
 * om-data-mapper uses TC39 Stage 3 decorators which require compilation.
 * Instead, we use the plainToClass API which doesn't require decorators at runtime.
 */

const path = require('path');
const omPath = path.join(__dirname, '../../../build/compat/class-transformer');
const { Expose, Exclude, Type, Transform } = require(omPath);

// We'll export class constructors that will be used with plainToClass
// The decorators are applied via metadata, not at runtime

class SimpleUser {
  constructor() {
    this.id = undefined;
    this.firstName = undefined;
    this.lastName = undefined;
    this.email = undefined;
    this.age = undefined;
    this.isActive = undefined;
    this.role = undefined;
  }
}

class Address {
  constructor() {
    this.street = undefined;
    this.city = undefined;
    this.country = undefined;
    this.zipCode = undefined;
  }
}

class Company {
  constructor() {
    this.name = undefined;
    this.address = undefined;
  }
}

class ComplexUser {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.homeAddress = undefined;
    this.company = undefined;
  }
}

class Product {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.price = undefined;
    this.inStock = undefined;
  }
}

class TransformUser {
  constructor() {
    this.id = undefined;
    this.name = undefined;
    this.createdAt = undefined;
    this.fullName = undefined;
    this.password = undefined;
  }
}

class SecureUser {
  constructor() {
    this.id = undefined;
    this.username = undefined;
    this.password = undefined;
    this.secretKey = undefined;
    this.email = undefined;
    this.role = undefined;
  }
}

module.exports = {
  SimpleUser,
  Address,
  Company,
  ComplexUser,
  Product,
  TransformUser,
  SecureUser,
};

