/**
 * Comprehensive benchmark comparing om-data-mapper's class-transformer compatibility layer
 * with the original class-transformer library
 */

import { Suite } from 'benchmark';
import 'reflect-metadata';

// Import om-data-mapper compatibility layer
import {
  plainToClass as omPlainToClass,
  classToPlain as omClassToPlain,
  Expose as OmExpose,
  Exclude as OmExclude,
  Type as OmType,
  Transform as OmTransform,
} from '../../src/class-transformer-compat';

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
  @OmTransform(({ value }) => value.toUpperCase())
  name!: string;

  @OmExclude()
  password!: string;

  @OmExpose({ name: 'userEmail' })
  email!: string;

  @OmExpose()
  @OmTransform(({ value }) => value >= 18)
  isAdult!: boolean;
}

class CtComplexUser {
  @CtExpose()
  id!: number;

  @CtExpose()
  @CtTransform(({ value }) => value.toUpperCase())
  name!: string;

  @CtExclude()
  password!: string;

  @CtExpose({ name: 'userEmail' })
  email!: string;

  @CtExpose()
  @CtTransform(({ value }) => value >= 18)
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
// Run Benchmarks
// ============================================================================

console.log('\n='.repeat(80));
console.log('CLASS-TRANSFORMER PERFORMANCE COMPARISON');
console.log('om-data-mapper compatibility layer vs original class-transformer');
console.log('='.repeat(80) + '\n');

const results: any[] = [];

// Scenario 1: Simple Transformation
console.log('Running Scenario 1: Simple Transformation (5-10 properties)...\n');
new Suite('Scenario 1: Simple Transformation')
  .add('om-data-mapper: plainToClass (simple)', function () {
    omPlainToClass(OmSimpleUser, simpleUserData);
  })
  .add('class-transformer: plainToClass (simple)', function () {
    ctPlainToClass(CtSimpleUser, simpleUserData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Simple Transformation',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 2: Nested Objects
console.log('Running Scenario 2: Nested Objects (2-3 levels)...\n');
new Suite('Scenario 2: Nested Objects')
  .add('om-data-mapper: plainToClass (nested)', function () {
    omPlainToClass(OmNestedUser, nestedUserData);
  })
  .add('class-transformer: plainToClass (nested)', function () {
    ctPlainToClass(CtNestedUser, nestedUserData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Nested Objects',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 3: Array Transformation
console.log('Running Scenario 3: Array Transformation (100 objects)...\n');
new Suite('Scenario 3: Array Transformation')
  .add('om-data-mapper: plainToClass (array)', function () {
    omPlainToClass(OmSimpleUser, arrayUserData);
  })
  .add('class-transformer: plainToClass (array)', function () {
    ctPlainToClass(CtSimpleUser, arrayUserData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Array Transformation (100 items)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 4: Complex Decorators
console.log('Running Scenario 4: Complex Decorators (@Expose, @Exclude, @Transform)...\n');
new Suite('Scenario 4: Complex Decorators')
  .add('om-data-mapper: plainToClass (complex)', function () {
    omPlainToClass(OmComplexUser, complexUserData);
  })
  .add('class-transformer: plainToClass (complex)', function () {
    ctPlainToClass(CtComplexUser, complexUserData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Complex Decorators',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 5: Serialization (Class to Plain)
console.log('Running Scenario 5: Serialization (Class → Plain)...\n');
new Suite('Scenario 5: Serialization')
  .add('om-data-mapper: classToPlain', function () {
    omClassToPlain(omSimpleUserInstance);
  })
  .add('class-transformer: classToPlain', function () {
    ctClassToPlain(ctSimpleUserInstance);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Serialization (classToPlain)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 6: Large Objects
console.log('Running Scenario 6: Large Objects (50+ properties)...\n');
new Suite('Scenario 6: Large Objects')
  .add('om-data-mapper: plainToClass (large)', function () {
    omPlainToClass(OmLargeObject, largeObjectData);
  })
  .add('class-transformer: plainToClass (large)', function () {
    ctPlainToClass(CtLargeObject, largeObjectData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const ctHz = this[1].hz;
    const improvement = ((omHz - ctHz) / ctHz) * 100;
    results.push({
      scenario: 'Large Objects (50 properties)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.table(results);

    // Calculate average improvement
    const improvements = results.map((r) => parseFloat(r.improvement));
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    console.log(`\nAverage Performance: ${avgImprovement > 0 ? avgImprovement.toFixed(2) + '% faster' : Math.abs(avgImprovement).toFixed(2) + '% slower'}`);

    // Find best and worst scenarios
    const maxImprovement = Math.max(...improvements);
    const minImprovement = Math.min(...improvements);
    const bestScenario = results.find((r) => parseFloat(r.improvement) === maxImprovement);
    const worstScenario = results.find((r) => parseFloat(r.improvement) === minImprovement);

    console.log(`\nBest Performance: ${bestScenario?.scenario} (${maxImprovement.toFixed(2)}% ${maxImprovement > 0 ? 'faster' : 'slower'})`);
    console.log(`Worst Performance: ${worstScenario?.scenario} (${minImprovement.toFixed(2)}% ${minImprovement > 0 ? 'faster' : 'slower'})`);

    console.log('\n' + '='.repeat(80) + '\n');
  })
  .run({ async: false });

