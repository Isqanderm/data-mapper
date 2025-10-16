#!/usr/bin/env node
/**
 * Runtime test to verify ESM imports actually work in Node.js
 * This tests the actual import resolution, not just syntax
 */

console.log('🔍 Testing ESM runtime imports in Node.js...\n');

try {
  // Test importing the main entry point
  console.log('1️⃣ Testing main entry point import...');
  const { Mapper, Map, MapFrom, plainToInstance } = await import('./build/esm/index.js');

  if (!Mapper || !Map || !MapFrom || !plainToInstance) {
    throw new Error('Failed to import main exports');
  }
  console.log('   ✅ Main entry point imports successfully\n');

  // Test importing decorators
  console.log('2️⃣ Testing decorator imports...');
  const decorators = await import('./build/esm/decorators/index.js');

  if (!decorators.Mapper || !decorators.Map || !decorators.plainToInstance) {
    throw new Error('Failed to import decorator exports');
  }
  console.log('   ✅ Decorator imports successfully\n');

  // Test importing core modules
  console.log('3️⃣ Testing core module imports...');
  const core = await import('./build/esm/core/Mapper.js');

  if (!core.Mapper) {
    throw new Error('Failed to import core Mapper');
  }
  console.log('   ✅ Core module imports successfully\n');

  // Test that all exports are functions/classes (basic sanity check)
  console.log('4️⃣ Testing export types...');

  if (typeof Mapper !== 'function') {
    throw new Error('Mapper is not a function');
  }
  if (typeof Map !== 'function') {
    throw new Error('Map is not a function');
  }
  if (typeof plainToInstance !== 'function') {
    throw new Error('plainToInstance is not a function');
  }
  console.log('   ✅ All exports have correct types\n');

  console.log('✅ SUCCESS: All ESM runtime tests passed!');
  console.log('✅ The package works correctly in Node.js ESM context\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ FAILURE: ESM runtime test failed');
  console.error('Error:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  console.error('\n❌ This indicates the ESM build has import resolution issues\n');
  process.exit(1);
}

