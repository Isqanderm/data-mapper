#!/usr/bin/env node
/**
 * Post-Installation Simulation Test
 *
 * Simulates how a consumer reaches the `om-data-mapper` meta-package after
 * `npm install om-data-mapper`. Every scenario below imports by *package
 * name* only — `om-data-mapper` and its declared subpaths — so resolution
 * goes through the package.json `exports` map exactly as a consumer's
 * `import` would. (Inside the package's own directory Node resolves those
 * bare specifiers by self-reference, which is `exports`-map-driven too.)
 * No scenario imports a file path into `build/` or `node_modules/`: a
 * filesystem-path `import()` is not subject to an `exports` map, so it can
 * reach entry points no consumer can, and certifies nothing about what the
 * published package actually offers.
 *
 * Scenarios tested:
 * 1. Root entry point resolves through the exports map and carries the
 *    documented public API
 * 2. The root `Mapper` is the class decorator, not the retired legacy class
 * 3. `om-data-mapper/class-transformer-compat` — exports and runtime behavior
 * 4. `om-data-mapper/class-validator-compat` — exports and runtime behavior
 * 5. Undeclared subpaths are blocked by the exports map
 *
 * Not covered here: anything requiring decorator syntax. This file is plain
 * `.mjs`, so `@Mapper()` / `@Map()` classes cannot be written in it; the
 * decorator API's behavior is covered by the TypeScript test suites
 * (`pnpm test`). What this file establishes is the *reachability* of the
 * published surface, plus the runtime behavior of the compat helpers that
 * need no decorator syntax.
 */

import { strict as assert } from 'assert';

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

// Scenario 1: Root entry point
console.log('Scenario 1: Root Entry Point (exports map)');
await asyncTest('import("om-data-mapper") resolves', async () => {
  const main = await import('om-data-mapper');

  assert.ok(main, 'root entry should resolve');
});

await asyncTest('All documented decorators and helpers are exported', async () => {
  const main = await import('om-data-mapper');

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
    assert.ok(exportName in main, `Missing export: ${exportName}`);
    assert.strictEqual(typeof main[exportName], 'function', `${exportName} should be a function`);
  }
});

// Scenario 2: `Mapper` identity
console.log('\nScenario 2: `Mapper` Is the Class Decorator');
await asyncTest('Mapper() returns a class decorator', async () => {
  const { Mapper } = await import('om-data-mapper');

  // The decorator API's `Mapper` is a factory: calling it yields the actual
  // class decorator. The retired legacy `Mapper` class had a static
  // `.create()` instead and threw when called without `new`.
  assert.strictEqual(typeof Mapper(), 'function');
  assert.strictEqual(
    Mapper.create,
    undefined,
    'the legacy `Mapper.create` class API is not part of the published surface',
  );
});

// Scenario 3: class-transformer compat subpath
console.log('\nScenario 3: class-transformer-compat Subpath');
await asyncTest('Subpath exports the class-transformer adapter API', async () => {
  const compat = await import('om-data-mapper/class-transformer-compat');

  for (const exportName of [
    'plainToInstance',
    'plainToClass',
    'classToPlain',
    'serialize',
    'Expose',
    'Exclude',
    'Type',
    'Transform',
  ]) {
    assert.ok(exportName in compat, `Missing export: ${exportName}`);
  }
});

await asyncTest('plainToInstance / classToPlain round-trip a plain object', async () => {
  const { plainToInstance, classToPlain } = await import('om-data-mapper/class-transformer-compat');

  class User {}

  const instance = plainToInstance(User, { name: 'Alice', email: 'alice@example.com' });

  assert.ok(instance instanceof User);
  assert.strictEqual(instance.name, 'Alice');
  assert.strictEqual(instance.email, 'alice@example.com');

  assert.deepStrictEqual(classToPlain(instance), {
    name: 'Alice',
    email: 'alice@example.com',
  });
});

// Scenario 4: class-validator compat subpath
console.log('\nScenario 4: class-validator-compat Subpath');
await asyncTest('Subpath exports the class-validator adapter API', async () => {
  const compat = await import('om-data-mapper/class-validator-compat');

  for (const exportName of [
    'validate',
    'validateSync',
    'registerDecorator',
    'IsString',
    'IsEmail',
    'IsNumber',
  ]) {
    assert.ok(exportName in compat, `Missing export: ${exportName}`);
  }
});

await asyncTest('registerDecorator + validateSync report constraint violations', async () => {
  const { registerDecorator, validateSync } = await import('om-data-mapper/class-validator-compat');

  class Account {
    constructor(name) {
      this.name = name;
    }
  }

  // `registerDecorator` is the programmatic entry point to the same metadata
  // the `@IsString()`-style decorators write, so a plain `.mjs` file can
  // exercise real validation without decorator syntax.
  registerDecorator({
    name: 'isNonEmpty',
    target: Account,
    propertyName: 'name',
    validator: {
      validate: (value) => typeof value === 'string' && value.length > 0,
      defaultMessage: () => 'name must not be empty',
    },
  });

  const invalid = validateSync(new Account(''));
  assert.strictEqual(invalid.length, 1);
  assert.strictEqual(invalid[0].property, 'name');
  assert.strictEqual(invalid[0].constraints.isNonEmpty, 'name must not be empty');

  assert.deepStrictEqual(validateSync(new Account('Alice')), []);
});

// Scenario 5: exports map enforcement
console.log('\nScenario 5: Exports Map Enforcement');
await asyncTest('Undeclared subpaths are not importable', async () => {
  for (const subpath of ['om-data-mapper/build/esm/index.js', 'om-data-mapper/package.json']) {
    await assert.rejects(
      () => import(subpath),
      (error) => error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
      `${subpath} should not be reachable`,
    );
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
  console.log('\n✅ Every reachable entry point above was reached by package name, through');
  console.log("   the exports map; Scenario 5's subpaths were correctly rejected, not");
  console.log('   reached — that is what it tests. Resolution here is Node self-reference,');
  console.log('   not an installed node_modules lookup, but it is the same exports-map');
  console.log('   algorithm a consumer of the published package gets. This file never runs');
  console.log('   `npm pack`, so it does not verify the `files` array actually ships');
  console.log('   build/. Decorator-syntax behavior is covered by `pnpm test`.\n');
  process.exit(0);
} else {
  console.log('\n❌ Package has issues that need to be fixed!\n');
  process.exit(1);
}
