/**
 * Performance comparison between class-validator and om-data-mapper/class-validator-compat
 *
 * This benchmark compares the two libraries across different validation scenarios:
 * 1. Simple DTO with string validators
 * 2. DTO with number validators
 * 3. DTO with mixed validators and optional fields
 * 4. Complex DTO with 10+ properties
 * 5. First-time validation (including JIT compilation overhead)
 * 6. Repeated validation (cached JIT validator)
 *
 * Run with: npm run bench:validation
 */

const Benchmark = require('benchmark');
const chalk = require('chalk');

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

// Valid data
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

// Invalid data (for testing error handling)
const simpleUserDataInvalid = {
  name: 'Jo', // Too short
  email: 'invalid-email',
  password: 'short', // Too short
};

const complexUserDataInvalid = {
  username: 'jd', // Too short
  email: 'invalid',
  password: 'short',
  firstName: 'J',
  lastName: 'D',
  age: 15, // Too young
  country: '',
  city: '',
  isActive: 'yes', // Wrong type
  emailVerified: 'no', // Wrong type
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
// Benchmark Suites
// ============================================================================

console.log(chalk.bold.cyan('\n🚀 om-data-mapper vs class-validator Performance Comparison\n'));
console.log(chalk.gray('Running validation benchmarks... This may take a few minutes.\n'));

const results = [];

// Scenario 1: Simple DTO Validation (Valid Data)
console.log(chalk.yellow('📊 Scenario 1: Simple DTO Validation (3 properties, valid data)'));
const suite1 = new Benchmark.Suite('Simple DTO - Valid');

suite1
  .add('class-validator', {
    defer: true,
    fn: function (deferred) {
      const instance = createCvInstance(cvModels.SimpleUserDto, simpleUserDataValid);
      cv.validate(instance).then(() => deferred.resolve());
    },
  })
  .add('om-data-mapper', {
    defer: true,
    fn: function (deferred) {
      const instance = createOmInstance(omModels.SimpleUserDto, simpleUserDataValid);
      om.validate(instance).then(() => deferred.resolve());
    },
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const slowest = this.filter('slowest').map('name');
    const fastestBench = this.filter('fastest')[0];
    const slowestBench = this.filter('slowest')[0];
    const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

    results.push({
      scenario: 'Simple DTO - Valid',
      fastest: fastest[0],
      improvement: `${improvement}%`,
      cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
      omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
    });
  })
  .run({ async: true });

// Scenario 2: Simple DTO Validation (Invalid Data)
setTimeout(() => {
  console.log(chalk.yellow('📊 Scenario 2: Simple DTO Validation (3 properties, invalid data)'));
  const suite2 = new Benchmark.Suite('Simple DTO - Invalid');

  suite2
    .add('class-validator', {
      defer: true,
      fn: function (deferred) {
        const instance = createCvInstance(cvModels.SimpleUserDto, simpleUserDataInvalid);
        cv.validate(instance).then(() => deferred.resolve());
      },
    })
    .add('om-data-mapper', {
      defer: true,
      fn: function (deferred) {
        const instance = createOmInstance(omModels.SimpleUserDto, simpleUserDataInvalid);
        om.validate(instance).then(() => deferred.resolve());
      },
    })
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const fastest = this.filter('fastest').map('name');
      const slowest = this.filter('slowest').map('name');
      const fastestBench = this.filter('fastest')[0];
      const slowestBench = this.filter('slowest')[0];
      const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

      console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
      console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

      results.push({
        scenario: 'Simple DTO - Invalid',
        fastest: fastest[0],
        improvement: `${improvement}%`,
        cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
        omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
      });
    })
    .run({ async: true });
}, 100);

// Scenario 3: Product DTO Validation (Number validators)
setTimeout(() => {
  console.log(chalk.yellow('📊 Scenario 3: Product DTO Validation (4 properties, number validators)'));
  const suite3 = new Benchmark.Suite('Product DTO');

  suite3
    .add('class-validator', {
      defer: true,
      fn: function (deferred) {
        const instance = createCvInstance(cvModels.ProductDto, productDataValid);
        cv.validate(instance).then(() => deferred.resolve());
      },
    })
    .add('om-data-mapper', {
      defer: true,
      fn: function (deferred) {
        const instance = createOmInstance(omModels.ProductDto, productDataValid);
        om.validate(instance).then(() => deferred.resolve());
      },
    })
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const fastest = this.filter('fastest').map('name');
      const slowest = this.filter('slowest').map('name');
      const fastestBench = this.filter('fastest')[0];
      const slowestBench = this.filter('slowest')[0];
      const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

      console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
      console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

      results.push({
        scenario: 'Product DTO',
        fastest: fastest[0],
        improvement: `${improvement}%`,
        cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
        omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
      });
    })
    .run({ async: true });
}, 200);

// Scenario 4: Mixed DTO Validation (Optional fields)
setTimeout(() => {
  console.log(chalk.yellow('📊 Scenario 4: Mixed DTO Validation (6 properties, optional fields)'));
  const suite4 = new Benchmark.Suite('Mixed DTO');

  suite4
    .add('class-validator', {
      defer: true,
      fn: function (deferred) {
        const instance = createCvInstance(cvModels.MixedDto, mixedDataValid);
        cv.validate(instance).then(() => deferred.resolve());
      },
    })
    .add('om-data-mapper', {
      defer: true,
      fn: function (deferred) {
        const instance = createOmInstance(omModels.MixedDto, mixedDataValid);
        om.validate(instance).then(() => deferred.resolve());
      },
    })
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const fastest = this.filter('fastest').map('name');
      const slowest = this.filter('slowest').map('name');
      const fastestBench = this.filter('fastest')[0];
      const slowestBench = this.filter('slowest')[0];
      const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

      console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
      console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

      results.push({
        scenario: 'Mixed DTO',
        fastest: fastest[0],
        improvement: `${improvement}%`,
        cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
        omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
      });
    })
    .run({ async: true });
}, 300);

// Scenario 5: Complex DTO Validation (10+ properties)
setTimeout(() => {
  console.log(chalk.yellow('📊 Scenario 5: Complex DTO Validation (14 properties)'));
  const suite5 = new Benchmark.Suite('Complex DTO - Valid');

  suite5
    .add('class-validator', {
      defer: true,
      fn: function (deferred) {
        const instance = createCvInstance(cvModels.ComplexUserDto, complexUserDataValid);
        cv.validate(instance).then(() => deferred.resolve());
      },
    })
    .add('om-data-mapper', {
      defer: true,
      fn: function (deferred) {
        const instance = createOmInstance(omModels.ComplexUserDto, complexUserDataValid);
        om.validate(instance).then(() => deferred.resolve());
      },
    })
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const fastest = this.filter('fastest').map('name');
      const slowest = this.filter('slowest').map('name');
      const fastestBench = this.filter('fastest')[0];
      const slowestBench = this.filter('slowest')[0];
      const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

      console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
      console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

      results.push({
        scenario: 'Complex DTO - Valid',
        fastest: fastest[0],
        improvement: `${improvement}%`,
        cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
        omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
      });
    })
    .run({ async: true });
}, 400);

// Scenario 6: Complex DTO Validation (Invalid data)
setTimeout(() => {
  console.log(chalk.yellow('📊 Scenario 6: Complex DTO Validation (14 properties, invalid data)'));
  const suite6 = new Benchmark.Suite('Complex DTO - Invalid');

  suite6
    .add('class-validator', {
      defer: true,
      fn: function (deferred) {
        const instance = createCvInstance(cvModels.ComplexUserDto, complexUserDataInvalid);
        cv.validate(instance).then(() => deferred.resolve());
      },
    })
    .add('om-data-mapper', {
      defer: true,
      fn: function (deferred) {
        const instance = createOmInstance(omModels.ComplexUserDto, complexUserDataInvalid);
        om.validate(instance).then(() => deferred.resolve());
      },
    })
    .on('cycle', function (event) {
      console.log('  ' + String(event.target));
    })
    .on('complete', function () {
      const fastest = this.filter('fastest').map('name');
      const slowest = this.filter('slowest').map('name');
      const fastestBench = this.filter('fastest')[0];
      const slowestBench = this.filter('slowest')[0];
      const improvement = ((fastestBench.hz / slowestBench.hz - 1) * 100).toFixed(2);

      console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
      console.log(chalk.cyan(`  ⚡ Performance improvement: ${improvement}%\n`));

      results.push({
        scenario: 'Complex DTO - Invalid',
        fastest: fastest[0],
        improvement: `${improvement}%`,
        cvOps: slowest[0] === 'class-validator' ? slowestBench.hz : fastestBench.hz,
        omOps: fastest[0] === 'om-data-mapper' ? fastestBench.hz : slowestBench.hz,
      });

      // Print summary after all benchmarks complete
      setTimeout(() => printSummary(), 100);
    })
    .run({ async: true });
}, 500);

// ============================================================================
// Summary
// ============================================================================

function printSummary() {
  console.log(chalk.bold.cyan('\n📈 Performance Summary\n'));
  console.log(chalk.gray('─'.repeat(80)));

  results.forEach((result) => {
    console.log(chalk.bold(`\n${result.scenario}:`));
    console.log(`  Fastest: ${chalk.green(result.fastest)}`);
    console.log(`  Improvement: ${chalk.cyan(result.improvement)}`);
    console.log(`  class-validator: ${chalk.yellow(result.cvOps.toFixed(0))} ops/sec`);
    console.log(`  om-data-mapper: ${chalk.green(result.omOps.toFixed(0))} ops/sec`);
  });

  console.log(chalk.gray('\n' + '─'.repeat(80)));

  // Calculate average improvement
  const omWins = results.filter((r) => r.fastest === 'om-data-mapper').length;
  const cvWins = results.filter((r) => r.fastest === 'class-validator').length;

  console.log(chalk.bold.cyan('\n🏆 Overall Results:\n'));
  console.log(`  om-data-mapper wins: ${chalk.green(omWins)} scenarios`);
  console.log(`  class-validator wins: ${chalk.yellow(cvWins)} scenarios`);

  if (omWins > cvWins) {
    console.log(chalk.bold.green('\n✨ om-data-mapper is the overall winner!\n'));
  } else if (cvWins > omWins) {
    console.log(chalk.bold.yellow('\n⚠️  class-validator is the overall winner.\n'));
  } else {
    console.log(chalk.bold.cyan('\n🤝 It\'s a tie!\n'));
  }
}

