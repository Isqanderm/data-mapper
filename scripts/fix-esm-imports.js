#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to relative imports in ESM output
 * This is required for Node.js ESM compatibility
 */

const fs = require('fs');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      addJsExtensions(fullPath);
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace relative imports without extensions with .js extension
      // Matches: from './path' or from "./path" or from './path/file'
      content = content.replace(
        /from\s+['"](\.[^'"]+)['"]/g,
        (match, importPath) => {
          // Don't add extension if it already has one
          if (importPath.match(/\.(js|json)$/)) {
            return match;
          }
          return `from '${importPath}.js'`;
        }
      );

      // Also handle export statements
      content = content.replace(
        /export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g,
        (match, importPath) => {
          if (importPath.match(/\.(js|json)$/)) {
            return match;
          }
          return `export * from '${importPath}.js'`;
        }
      );

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

const esmDir = path.join(__dirname, '..', 'build', 'esm');

if (fs.existsSync(esmDir)) {
  console.log('Adding .js extensions to ESM imports...');
  addJsExtensions(esmDir);
  console.log('✓ ESM imports fixed');
} else {
  console.error('ESM build directory not found:', esmDir);
  process.exit(1);
}

