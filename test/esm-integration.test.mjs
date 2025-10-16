#!/usr/bin/env node
/**
 * ESM Integration Tests
 *
 * Comprehensive test suite to verify the ESM build works correctly in real-world scenarios.
 * This simulates how users would import and use the package after npm installation.
 *
 * Tests cover:
 * 1. Static validation of import/export statements
 * 2. Runtime import resolution
 * 3. Actual functionality of imported code
 * 4. Package structure validation
 * 5. Export completeness
 */

import { strict as assert } from 'assert';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const esmBuildDir = join(projectRoot, 'build', 'esm');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}▶ ${name}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`  ${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`  ${colors.red}✗${colors.reset} ${message}`);
}

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test 1: Static Validation - Verify all imports have proper extensions
 */
async function testStaticImportValidation() {
  logTest('Test 1: Static Import Validation');

  const issues = [];

  async function scanDirectory(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const content = await readFile(fullPath, 'utf8');
        const relativePath = fullPath.replace(esmBuildDir + '/', '');

        // Check for imports/exports without extensions
        const importRegex = /(?:from|import)\s+['"](\.[^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];

          // Check if it has a proper extension
          if (!importPath.match(/\.(js|json)$/)) {
            issues.push({
              file: relativePath,
              import: importPath,
              line: content.substring(0, match.index).split('\n').length,
            });
          }
        }
      }
    }
  }

  totalTests++;
  try {
    await scanDirectory(esmBuildDir);

    if (issues.length === 0) {
      passedTests++;
      logSuccess(`All imports have proper .js extensions`);
      return true;
    } else {
      failedTests++;
      logError(`Found ${issues.length} imports without proper extensions:`);
      issues.forEach(issue => {
        console.log(`    ${issue.file}:${issue.line} - "${issue.import}"`);
      });
      return false;
    }
  } catch (error) {
    failedTests++;
    logError(`Static validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Package Structure - Verify package.json marker exists
 */
async function testPackageStructure() {
  logTest('Test 2: Package Structure Validation');

  totalTests++;
  try {
    const packageJsonPath = join(esmBuildDir, 'package.json');
    const content = await readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);

    assert.strictEqual(pkg.type, 'module', 'package.json should have type: "module"');

    passedTests++;
    logSuccess('package.json marker exists with correct type');
    return true;
  } catch (error) {
    failedTests++;
    logError(`Package structure validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Runtime Import - Main Entry Point
 */
async function testMainEntryPoint() {
  logTest('Test 3: Main Entry Point Import');

  totalTests++;
  try {
    const mainModule = await import(`${esmBuildDir}/index.js`);

    // Verify key exports exist
    const expectedExports = [
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

    const missingExports = expectedExports.filter(name => !(name in mainModule));

    if (missingExports.length === 0) {
      passedTests++;
      logSuccess(`All ${expectedExports.length} expected exports are accessible`);
      return { success: true, module: mainModule };
    } else {
      failedTests++;
      logError(`Missing exports: ${missingExports.join(', ')}`);
      return { success: false };
    }
  } catch (error) {
    failedTests++;
    logError(`Failed to import main entry point: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 4: Runtime Import - Decorator Module
 */
async function testDecoratorModule() {
  logTest('Test 4: Decorator Module Import');

  totalTests++;
  try {
    const decoratorModule = await import(`${esmBuildDir}/decorators/index.js`);

    const expectedExports = [
      'Mapper',
      'Map',
      'MapFrom',
      'Default',
      'Transform',
      'MapWith',
      'Ignore',
      'createMapper',
      'plainToInstance',
      'getMapper',
    ];

    const missingExports = expectedExports.filter(name => !(name in decoratorModule));

    if (missingExports.length === 0) {
      passedTests++;
      logSuccess(`Decorator module exports all expected functions`);
      return { success: true, module: decoratorModule };
    } else {
      failedTests++;
      logError(`Missing decorator exports: ${missingExports.join(', ')}`);
      return { success: false };
    }
  } catch (error) {
    failedTests++;
    logError(`Failed to import decorator module: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 5: Runtime Import - Core Module
 */
async function testCoreModule() {
  logTest('Test 5: Core Module Import');

  totalTests++;
  try {
    const coreModule = await import(`${esmBuildDir}/core/Mapper.js`);

    assert.ok('Mapper' in coreModule, 'Core Mapper should be exported');
    assert.ok(coreModule.Mapper, 'Mapper should exist');
    assert.strictEqual(typeof coreModule.Mapper.create, 'function', 'Mapper.create should be a function');

    passedTests++;
    logSuccess('Core module imports successfully');
    return { success: true, module: coreModule };
  } catch (error) {
    failedTests++;
    logError(`Failed to import core module: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 6: Functionality - Mapper API
 */
async function testMapperFunctionality() {
  logTest('Test 6: Mapper API Functionality');

  totalTests++;
  try {
    const { Mapper } = await import(`${esmBuildDir}/core/Mapper.js`);

    // Create mapper with configuration using legacy API
    const mapper = Mapper.create({
      targetName: 'sourceName',
      targetValue: 'sourceValue',
    });

    // Test data
    const source = {
      sourceName: 'John Doe',
      sourceValue: 42,
    };

    // Transform
    const response = mapper.execute(source);
    const result = response.result;

    // Verify results
    assert.strictEqual(result.targetName, 'John Doe', 'Name should be mapped correctly');
    assert.strictEqual(result.targetValue, 42, 'Value should be mapped correctly');

    passedTests++;
    logSuccess('Mapper API works correctly');
    return true;
  } catch (error) {
    failedTests++;
    logError(`Mapper functionality test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Functionality - Array Transformation
 */
async function testArrayTransformation() {
  logTest('Test 7: Array Transformation Functionality');

  totalTests++;
  try {
    const { Mapper } = await import(`${esmBuildDir}/core/Mapper.js`);

    const mapper = Mapper.create({
      fullName: 'name',
      userAge: 'age',
    });

    const sources = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ];

    const results = sources.map(source => mapper.execute(source).result);

    assert.strictEqual(results.length, 3, 'Should transform all items');
    assert.strictEqual(results[0].fullName, 'Alice', 'First item should be mapped');
    assert.strictEqual(results[1].fullName, 'Bob', 'Second item should be mapped');
    assert.strictEqual(results[2].fullName, 'Charlie', 'Third item should be mapped');

    passedTests++;
    logSuccess('Array transformation works correctly');
    return true;
  } catch (error) {
    failedTests++;
    logError(`Array transformation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Export Type Validation
 */
async function testExportTypes() {
  logTest('Test 8: Export Type Validation');

  totalTests++;
  try {
    const mainModule = await import(`${esmBuildDir}/index.js`);

    const typeChecks = [
      { name: 'Mapper', type: 'function' },
      { name: 'Map', type: 'function' },
      { name: 'MapFrom', type: 'function' },
      { name: 'Default', type: 'function' },
      { name: 'Transform', type: 'function' },
      { name: 'MapWith', type: 'function' },
      { name: 'Ignore', type: 'function' },
      { name: 'plainToInstance', type: 'function' },
      { name: 'plainToClass', type: 'function' },
      { name: 'createMapper', type: 'function' },
      { name: 'getMapper', type: 'function' },
    ];

    const typeErrors = [];

    for (const check of typeChecks) {
      const actualType = typeof mainModule[check.name];
      if (actualType !== check.type) {
        typeErrors.push(`${check.name}: expected ${check.type}, got ${actualType}`);
      }
    }

    if (typeErrors.length === 0) {
      passedTests++;
      logSuccess(`All exports have correct types`);
      return true;
    } else {
      failedTests++;
      logError(`Type validation failed:`);
      typeErrors.forEach(err => console.log(`    ${err}`));
      return false;
    }
  } catch (error) {
    failedTests++;
    logError(`Export type validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         ESM Integration Test Suite                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  log('\nSimulating post-installation package usage in Node.js ESM context\n', 'blue');

  // Run all tests
  await testStaticImportValidation();
  await testPackageStructure();
  await testMainEntryPoint();
  await testDecoratorModule();
  await testCoreModule();
  await testMapperFunctionality();
  await testArrayTransformation();
  await testExportTypes();

  // Print summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Test Summary                                       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  log(`\nTotal Tests:  ${totalTests}`, 'blue');
  log(`Passed:       ${passedTests}`, 'green');
  log(`Failed:       ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  if (failedTests === 0) {
    log('\n✅ All ESM integration tests passed!', 'green');
    log('The package is ready for Node.js ESM consumption.\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed!', 'red');
    log('Please fix the issues before publishing.\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test runner crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

