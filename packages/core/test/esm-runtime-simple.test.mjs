#!/usr/bin/env node
/**
 * Simple ESM Runtime Test
 *
 * Quick smoke test to verify the ESM build can be imported and used.
 * This is a minimal test that catches the most common issues.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const esmBuildDir = join(__dirname, '..', 'build', 'esm');

console.log('🧪 ESM Runtime Smoke Test\n');

// Test 1: Import main entry point
console.log('1. Testing main entry point import...');
try {
  const { Mapper, Map, MapFrom, plainToInstance, plainToClass, createMapper } = await import(
    `${esmBuildDir}/index.js`
  );

  console.log('   ✓ Main entry point imported successfully');
  console.log(
    `   ✓ Found ${Object.keys({ Mapper, Map, MapFrom, plainToInstance, plainToClass, createMapper }).length} exports`,
  );
} catch (error) {
  console.error('   ✗ Failed to import main entry point:', error.message);
  process.exit(1);
}

// Test 2: Import decorator module directly
console.log('\n2. Testing decorator module import...');
try {
  const decorators = await import(`${esmBuildDir}/decorators/index.js`);
  console.log('   ✓ Decorator module imported successfully');
  console.log(`   ✓ Found ${Object.keys(decorators).length} exports`);
} catch (error) {
  console.error('   ✗ Failed to import decorator module:', error.message);
  process.exit(1);
}

// Test 3: Import core module
console.log('\n3. Testing core module import...');
try {
  const core = await import(`${esmBuildDir}/core/Mapper.js`);
  console.log('   ✓ Core module imported successfully');
  console.log(`   ✓ Found ${Object.keys(core).length} exports`);
} catch (error) {
  console.error('   ✗ Failed to import core module:', error.message);
  process.exit(1);
}

// Test 4: Test actual functionality using legacy Mapper API
console.log('\n4. Testing mapper functionality...');
try {
  const { Mapper } = await import(`${esmBuildDir}/core/Mapper.js`);

  // Use legacy Mapper.create API which works without decorators
  const mapper = Mapper.create({
    name: 'firstName',
    age: 'userAge',
  });

  const source = { firstName: 'John', userAge: 30 };
  const response = mapper.execute(source);
  const result = response.result;

  if (result.name !== 'John' || result.age !== 30) {
    throw new Error(`Mapping produced incorrect results: got ${JSON.stringify(result)}`);
  }

  console.log('   ✓ Mapper API works correctly');
  console.log(
    `   ✓ Mapped: ${JSON.stringify(source)} → { name: "${result.name}", age: ${result.age} }`,
  );
} catch (error) {
  console.error('   ✗ Functionality test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n✅ All smoke tests passed!\n');
