/**
 * Performance comparison between class-transformer and om-data-mapper
 * Outputs results in JSON format for github-action-benchmark
 *
 * Run with: node benchmarks/suites/compat/comparison-json.js
 */

const Benchmark = require('benchmark');

// Import class-transformer
require('reflect-metadata');

// Import om-data-mapper compatibility layer
const om = require('../../../build/compat/class-transformer');

// Import pre-compiled model classes
const omModels = require('./models-om');

// ============================================================================
// Test Data
// ============================================================================

const simpleUserData = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  age: 30,
  isActive: true,
  role: 'admin',
};

const complexUserData = {
  id: 1,
  name: 'John Doe',
  homeAddress: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
    zipCode: '10001',
  },
  company: {
    name: 'Acme Corp',
    address: {
      street: '456 Business Ave',
      city: 'San Francisco',
      country: 'USA',
      zipCode: '94102',
    },
  },
};

const productsArray = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.random() * 1000,
  inStock: Math.random() > 0.5,
}));

const transformUserData = {
  id: 1,
  name: 'john doe',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: '2024-01-01T00:00:00.000Z',
  password: 'secret123',
};

const secureUserData = {
  id: 1,
  username: 'johndoe',
  password: 'secret123',
  secretKey: 'abc-def-ghi',
  email: 'john@example.com',
  role: 'admin',
};

// ============================================================================
// Benchmark Suites
// ============================================================================

const results = [];
let completedSuites = 0;
const totalSuites = 5;

function checkComplete() {
  completedSuites++;
  if (completedSuites === totalSuites) {
    // Output results in github-action-benchmark compatible format
    // The action expects an array of objects with 'name', 'unit', and 'value' fields
    const formattedResults = results.map(r => ({
      name: r.name,
      unit: 'ops/sec',
      value: r.ops
    }));
    console.log(JSON.stringify(formattedResults, null, 2));
  }
}

// Scenario 1: Simple Transformation
const suite1 = new Benchmark.Suite('Simple Transformation');

suite1
  .add('om-data-mapper: Simple Object Mapping', function () {
    om.plainToClass(omModels.SimpleUser, simpleUserData);
  })
  .on('cycle', function (event) {
    const bench = event.target;
    results.push({
      name: bench.name,
      ops: bench.hz,
      margin: bench.stats.rme,
      samples: bench.stats.sample.length,
    });
  })
  .on('complete', checkComplete)
  .run({ async: false });

// Scenario 2: Complex Nested Transformation
const suite2 = new Benchmark.Suite('Complex Nested Transformation');

suite2
  .add('om-data-mapper: Complex Nested Object', function () {
    om.plainToClass(omModels.ComplexUser, complexUserData);
  })
  .on('cycle', function (event) {
    const bench = event.target;
    results.push({
      name: bench.name,
      ops: bench.hz,
      margin: bench.stats.rme,
      samples: bench.stats.sample.length,
    });
  })
  .on('complete', checkComplete)
  .run({ async: false });

// Scenario 3: Array Transformation
const suite3 = new Benchmark.Suite('Array Transformation');

suite3
  .add('om-data-mapper: Array (100 items)', function () {
    om.plainToClass(omModels.Product, productsArray);
  })
  .on('cycle', function (event) {
    const bench = event.target;
    results.push({
      name: bench.name,
      ops: bench.hz,
      margin: bench.stats.rme,
      samples: bench.stats.sample.length,
    });
  })
  .on('complete', checkComplete)
  .run({ async: false });

// Scenario 4: Transformation with Custom Logic
const suite4 = new Benchmark.Suite('Custom Transformation');

suite4
  .add('om-data-mapper: Custom Logic', function () {
    om.plainToClass(omModels.TransformUser, transformUserData);
  })
  .on('cycle', function (event) {
    const bench = event.target;
    results.push({
      name: bench.name,
      ops: bench.hz,
      margin: bench.stats.rme,
      samples: bench.stats.sample.length,
    });
  })
  .on('complete', checkComplete)
  .run({ async: false });

// Scenario 5: Exclude/Expose Mix
const suite5 = new Benchmark.Suite('Exclude/Expose');

suite5
  .add('om-data-mapper: Exclude/Expose', function () {
    const user = om.plainToClass(omModels.SecureUser, secureUserData);
    om.classToPlain(user);
  })
  .on('cycle', function (event) {
    const bench = event.target;
    results.push({
      name: bench.name,
      ops: bench.hz,
      margin: bench.stats.rme,
      samples: bench.stats.sample.length,
    });
  })
  .on('complete', checkComplete)
  .run({ async: false });
