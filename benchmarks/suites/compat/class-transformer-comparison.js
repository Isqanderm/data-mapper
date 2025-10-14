/**
 * Standalone benchmark runner comparing om-data-mapper with class-transformer
 * Run with: node bench/class-transformer-comparison-runner.js
 */

const Benchmark = require('benchmark');
require('reflect-metadata');

// Import om-data-mapper compatibility layer
const {
  plainToClass: omPlainToClass,
  classToPlain: omClassToPlain,
  Expose: OmExpose,
  Exclude: OmExclude,
  Type: OmType,
  Transform: OmTransform,
} = require('../../../build/compat/class-transformer/index.js');

// Import original class-transformer
const {
  plainToClass: ctPlainToClass,
  classToPlain: ctClassToPlain,
  Expose: CtExpose,
  Exclude: CtExclude,
  Type: CtType,
  Transform: CtTransform,
} = require('class-transformer');

// ============================================================================
// Scenario 1: Simple Transformation (5-10 properties)
// ============================================================================

class OmSimpleUser {
  id;
  firstName;
  lastName;
  email;
  age;
  isActive;
  createdAt;
}

// Apply decorators
OmExpose()(OmSimpleUser.prototype, 'id');
OmExpose()(OmSimpleUser.prototype, 'firstName');
OmExpose()(OmSimpleUser.prototype, 'lastName');
OmExpose()(OmSimpleUser.prototype, 'email');
OmExpose()(OmSimpleUser.prototype, 'age');
OmExpose()(OmSimpleUser.prototype, 'isActive');
OmExpose()(OmSimpleUser.prototype, 'createdAt');

class CtSimpleUser {
  id;
  firstName;
  lastName;
  email;
  age;
  isActive;
  createdAt;
}

CtExpose()(CtSimpleUser.prototype, 'id');
CtExpose()(CtSimpleUser.prototype, 'firstName');
CtExpose()(CtSimpleUser.prototype, 'lastName');
CtExpose()(CtSimpleUser.prototype, 'email');
CtExpose()(CtSimpleUser.prototype, 'age');
CtExpose()(CtSimpleUser.prototype, 'isActive');
CtExpose()(CtSimpleUser.prototype, 'createdAt');

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
// Scenario 2: Nested Objects
// ============================================================================

class OmAddress {
  street;
  city;
  country;
  zipCode;
}

OmExpose()(OmAddress.prototype, 'street');
OmExpose()(OmAddress.prototype, 'city');
OmExpose()(OmAddress.prototype, 'country');
OmExpose()(OmAddress.prototype, 'zipCode');

class OmCompany {
  name;
  address;
}

OmExpose()(OmCompany.prototype, 'name');
OmExpose()(OmCompany.prototype, 'address');
OmType(() => OmAddress)(OmCompany.prototype, 'address');

class OmNestedUser {
  id;
  name;
  homeAddress;
  company;
}

OmExpose()(OmNestedUser.prototype, 'id');
OmExpose()(OmNestedUser.prototype, 'name');
OmExpose()(OmNestedUser.prototype, 'homeAddress');
OmType(() => OmAddress)(OmNestedUser.prototype, 'homeAddress');
OmExpose()(OmNestedUser.prototype, 'company');
OmType(() => OmCompany)(OmNestedUser.prototype, 'company');

class CtAddress {
  street;
  city;
  country;
  zipCode;
}

CtExpose()(CtAddress.prototype, 'street');
CtExpose()(CtAddress.prototype, 'city');
CtExpose()(CtAddress.prototype, 'country');
CtExpose()(CtAddress.prototype, 'zipCode');

class CtCompany {
  name;
  address;
}

CtExpose()(CtCompany.prototype, 'name');
CtExpose()(CtCompany.prototype, 'address');
CtType(() => CtAddress)(CtCompany.prototype, 'address');

class CtNestedUser {
  id;
  name;
  homeAddress;
  company;
}

CtExpose()(CtNestedUser.prototype, 'id');
CtExpose()(CtNestedUser.prototype, 'name');
CtExpose()(CtNestedUser.prototype, 'homeAddress');
CtType(() => CtAddress)(CtNestedUser.prototype, 'homeAddress');
CtExpose()(CtNestedUser.prototype, 'company');
CtType(() => CtCompany)(CtNestedUser.prototype, 'company');

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
// Scenario 3: Array Transformation
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
// Scenario 4: Complex Decorators
// ============================================================================

class OmComplexUser {
  id;
  name;
  password;
  email;
  isAdult;
}

OmExpose()(OmComplexUser.prototype, 'id');
OmExpose()(OmComplexUser.prototype, 'name');
OmTransform(({ value }) => value.toUpperCase())(OmComplexUser.prototype, 'name');
OmExclude()(OmComplexUser.prototype, 'password');
OmExpose({ name: 'userEmail' })(OmComplexUser.prototype, 'email');
OmExpose()(OmComplexUser.prototype, 'isAdult');
OmTransform(({ value }) => value >= 18)(OmComplexUser.prototype, 'isAdult');

class CtComplexUser {
  id;
  name;
  password;
  email;
  isAdult;
}

CtExpose()(CtComplexUser.prototype, 'id');
CtExpose()(CtComplexUser.prototype, 'name');
CtTransform(({ value }) => value.toUpperCase())(CtComplexUser.prototype, 'name');
CtExclude()(CtComplexUser.prototype, 'password');
CtExpose({ name: 'userEmail' })(CtComplexUser.prototype, 'email');
CtExpose()(CtComplexUser.prototype, 'isAdult');
CtTransform(({ value }) => value >= 18)(CtComplexUser.prototype, 'isAdult');

const complexUserData = {
  id: 1,
  name: 'john doe',
  password: 'secret123',
  userEmail: 'john@example.com',
  isAdult: 25,
};

// ============================================================================
// Scenario 5: Serialization
// ============================================================================

const omSimpleUserInstance = omPlainToClass(OmSimpleUser, simpleUserData);
const ctSimpleUserInstance = ctPlainToClass(CtSimpleUser, simpleUserData);

// ============================================================================
// Scenario 6: Large Objects
// ============================================================================

const largeObjectData = {};
for (let i = 0; i < 50; i++) {
  largeObjectData[`field${i}`] = `value${i}`;
}

class OmLargeObject {}
class CtLargeObject {}

for (let i = 0; i < 50; i++) {
  OmExpose()(OmLargeObject.prototype, `field${i}`);
  CtExpose()(CtLargeObject.prototype, `field${i}`);
}

// ============================================================================
// Run Benchmarks
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('CLASS-TRANSFORMER PERFORMANCE COMPARISON');
console.log('om-data-mapper compatibility layer vs original class-transformer');
console.log('='.repeat(80) + '\n');

const results = [];

function runScenario(name, omFn, ctFn, onComplete) {
  console.log(`Running ${name}...\n`);

  const suite = new Benchmark.Suite();

  suite
    .add('om-data-mapper', omFn)
    .add('class-transformer', ctFn)
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const omHz = this[0].hz;
      const ctHz = this[1].hz;
      const improvement = ((omHz - ctHz) / ctHz) * 100;

      results.push({
        scenario: name,
        omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
        classTransformer: Math.round(ctHz).toLocaleString() + ' ops/sec',
        improvement: improvement.toFixed(2) + '%',
      });

      console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);

      if (onComplete) onComplete();
    })
    .run({ async: false });
}

// Run all scenarios sequentially
runScenario(
  'Scenario 1: Simple Transformation',
  () => omPlainToClass(OmSimpleUser, simpleUserData),
  () => ctPlainToClass(CtSimpleUser, simpleUserData),
  () => {
    runScenario(
      'Scenario 2: Nested Objects',
      () => omPlainToClass(OmNestedUser, nestedUserData),
      () => ctPlainToClass(CtNestedUser, nestedUserData),
      () => {
        runScenario(
          'Scenario 3: Array Transformation (100 items)',
          () => omPlainToClass(OmSimpleUser, arrayUserData),
          () => ctPlainToClass(CtSimpleUser, arrayUserData),
          () => {
            runScenario(
              'Scenario 4: Complex Decorators',
              () => omPlainToClass(OmComplexUser, complexUserData),
              () => ctPlainToClass(CtComplexUser, complexUserData),
              () => {
                runScenario(
                  'Scenario 5: Serialization (classToPlain)',
                  () => omClassToPlain(omSimpleUserInstance),
                  () => ctClassToPlain(ctSimpleUserInstance),
                  () => {
                    runScenario(
                      'Scenario 6: Large Objects (50 properties)',
                      () => omPlainToClass(OmLargeObject, largeObjectData),
                      () => ctPlainToClass(CtLargeObject, largeObjectData),
                      () => {
                        // Print summary
                        console.log('\n' + '='.repeat(80));
                        console.log('SUMMARY');
                        console.log('='.repeat(80) + '\n');
                        console.table(results);

                        // Calculate statistics
                        const improvements = results.map((r) => parseFloat(r.improvement));
                        const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
                        const maxImprovement = Math.max(...improvements);
                        const minImprovement = Math.min(...improvements);
                        const bestScenario = results.find((r) => parseFloat(r.improvement) === maxImprovement);
                        const worstScenario = results.find((r) => parseFloat(r.improvement) === minImprovement);

                        console.log(`\nAverage Performance: ${avgImprovement > 0 ? avgImprovement.toFixed(2) + '% faster' : Math.abs(avgImprovement).toFixed(2) + '% slower'}`);
                        console.log(`Best Performance: ${bestScenario?.scenario} (${maxImprovement.toFixed(2)}% ${maxImprovement > 0 ? 'faster' : 'slower'})`);
                        console.log(`Worst Performance: ${worstScenario?.scenario} (${minImprovement.toFixed(2)}% ${minImprovement > 0 ? 'faster' : 'slower'})`);
                        console.log('\n' + '='.repeat(80) + '\n');
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

