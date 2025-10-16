# ESM Integration Testing

This directory contains comprehensive integration tests for the ESM (ES Modules) build of `om-data-mapper`.

## Overview

The ESM integration tests validate that the package can be correctly imported and used in Node.js ESM contexts after building. These tests simulate real-world usage scenarios that users would encounter after installing the package via npm.

## Why ESM Testing is Critical

Node.js ESM has strict requirements that differ from CommonJS:

1. **Explicit File Extensions**: All relative imports must include `.js` extensions
   ```javascript
   // ❌ Breaks in Node.js ESM
   import { Mapper } from './core/Mapper'
   
   // ✅ Works in Node.js ESM
   import { Mapper } from './core/Mapper.js'
   ```

2. **Directory Imports**: Must explicitly reference `index.js`
   ```javascript
   // ❌ Breaks in Node.js ESM
   import { Map } from './decorators'
   
   // ✅ Works in Node.js ESM
   import { Map } from './decorators/index.js'
   ```

3. **Package Type Marker**: ESM directories need `package.json` with `"type": "module"`

4. **No Automatic Resolution**: Unlike bundlers, Node.js doesn't automatically resolve extensions

## Test Files

### 1. `esm-integration.test.mjs`
**Comprehensive integration test suite**

Tests:
- ✅ Static validation of all import/export statements
- ✅ Package structure validation (`package.json` marker)
- ✅ Main entry point imports
- ✅ Decorator module imports
- ✅ Core module imports
- ✅ Mapper functionality
- ✅ Array transformation
- ✅ Export type validation

**Run:** `npm run test:esm:integration`

### 2. `esm-runtime-simple.test.mjs`
**Quick smoke test**

A minimal test that catches the most common ESM issues:
- ✅ Can import main entry point
- ✅ Can import decorator module
- ✅ Can import core module
- ✅ Basic mapper functionality works

**Run:** `npm run test:esm:simple`

### 3. `esm-post-install-simulation.test.mjs`
**Post-installation simulation**

Simulates how users would use the package after `npm install`:
- ✅ Basic mapper usage
- ✅ Simple field mapping
- ✅ Array transformations
- ✅ Legacy API compatibility
- ✅ Error handling
- ✅ Nested field access
- ✅ Multiple mappers
- ✅ Re-export validation

**Run:** `npm run test:esm:simulation`

## Running Tests

### Run All ESM Tests
```bash
npm run test:esm
```

This runs all three test suites in sequence.

### Run Individual Test Suites
```bash
# Integration tests
npm run test:esm:integration

# Simple smoke test
npm run test:esm:simple

# Post-install simulation
npm run test:esm:simulation
```

### Run All Tests (Unit + ESM)
```bash
npm run test:all
```

## CI/CD Integration

The ESM tests are integrated into the GitHub Actions CI/CD pipeline:

### Pull Request Workflow
1. **Unit Tests** run first (`npm test`)
2. **Build** generates CJS and ESM outputs (`npm run build`)
3. **ESM Validation** runs on Node.js 18, 20, and 22
4. **PR Comment** shows validation results

### Release Workflow
Before publishing to npm, the release workflow:
1. Runs unit tests
2. Builds the project
3. **Runs ESM integration tests** ← Prevents broken ESM builds from being published
4. Verifies package integrity
5. Publishes if all checks pass

## What Gets Validated

### 1. Static Analysis
- Scans all `.js` files in `build/esm/`
- Verifies every import/export has proper `.js` or `.json` extension
- Reports any missing extensions with file and line number

### 2. Package Structure
- Verifies `build/esm/package.json` exists
- Confirms it contains `"type": "module"`

### 3. Runtime Import Resolution
- Actually imports modules in Node.js
- Catches `ERR_MODULE_NOT_FOUND` errors
- Validates all expected exports are accessible

### 4. Functionality Testing
- Tests that imported code actually works
- Validates mapper creation and execution
- Tests array transformations
- Verifies nested field access

### 5. Export Completeness
- Checks all expected functions/classes are exported
- Validates export types (function, object, etc.)
- Ensures no exports are missing

## Common Issues Caught

### ❌ Missing `.js` Extensions
```javascript
// build/esm/index.js
export * from './core/Mapper'  // ❌ Will fail ESM tests
```

**Fix:** Post-build script adds `.js` extensions
```javascript
export * from './core/Mapper.js'  // ✅ Passes ESM tests
```

### ❌ Incorrect Directory Imports
```javascript
// build/esm/index.js
export * from './decorators.js'  // ❌ File doesn't exist
```

**Fix:** Script detects directories and adds `/index.js`
```javascript
export * from './decorators/index.js'  // ✅ Correct
```

### ❌ Missing Package Marker
```
build/esm/
  ├── index.js
  └── core/
      └── Mapper.js
```

**Fix:** Build script creates `package.json`
```
build/esm/
  ├── package.json  ← {"type": "module"}
  ├── index.js
  └── core/
      └── Mapper.js
```

## Build Process

The ESM build uses a three-step process:

```bash
npm run build:esm
```

This runs:
1. **TypeScript Compilation**: `tsc -p tsconfig.esm.json`
   - Uses `module: "ESNext"` and `moduleResolution: "bundler"`
   - Outputs clean ESM syntax without extensions

2. **Post-Build Transformation**: `node scripts/fix-esm-imports.js`
   - Adds `.js` extensions to file imports
   - Adds `/index.js` to directory imports
   - Validates file existence

3. **Package Marker Creation**: `echo '{"type":"module"}' > build/esm/package.json`
   - Creates ESM package marker
   - Tells Node.js to treat `.js` files as ESM

## TypeScript Configuration

### Why Not Use `module: "node16"`?

TypeScript's `node16`/`nodenext` module resolution would solve the extension problem, but it requires developers to write `.js` extensions in `.ts` source files:

```typescript
// With module: "node16", you'd have to write:
import { Mapper } from './core/Mapper.js'  // .js in .ts file!
```

This is confusing and non-standard. Instead, we use:
- `module: "ESNext"` - Clean ESM output
- `moduleResolution: "bundler"` - Optimized for bundlers
- **Post-build script** - Adds extensions automatically

## Debugging Failed Tests

### Test Fails with `ERR_MODULE_NOT_FOUND`
1. Check the error message for the missing module path
2. Look at `build/esm/` to see what was actually generated
3. Run `npm run test:esm:integration` for detailed static analysis
4. Check `scripts/fix-esm-imports.js` for transformation logic

### Test Fails with "Missing export"
1. Check `build/esm/index.js` to see what's exported
2. Verify the source file exports the symbol
3. Check if the export chain is broken (A → B → C)

### Test Fails on Specific Node.js Version
1. Check Node.js ESM compatibility for that version
2. Look at the CI logs for the specific error
3. Test locally with that Node.js version using `nvm`

## Maintenance

### Adding New Exports
When adding new exports to the package:
1. Add the export to source files
2. Run `npm run build`
3. Run `npm run test:esm` to verify
4. Update test expectations if needed

### Modifying Build Process
If you modify the build process:
1. Run `npm run build`
2. Manually inspect `build/esm/` output
3. Run `npm run test:esm` to validate
4. Test in a real Node.js ESM project

### Updating Tests
When updating tests:
1. Ensure they test real-world usage scenarios
2. Don't use decorators in test files (they require compilation)
3. Use the legacy `Mapper.create()` API for testing
4. Keep tests focused and fast

## Resources

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Package.json "exports" Field](https://nodejs.org/api/packages.html#exports)

## Questions?

If you encounter ESM-related issues:
1. Check this documentation
2. Run the ESM tests locally
3. Look at the CI logs
4. Open an issue with the error message and Node.js version

