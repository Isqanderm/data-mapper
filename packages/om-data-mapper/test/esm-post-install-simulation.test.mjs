#!/usr/bin/env node
/**
 * Post-Installation Simulation Test
 *
 * This test simulates how a user would import and use the `om-data-mapper`
 * meta-package after installing it via npm. It validates the package's own
 * build output (`build/esm`), which in this monorepo layout only contains
 * the meta-package's own entry points (index.js, class-transformer-compat.js,
 * class-validator-compat.js) — it re-exports @om-data-mapper/core,
 * @om-data-mapper/class-transformer and @om-data-mapper/class-validator
 * rather than bundling their internals.
 *
 * Scenarios tested:
 * 1. Named imports from main package
 * 2. Real-world usage patterns
 * 3. Error handling
 * 4. Legacy `Mapper.create()` API (backward compatibility)
 * 5. Re-export validation (root + compat subpaths)
 *
 * Note on scenarios 1-7 (legacy `Mapper.create()` API): `@om-data-mapper/core`'s
 * top-level index does `export * from './core/Mapper'` (the legacy class,
 * with a static `.create()`) AND `export { Mapper } from './decorators'` (the
 * `@Mapper()` class decorator, recommended API). Per ES module semantics an
 * explicit named/indirect export always wins over an `export *` of the same
 * name, so `Mapper` at the public root of both @om-data-mapper/core and this
 * meta-package resolves to the *decorator*, not the legacy class — this is
 * pre-existing behavior of the core package (unrelated to this task) and was
 * true of the pre-monorepo package too. The original test avoided this by
 * importing the legacy class straight from its build file
 * (`build/esm/core/Mapper.js`), bypassing package export resolution entirely
 * (a direct filesystem-path `import()` is not subject to a package.json
 * `exports` map — only bare-specifier resolution is). We preserve that same
 * approach here, pointed at @om-data-mapper/core's own build output (reached
 * through the pnpm workspace symlink in this package's node_modules), so the
 * legacy API keeps getting exercised exactly as before.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { strict as assert } from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..', 'build', 'esm');
// Direct filesystem path into the sibling @om-data-mapper/core package's
// build output, resolved through the pnpm workspace symlink. This is a raw
// file-path import (bypasses `exports` map enforcement) so it can reach the
// legacy `Mapper` class directly, sidestepping the `Mapper` naming collision
// described above.
const legacyMapperPath = join(
  __dirname,
  '..',
  'node_modules',
  '@om-data-mapper',
  'core',
  'build',
  'esm',
  'core',
  'Mapper.js',
);

console.log('📦 Post-Installation Simulation Test\n');
console.log('Simulating: npm install om-data-mapper\n');

let testsPassed = 0;
let testsFailed = 0;

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
await asyncTest('Import legacy Mapper class', async () => {
  const { Mapper } = await import(legacyMapperPath);

  assert.ok(Mapper, 'Mapper should exist');
  assert.strictEqual(typeof Mapper.create, 'function');
});

await asyncTest('Create and use a simple mapper', async () => {
  const { Mapper } = await import(legacyMapperPath);

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
  const { Mapper } = await import(legacyMapperPath);

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
  const { Mapper } = await import(legacyMapperPath);

  const mapper = Mapper.create(
    {
      timeout: 'timeout',
      retries: 'retries',
    },
    {
      timeout: 5000,
      retries: 3,
    },
  );

  const source = {};
  const result = mapper.execute(source).result;

  assert.strictEqual(result.timeout, 5000);
  assert.strictEqual(result.retries, 3);
});

// Scenario 3: Array transformations
console.log('\nScenario 3: Array Transformations');
await asyncTest('Transform array of objects', async () => {
  const { Mapper } = await import(legacyMapperPath);

  const mapper = Mapper.create({
    itemId: 'id',
    itemValue: 'value',
  });

  const sources = [
    { id: 1, value: 'A' },
    { id: 2, value: 'B' },
    { id: 3, value: 'C' },
  ];

  const results = sources.map((s) => mapper.execute(s).result);

  assert.strictEqual(results.length, 3);
  assert.strictEqual(results[0].itemId, 1);
  assert.strictEqual(results[1].itemValue, 'B');
});

// Scenario 4: Legacy API (backward compatibility)
console.log('\nScenario 4: Legacy API (Backward Compatibility)');
await asyncTest('Use legacy Mapper.create API', async () => {
  const { Mapper } = await import(legacyMapperPath);

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
  const { Mapper } = await import(legacyMapperPath);

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
  const { Mapper } = await import(legacyMapperPath);

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
  const { Mapper } = await import(legacyMapperPath);

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
    'Mapper',
    'Map',
    'MapFrom',
    'Default',
    'Transform',
    'MapWith',
    'Ignore',
    'plainToInstance',
    'plainToClass',
    'plainToInstanceArray',
    'plainToClassArray',
    'tryPlainToInstance',
    'tryPlainToInstanceArray',
    'createMapper',
    'getMapper',
  ];

  for (const exportName of requiredExports) {
    assert.ok(exportName in mainExports, `Missing export: ${exportName}`);
  }
});

// Scenario 9: Compat subpath exports (class-transformer-compat / class-validator-compat)
console.log('\nScenario 9: Compat Subpath Exports');
await asyncTest('class-transformer-compat re-exports the class-transformer adapter', async () => {
  const compat = await import(`${packageRoot}/class-transformer-compat.js`);

  for (const exportName of [
    'plainToInstance',
    'plainToClass',
    'Expose',
    'Exclude',
    'Type',
    'Transform',
  ]) {
    assert.ok(exportName in compat, `Missing export: ${exportName}`);
  }
});

await asyncTest('class-validator-compat re-exports the class-validator adapter', async () => {
  const compat = await import(`${packageRoot}/class-validator-compat.js`);

  for (const exportName of ['validate', 'validateSync', 'IsString', 'IsEmail', 'IsNumber']) {
    assert.ok(exportName in compat, `Missing export: ${exportName}`);
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
