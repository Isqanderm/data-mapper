/**
 * Performance comparison between class-transformer and om-data-mapper
 *
 * This benchmark compares the two libraries across different scenarios:
 * 1. Simple object mapping (5-10 properties)
 * 2. Complex nested object mapping
 * 3. Array transformations
 * 4. Transformations with custom logic
 * 5. Exclude/Expose mix
 *
 * Run with: npm run bench:compat
 */

const Benchmark = require('benchmark');
const chalk = require('chalk');

// Import class-transformer
require('reflect-metadata');
const ct = require('class-transformer');

// Import om-data-mapper compatibility layer
const om = require('../../../build/compat/class-transformer');

// Import pre-compiled model classes
const ctModels = require('./build-ct/models-ct');
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

console.log(chalk.bold.cyan('\n🚀 om-data-mapper vs class-transformer Performance Comparison\n'));
console.log(chalk.gray('Running benchmarks... This may take a few minutes.\n'));

const results = [];

// Scenario 1: Simple Transformation
console.log(chalk.yellow('📊 Scenario 1: Simple Object Mapping (7 properties)'));
const suite1 = new Benchmark.Suite('Simple Transformation');

suite1
  .add('class-transformer', function() {
    ct.plainToClass(ctModels.SimpleUser, simpleUserData);
  })
  .add('om-data-mapper', function() {
    om.plainToClass(omModels.SimpleUser, simpleUserData);
  })
  .on('cycle', function(event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function() {
    const fastest = this.filter('fastest').map('name');
    const fastestHz = this.filter('fastest')[0].hz;
    const slowestHz = this.filter('slowest')[0].hz;
    const improvement = ((fastestHz / slowestHz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance gain: ${improvement}% faster\n`));

    results.push({
      scenario: 'Simple Transformation',
      fastest,
      improvement: parseFloat(improvement),
    });
  })
  .run();

// Scenario 2: Complex Nested Transformation
console.log(chalk.yellow('📊 Scenario 2: Complex Nested Object Mapping'));
const suite2 = new Benchmark.Suite('Complex Nested Transformation');

suite2
  .add('class-transformer', function() {
    ct.plainToClass(ctModels.ComplexUser, complexUserData);
  })
  .add('om-data-mapper', function() {
    om.plainToClass(omModels.ComplexUser, complexUserData);
  })
  .on('cycle', function(event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function() {
    const fastest = this.filter('fastest').map('name');
    const fastestHz = this.filter('fastest')[0].hz;
    const slowestHz = this.filter('slowest')[0].hz;
    const improvement = ((fastestHz / slowestHz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance gain: ${improvement}% faster\n`));

    results.push({
      scenario: 'Complex Nested Transformation',
      fastest,
      improvement: parseFloat(improvement),
    });
  })
  .run();

// Scenario 3: Array Transformation
console.log(chalk.yellow('📊 Scenario 3: Array Transformation (100 items)'));
const suite3 = new Benchmark.Suite('Array Transformation');

suite3
  .add('class-transformer', function() {
    ct.plainToClass(ctModels.Product, productsArray);
  })
  .add('om-data-mapper', function() {
    om.plainToClass(omModels.Product, productsArray);
  })
  .on('cycle', function(event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function() {
    const fastest = this.filter('fastest').map('name');
    const fastestHz = this.filter('fastest')[0].hz;
    const slowestHz = this.filter('slowest')[0].hz;
    const improvement = ((fastestHz / slowestHz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance gain: ${improvement}% faster\n`));

    results.push({
      scenario: 'Array Transformation',
      fastest,
      improvement: parseFloat(improvement),
    });
  })
  .run();

// Scenario 4: Transformation with Custom Logic
console.log(chalk.yellow('📊 Scenario 4: Transformation with Custom Logic'));
const suite4 = new Benchmark.Suite('Custom Transformation');

suite4
  .add('class-transformer', function() {
    ct.plainToClass(ctModels.TransformUser, transformUserData);
  })
  .add('om-data-mapper', function() {
    om.plainToClass(omModels.TransformUser, transformUserData);
  })
  .on('cycle', function(event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function() {
    const fastest = this.filter('fastest').map('name');
    const fastestHz = this.filter('fastest')[0].hz;
    const slowestHz = this.filter('slowest')[0].hz;
    const improvement = ((fastestHz / slowestHz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance gain: ${improvement}% faster\n`));

    results.push({
      scenario: 'Custom Transformation',
      fastest,
      improvement: parseFloat(improvement),
    });
  })
  .run();

// Scenario 5: Exclude/Expose Mix
console.log(chalk.yellow('📊 Scenario 5: Exclude/Expose Mix'));
const suite5 = new Benchmark.Suite('Exclude/Expose');

suite5
  .add('class-transformer', function() {
    const user = ct.plainToClass(ctModels.SecureUser, secureUserData);
    ct.classToPlain(user);
  })
  .add('om-data-mapper', function() {
    const user = om.plainToClass(omModels.SecureUser, secureUserData);
    om.classToPlain(user);
  })
  .on('cycle', function(event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function() {
    const fastest = this.filter('fastest').map('name');
    const fastestHz = this.filter('fastest')[0].hz;
    const slowestHz = this.filter('slowest')[0].hz;
    const improvement = ((fastestHz / slowestHz - 1) * 100).toFixed(2);

    console.log(chalk.green(`  ✓ Fastest: ${fastest}`));
    console.log(chalk.cyan(`  ⚡ Performance gain: ${improvement}% faster\n`));

    results.push({
      scenario: 'Exclude/Expose',
      fastest,
      improvement: parseFloat(improvement),
    });
  })
  .run();

// ============================================================================
// Summary
// ============================================================================

console.log(chalk.bold.cyan('\n📈 Summary\n'));
console.log(chalk.bold('┌─────────────────────────────────────────┬──────────────┬─────────────────┐'));
console.log(chalk.bold('│ Scenario                                │ Winner       │ Performance     │'));
console.log(chalk.bold('├─────────────────────────────────────────┼──────────────┼─────────────────┤'));

results.forEach(result => {
  const scenario = result.scenario.padEnd(39);
  const winnerPadded = result.fastest[0].padEnd(12);
  const perf = result.fastest[0] === 'om-data-mapper'
    ? chalk.green(`+${result.improvement.toFixed(2)}% faster`)
    : chalk.red(`-${result.improvement.toFixed(2)}% slower`);

  console.log(`│ ${scenario} │ ${winnerPadded} │ ${perf.padEnd(15)} │`);
});

console.log(chalk.bold('└─────────────────────────────────────────┴──────────────┴─────────────────┘\n'));

const omWins = results.filter(r => r.fastest[0] === 'om-data-mapper').length;
const avgImprovement = results
  .filter(r => r.fastest[0] === 'om-data-mapper')
  .reduce((sum, r) => sum + r.improvement, 0) / (omWins || 1);

if (omWins > 0) {
  console.log(chalk.green.bold(`✨ om-data-mapper won ${omWins}/${results.length} scenarios`));
  console.log(chalk.cyan(`⚡ Average performance improvement: ${avgImprovement.toFixed(2)}%\n`));
} else {
  console.log(chalk.yellow.bold(`⚠️  class-transformer performed better in all scenarios\n`));
}

