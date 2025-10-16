/**
 * Performance comparison between class-validator and om-data-mapper/class-validator-compat
 * JSON output version for CI/CD integration
 *
 * Run with: npm run bench:validation:json
 */

const Benchmark = require('benchmark');

// Import class-validator
require('reflect-metadata');
const cv = require('class-validator');

// Import om-data-mapper validation compatibility layer
const om = require('../../../build/compat/class-validator');

// Import pre-compiled model classes
const cvModels = require('./build-cv/models-validation-cv');
const omModels = require('./build-om-validation/models-validation-om');

// ============================================================================
// Test Data
// ============================================================================

const simpleUserDataValid = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'secret123',
};

const productDataValid = {
  name: 'Laptop',
  price: 999.99,
  quantity: 10,
  inStock: true,
};

const mixedDataValid = {
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Smith',
  age: 30,
  email: 'john.doe@example.com',
  phone: '+1234567890',
};

const complexUserDataValid = {
  username: 'johndoe',
  email: 'john.doe@example.com',
  password: 'secret123',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Smith',
  age: 30,
  country: 'USA',
  city: 'New York',
  address: '123 Main St',
  phone: '+1234567890',
  isActive: true,
  emailVerified: true,
  bio: 'Software developer',
};

const simpleUserDataInvalid = {
  name: 'Jo',
  email: 'invalid-email',
  password: 'short',
};

const complexUserDataInvalid = {
  username: 'jd',
  email: 'invalid',
  password: 'short',
  firstName: 'J',
  lastName: 'D',
  age: 15,
  country: '',
  city: '',
  isActive: 'yes',
  emailVerified: 'no',
};

// ============================================================================
// Helper Functions
// ============================================================================

function createCvInstance(Model, data) {
  const instance = new Model();
  Object.assign(instance, data);
  return instance;
}

function createOmInstance(Model, data) {
  const instance = new Model();
  Object.assign(instance, data);
  return instance;
}

// ============================================================================
// Benchmark Execution
// ============================================================================

const results = [];
let completedSuites = 0;
const totalSuites = 6;

function runBenchmark(name, cvFn, omFn, data, Model) {
  return new Promise((resolve) => {
    const suite = new Benchmark.Suite(name);

    suite
      .add('class-validator', {
        defer: true,
        fn: function (deferred) {
          cvFn(Model, data).then(() => deferred.resolve());
        },
      })
      .add('om-data-mapper', {
        defer: true,
        fn: function (deferred) {
          omFn(Model, data).then(() => deferred.resolve());
        },
      })
      .on('complete', function () {
        const cvBench = this.filter((b) => b.name === 'class-validator')[0];
        const omBench = this.filter((b) => b.name === 'om-data-mapper')[0];

        results.push({
          name,
          'class-validator': {
            ops: cvBench.hz,
            rme: cvBench.stats.rme,
            samples: cvBench.stats.sample.length,
          },
          'om-data-mapper': {
            ops: omBench.hz,
            rme: omBench.stats.rme,
            samples: omBench.stats.sample.length,
          },
          improvement: ((omBench.hz / cvBench.hz - 1) * 100).toFixed(2) + '%',
          winner: omBench.hz > cvBench.hz ? 'om-data-mapper' : 'class-validator',
        });

        completedSuites++;
        if (completedSuites === totalSuites) {
          outputResults();
        }
        resolve();
      })
      .run({ async: true });
  });
}

async function runAllBenchmarks() {
  await runBenchmark(
    'Simple DTO - Valid',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    simpleUserDataValid,
    { cv: cvModels.SimpleUserDto, om: omModels.SimpleUserDto },
  );

  await runBenchmark(
    'Simple DTO - Invalid',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    simpleUserDataInvalid,
    { cv: cvModels.SimpleUserDto, om: omModels.SimpleUserDto },
  );

  await runBenchmark(
    'Product DTO',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    productDataValid,
    { cv: cvModels.ProductDto, om: omModels.ProductDto },
  );

  await runBenchmark(
    'Mixed DTO',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    mixedDataValid,
    { cv: cvModels.MixedDto, om: omModels.MixedDto },
  );

  await runBenchmark(
    'Complex DTO - Valid',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    complexUserDataValid,
    { cv: cvModels.ComplexUserDto, om: omModels.ComplexUserDto },
  );

  await runBenchmark(
    'Complex DTO - Invalid',
    (Model, data) => {
      const instance = createCvInstance(Model, data);
      return cv.validate(instance);
    },
    (Model, data) => {
      const instance = createOmInstance(Model, data);
      return om.validate(instance);
    },
    complexUserDataInvalid,
    { cv: cvModels.ComplexUserDto, om: omModels.ComplexUserDto },
  );
}

function outputResults() {
  const output = {
    name: 'class-validator vs om-data-mapper/class-validator-compat',
    date: new Date().toISOString(),
    results,
    summary: {
      totalScenarios: results.length,
      omWins: results.filter((r) => r.winner === 'om-data-mapper').length,
      cvWins: results.filter((r) => r.winner === 'class-validator').length,
      averageImprovement:
        results.reduce((sum, r) => sum + parseFloat(r.improvement), 0) / results.length + '%',
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

// Run benchmarks
runAllBenchmarks().catch(console.error);

