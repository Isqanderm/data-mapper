#!/usr/bin/env node
/**
 * Test script to verify ESM imports work correctly in Node.js
 * This addresses the P1 issue: ESM build must have .js extensions
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const esmDir = join(__dirname, 'build', 'esm');

console.log('🔍 Verifying ESM build has proper .js extensions...\n');

let totalFiles = 0;
let filesWithIssues = 0;
const issues = [];

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(esmDir + '/', '');
  
  // Check for imports without .js extension
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  const exportRegex = /export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g;
  
  let match;
  let hasIssue = false;
  
  // Check imports
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.match(/\.(js|json)$/)) {
      issues.push({
        file: relativePath,
        type: 'import',
        path: importPath,
        line: content.substring(0, match.index).split('\n').length
      });
      hasIssue = true;
    }
  }
  
  // Check exports
  while ((match = exportRegex.exec(content)) !== null) {
    const exportPath = match[1];
    if (!exportPath.match(/\.(js|json)$/)) {
      issues.push({
        file: relativePath,
        type: 'export',
        path: exportPath,
        line: content.substring(0, match.index).split('\n').length
      });
      hasIssue = true;
    }
  }
  
  if (hasIssue) {
    filesWithIssues++;
  }
}

function scanDirectory(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.js')) {
      totalFiles++;
      checkFile(fullPath);
    }
  }
}

try {
  scanDirectory(esmDir);
  
  console.log(`📊 Scanned ${totalFiles} JavaScript files\n`);
  
  if (issues.length === 0) {
    console.log('✅ SUCCESS: All ESM imports have proper .js extensions!');
    console.log('✅ The build is Node.js ESM compatible\n');
    process.exit(0);
  } else {
    console.log(`❌ FAILURE: Found ${issues.length} import/export statements without .js extensions in ${filesWithIssues} files:\n`);
    
    for (const issue of issues) {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.type} from '${issue.path}' (missing .js extension)\n`);
    }
    
    console.log('❌ The build will fail in Node.js ESM context with ERR_MODULE_NOT_FOUND\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error scanning ESM build:', error.message);
  process.exit(1);
}

