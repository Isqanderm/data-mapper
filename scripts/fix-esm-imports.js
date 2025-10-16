#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to relative imports in ESM output
 * This is required for Node.js ESM compatibility
 */

const fs = require('fs');
const path = require('path');

function addJsExtensions(dir, rootDir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      addJsExtensions(fullPath, rootDir);
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const currentDir = path.dirname(fullPath);

      // Helper function to resolve import path
      const resolveImportPath = (importPath) => {
        // Don't modify if it already has an extension
        if (importPath.match(/\.(js|json)$/)) {
          return importPath;
        }

        // Resolve the absolute path of the import
        const absolutePath = path.resolve(currentDir, importPath);

        // Check if it's a directory with an index.js
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
          const indexPath = path.join(absolutePath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return `${importPath}/index.js`;
          }
        }

        // Check if the .js file exists
        if (fs.existsSync(`${absolutePath}.js`)) {
          return `${importPath}.js`;
        }

        // Default: add .js extension
        return `${importPath}.js`;
      };

      // Replace relative imports without extensions with proper extension
      // Matches: from './path' or from "./path" or from './path/file'
      content = content.replace(
        /from\s+['"](\.[^'"]+)['"]/g,
        (match, importPath) => {
          const resolvedPath = resolveImportPath(importPath);
          return `from '${resolvedPath}'`;
        }
      );

      // Also handle export statements
      content = content.replace(
        /export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g,
        (match, importPath) => {
          const resolvedPath = resolveImportPath(importPath);
          return `export * from '${resolvedPath}'`;
        }
      );

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

const esmDir = path.join(__dirname, '..', 'build', 'esm');

if (fs.existsSync(esmDir)) {
  console.log('Adding .js extensions to ESM imports...');
  addJsExtensions(esmDir, esmDir);
  console.log('✓ ESM imports fixed');
} else {
  console.error('ESM build directory not found:', esmDir);
  process.exit(1);
}

