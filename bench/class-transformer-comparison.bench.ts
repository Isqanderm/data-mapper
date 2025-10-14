/**
 * Comprehensive benchmark comparing om-data-mapper's class-transformer compatibility layer
 * with the original class-transformer library
 */

import { bench, describe } from 'vitest';
import 'reflect-metadata';

// Import om-data-mapper compatibility layer
import {
  plainToClass as omPlainToClass,
  classToPlain as omClassToPlain,
  Expose as OmExpose,
  Exclude as OmExclude,
  Type as OmType,
  Transform as OmTransform,
} from '../build/class-transformer-compat/index.js';

// Import original class-transformer
import {
  plainToClass as ctPlainToClass,
  classToPlain as ctClassToPlain,
  Expose as CtExpose,
  Exclude as CtExclude,
  Type as CtType,
  Transform as CtTransform,
} from 'class-transformer';

// ============================================================================
// Scenario 1: Simple Transformation (5-10 properties)
// ============================================================================

class OmSimpleUser {
  @OmExpose()
  id!: number;

  @OmExpose()
  firstName!: string;

  @OmExpose()
  lastName!: string;

  @OmExpose()
  email!: string;

  @OmExpose()
  age!: number;

  @OmExpose()
  isActive!: boolean;

  @OmExpose()
  createdAt!: string;
}

class CtSimpleUser {
  @CtExpose()
  id!: number;

  @CtExpose()
  firstName!: string;

  @CtExpose()
  lastName!: string;

  @CtExpose()
  email!: string;

  @CtExpose()
  age!: number;

  @CtExpose()
  isActive!: boolean;

  @CtExpose()
  createdAt!: string;
}

const simpleUserData = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

// ============================================================================
// Scenario 2: Nested Objects (2-3 levels)
// ============================================================================

class OmAddress {
  @OmExpose()
  street!: string;

  @OmExpose()
  city!: string;

  @OmExpose()
  country!: string;

  @OmExpose()
  zipCode!: string;
}

class OmCompany {
  @OmExpose()
  name!: string;

  @OmExpose()
  @OmType(() => OmAddress)
  address!: OmAddress;
}

class OmNestedUser {
  @OmExpose()
  id!: number;

  @OmExpose()
  name!: string;

  @OmExpose()
  @OmType(() => OmAddress)
  homeAddress!: OmAddress;

  @OmExpose()
  @OmType(() => OmCompany)
  company!: OmCompany;
}

class CtAddress {
  @CtExpose()
  street!: string;

  @CtExpose()
  city!: string;

  @CtExpose()
  country!: string;

  @CtExpose()
  zipCode!: string;
}

class CtCompany {
  @CtExpose()
  name!: string;

  @CtExpose()
  @CtType(() => CtAddress)
  address!: CtAddress;
}

class CtNestedUser {
  @CtExpose()
  id!: number;

  @CtExpose()
  name!: string;

  @CtExpose()
  @CtType(() => CtAddress)
  homeAddress!: CtAddress;

  @CtExpose()
  @CtType(() => CtCompany)
  company!: CtCompany;
}

const nestedUserData = {
  id: 1,
  name: 'John Doe',
  homeAddress: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
    zipCode: '10001',
  },
  company: {
    name: 'Tech Corp',
    address: {
      street: '456 Business Ave',
      city: 'San Francisco',
      country: 'USA',
      zipCode: '94102',
    },
  },
};

// ============================================================================
// Scenario 3: Array Transformation (100+ objects)
// ============================================================================

const arrayUserData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  firstName: `User${i}`,
  lastName: `Last${i}`,
  email: `user${i}@example.com`,
  age: 20 + (i % 50),
  isActive: i % 2 === 0,
  createdAt: '2024-01-01T00:00:00Z',
}));

// ============================================================================
// Scenario 4: Complex Decorators (@Expose, @Exclude, @Transform)
// ============================================================================

class OmComplexUser {
  @OmExpose()
  id!: number;

  @OmExpose()
  @OmTransform(({ value }: any) => value.toUpperCase())
  name!: string;

  @OmExclude()
  password!: string;

  @OmExpose({ name: 'userEmail' })
  email!: string;

  @OmExpose()
  @OmTransform(({ value }: any) => value >= 18)
  isAdult!: boolean;
}

class CtComplexUser {
  @CtExpose()
  id!: number;

  @CtExpose()
  @CtTransform(({ value }: any) => value.toUpperCase())
  name!: string;

  @CtExclude()
  password!: string;

  @CtExpose({ name: 'userEmail' })
  email!: string;

  @CtExpose()
  @CtTransform(({ value }: any) => value >= 18)
  isAdult!: boolean;
}

const complexUserData = {
  id: 1,
  name: 'john doe',
  password: 'secret123',
  userEmail: 'john@example.com',
  isAdult: 25,
};

// ============================================================================
// Scenario 5: Serialization (Class to Plain)
// ============================================================================

const omSimpleUserInstance = omPlainToClass(OmSimpleUser, simpleUserData);
const ctSimpleUserInstance = ctPlainToClass(CtSimpleUser, simpleUserData);

// ============================================================================
// Scenario 6: Large Objects (50+ properties)
// ============================================================================

const largeObjectData: any = {};
for (let i = 0; i < 50; i++) {
  largeObjectData[`field${i}`] = `value${i}`;
}

class OmLargeObject {
  constructor() {
    for (let i = 0; i < 50; i++) {
      (this as any)[`field${i}`] = undefined;
    }
  }
}

class CtLargeObject {
  constructor() {
    for (let i = 0; i < 50; i++) {
      (this as any)[`field${i}`] = undefined;
    }
  }
}

// Apply decorators dynamically
for (let i = 0; i < 50; i++) {
  OmExpose()(OmLargeObject.prototype, `field${i}`);
  CtExpose()(CtLargeObject.prototype, `field${i}`);
}

// ============================================================================
// Benchmarks
// ============================================================================

describe('Scenario 1: Simple Transformation (5-10 properties)', () => {
  bench('om-data-mapper: plainToClass', () => {
    omPlainToClass(OmSimpleUser, simpleUserData);
  });

  bench('class-transformer: plainToClass', () => {
    ctPlainToClass(CtSimpleUser, simpleUserData);
  });
});

describe('Scenario 2: Nested Objects (2-3 levels)', () => {
  bench('om-data-mapper: plainToClass (nested)', () => {
    omPlainToClass(OmNestedUser, nestedUserData);
  });

  bench('class-transformer: plainToClass (nested)', () => {
    ctPlainToClass(CtNestedUser, nestedUserData);
  });
});

describe('Scenario 3: Array Transformation (100 objects)', () => {
  bench('om-data-mapper: plainToClass (array)', () => {
    omPlainToClass(OmSimpleUser, arrayUserData);
  });

  bench('class-transformer: plainToClass (array)', () => {
    ctPlainToClass(CtSimpleUser, arrayUserData);
  });
});

describe('Scenario 4: Complex Decorators (@Expose, @Exclude, @Transform)', () => {
  bench('om-data-mapper: plainToClass (complex)', () => {
    omPlainToClass(OmComplexUser, complexUserData);
  });

  bench('class-transformer: plainToClass (complex)', () => {
    ctPlainToClass(CtComplexUser, complexUserData);
  });
});

describe('Scenario 5: Serialization (Class → Plain)', () => {
  bench('om-data-mapper: classToPlain', () => {
    omClassToPlain(omSimpleUserInstance);
  });

  bench('class-transformer: classToPlain', () => {
    ctClassToPlain(ctSimpleUserInstance);
  });
});

describe('Scenario 6: Large Objects (50+ properties)', () => {
  bench('om-data-mapper: plainToClass (large)', () => {
    omPlainToClass(OmLargeObject, largeObjectData);
  });

  bench('class-transformer: plainToClass (large)', () => {
    ctPlainToClass(CtLargeObject, largeObjectData);
  });
});

