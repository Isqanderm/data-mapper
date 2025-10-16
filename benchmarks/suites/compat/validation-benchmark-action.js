/**
 * Performance comparison for GitHub Action Benchmark
 * Outputs benchmark results in the format expected by benchmark-action/github-action-benchmark
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

function runBenchmark(name, cvFn, omFn, data, cvModel, omModel) {
  return new Promise((resolve) => {
    const suite = new Benchmark.Suite(name);

    suite
      .add('class-validator', {
        defer: true,
        fn: function (deferred) {
          cvFn(cvModel, data).then(() => deferred.resolve());
        },
      })
      .add('om-data-mapper', {
        defer: true,
        fn: function (deferred) {
          omFn(omModel, data).then(() => deferred.resolve());
        },
      })
      .on('complete', function () {
        const cvBench = this.filter((b) => b.name === 'class-validator')[0];
        const omBench = this.filter((b) => b.name === 'om-data-mapper')[0];

        // Store om-data-mapper result for benchmark-action
        results.push({
          name: `${name} (om-data-mapper)`,
          unit: 'ops/sec',
          value: omBench.hz,
          range: omBench.stats.rme.toFixed(2),
          extra: `vs class-validator: ${((omBench.hz / cvBench.hz - 1) * 100).toFixed(2)}% faster\nSamples: ${omBench.stats.sample.length}\nclass-validator: ${cvBench.hz.toFixed(2)} ops/sec`,
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
    cvModels.SimpleUserDto,
    omModels.SimpleUserDto,
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
    cvModels.SimpleUserDto,
    omModels.SimpleUserDto,
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
    cvModels.ProductDto,
    omModels.ProductDto,
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
    cvModels.MixedDto,
    omModels.MixedDto,
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
    cvModels.ComplexUserDto,
    omModels.ComplexUserDto,
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
    cvModels.ComplexUserDto,
    omModels.ComplexUserDto,
  );
}

function outputResults() {
  // Output in format expected by benchmark-action/github-action-benchmark
  // with tool: 'customBiggerIsBetter'
  console.log(JSON.stringify(results, null, 2));
}

// Run benchmarks
runAllBenchmarks().catch(console.error);

