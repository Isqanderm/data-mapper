/**
 * Model classes for om-data-mapper benchmarks
 * Using TC39 Stage 3 decorators
 */

import { Expose, Exclude, Type, Transform } from '../../../../build/compat/class-transformer';

// ============================================================================
// Scenario 1: Simple Transformation (5-10 properties)
// ============================================================================

export class SimpleUser {
  @Expose()
  id!: number;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  email!: string;

  @Expose()
  age!: number;

  @Expose()
  isActive!: boolean;

  @Expose()
  role!: string;
}

// ============================================================================
// Scenario 2: Complex Nested Transformation
// ============================================================================

export class Address {
  @Expose()
  street!: string;

  @Expose()
  city!: string;

  @Expose()
  country!: string;

  @Expose()
  zipCode!: string;
}

export class Company {
  @Expose()
  name!: string;

  @Expose()
  @Type(() => Address)
  address!: Address;
}

export class ComplexUser {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  @Type(() => Address)
  homeAddress!: Address;

  @Expose()
  @Type(() => Company)
  company!: Company;
}

// ============================================================================
// Scenario 3: Array Transformation
// ============================================================================

export class Product {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  price!: number;

  @Expose()
  inStock!: boolean;
}

// ============================================================================
// Scenario 4: Transformation with Custom Logic
// ============================================================================

export class TransformUser {
  @Expose()
  id!: number;

  @Expose()
  @Transform(({ value }) => value.toUpperCase())
  name!: string;

  @Expose()
  @Transform(({ value }) => new Date(value))
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`)
  fullName!: string;

  @Exclude()
  password!: string;
}

// ============================================================================
// Scenario 5: Exclude/Expose Mix
// ============================================================================

export class SecureUser {
  @Expose()
  id!: number;

  @Expose()
  username!: string;

  @Exclude()
  password!: string;

  @Exclude()
  secretKey!: string;

  @Expose()
  email!: string;

  @Expose()
  role!: string;
}

