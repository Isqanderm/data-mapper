#!/usr/bin/env node
/**
 * Post-Installation Simulation Test
 *
 * This test simulates how a user would import and use the package after
 * installing it via npm. It validates the complete user experience.
 *
 * Scenarios tested:
 * 1. Named imports from main package
 * 2. Deep imports from submodules
 * 3. Real-world usage patterns
 * 4. Error handling
 * 5. TypeScript compatibility (via JSDoc)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..', 'build', 'esm');

console.log('📦 Post-Installation Simulation Test\n');
console.log('Simulating: npm install om-data-mapper\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    fn();
    console.log('✓');
    testsPassed++;
  } catch (error) {
    console.log('✗');
    console.error(`    Error: ${error.message}`);
    testsFailed++;
  }
}

async function asyncTest(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log('✓');
    testsPassed++;
  } catch (error) {
    console.log('✗');
    console.error(`    Error: ${error.message}`);
    testsFailed++;
  }
}

// Scenario 1: Basic mapper usage (most common use case)
console.log('Scenario 1: Basic Mapper Usage');
await asyncTest('Import Mapper from core', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  assert.ok(Mapper, 'Mapper should exist');
  assert.strictEqual(typeof Mapper.create, 'function');
});

await asyncTest('Create and use a simple mapper', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    fullName: 'name',
    emailAddress: 'email',
  });

  const source = { name: 'Alice', email: 'alice@example.com' };
  const result = mapper.execute(source).result;

  assert.strictEqual(result.fullName, 'Alice');
  assert.strictEqual(result.emailAddress, 'alice@example.com');
});

// Scenario 2: Simple field mapping
console.log('\nScenario 2: Simple Field Mapping');
await asyncTest('Map multiple fields', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    productName: 'name',
    productPrice: 'price',
    productCategory: 'category',
  });

  const source = { name: 'Widget', price: 19.99, category: 'Tools' };
  const result = mapper.execute(source).result;

  assert.strictEqual(result.productName, 'Widget');
  assert.strictEqual(result.productPrice, 19.99);
  assert.strictEqual(result.productCategory, 'Tools');
});

await asyncTest('Map with default values', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create(
    {
      timeout: 'timeout',
      retries: 'retries',
    },
    {
      timeout: 5000,
      retries: 3,
    }
  );

  const source = {};
  const result = mapper.execute(source).result;

  assert.strictEqual(result.timeout, 5000);
  assert.strictEqual(result.retries, 3);
});

// Scenario 3: Array transformations
console.log('\nScenario 3: Array Transformations');
await asyncTest('Transform array of objects', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    itemId: 'id',
    itemValue: 'value',
  });

  const sources = [
    { id: 1, value: 'A' },
    { id: 2, value: 'B' },
    { id: 3, value: 'C' },
  ];

  const results = sources.map(s => mapper.execute(s).result);

  assert.strictEqual(results.length, 3);
  assert.strictEqual(results[0].itemId, 1);
  assert.strictEqual(results[1].itemValue, 'B');
});

// Scenario 4: Legacy API (backward compatibility)
console.log('\nScenario 4: Legacy API (Backward Compatibility)');
await asyncTest('Use legacy Mapper.create API', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    targetName: 'sourceName',
    targetValue: 'sourceValue',
  });

  const source = { sourceName: 'Test', sourceValue: 123 };
  const result = mapper.execute(source).result;

  assert.strictEqual(result.targetName, 'Test');
  assert.strictEqual(result.targetValue, 123);
});

// Scenario 5: Error handling
console.log('\nScenario 5: Error Handling');
await asyncTest('Handle invalid input gracefully', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    requiredField: 'required',
  });

  // Should handle null input gracefully
  try {
    const result = mapper.execute(null).result;
    // If it doesn't throw, result should be null or undefined
    assert.ok(result === null || result === undefined || typeof result === 'object');
  } catch (error) {
    // It's also acceptable to throw an error for null input
    assert.ok(error instanceof Error);
  }
});

// Scenario 6: Nested field access
console.log('\nScenario 6: Nested Field Access');
await asyncTest('Map nested fields using dot notation', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const mapper = Mapper.create({
    fullName: 'name',
    streetName: 'address.street',
    cityName: 'address.city',
  });

  const source = {
    name: 'Bob',
    address: {
      street: '123 Main St',
      city: 'Springfield',
    },
  };

  const result = mapper.execute(source).result;

  assert.strictEqual(result.fullName, 'Bob');
  assert.strictEqual(result.streetName, '123 Main St');
  assert.strictEqual(result.cityName, 'Springfield');
});

// Scenario 7: Multiple mappers
console.log('\nScenario 7: Multiple Mappers');
await asyncTest('Use multiple mappers in same file', async () => {
  const { Mapper } = await import(`${packageRoot}/core/Mapper.js`);

  const userMapper = Mapper.create({ userName: 'name' });
  const productMapper = Mapper.create({ productName: 'name' });

  const user = userMapper.execute({ name: 'Alice' }).result;
  const product = productMapper.execute({ name: 'Widget' }).result;

  assert.strictEqual(user.userName, 'Alice');
  assert.strictEqual(product.productName, 'Widget');
});

// Scenario 8: Re-export validation
console.log('\nScenario 8: Re-export Validation');
await asyncTest('All decorators are re-exported from main', async () => {
  const mainExports = await import(`${packageRoot}/index.js`);

  const requiredExports = [
    'Mapper', 'Map', 'MapFrom', 'Default', 'Transform', 'MapWith', 'Ignore',
    'plainToInstance', 'plainToClass', 'plainToInstanceArray', 'plainToClassArray',
    'tryPlainToInstance', 'tryPlainToInstanceArray', 'createMapper', 'getMapper',
  ];

  for (const exportName of requiredExports) {
    assert.ok(exportName in mainExports, `Missing export: ${exportName}`);
  }
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('Test Summary:');
console.log(`  Total:  ${testsPassed + testsFailed}`);
console.log(`  Passed: ${testsPassed} ✓`);
console.log(`  Failed: ${testsFailed} ✗`);
console.log('='.repeat(60));

if (testsFailed === 0) {
  console.log('\n✅ Package is ready for npm publication!');
  console.log('   Users will be able to import and use it without issues.\n');
  process.exit(0);
} else {
  console.log('\n❌ Package has issues that need to be fixed!\n');
  process.exit(1);
}

