// Test import resolution without running build
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing import resolution...\n');

// Function to resolve import paths
function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    // Resolve @/ alias to src/
    const resolved = importPath.replace('@/', 'src/');
    return resolved;
  }
  
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Resolve relative imports
    const dir = path.dirname(fromFile);
    return path.resolve(dir, importPath);
  }
  
  return importPath; // External package
}

// Function to check if a file exists with common extensions
function fileExists(basePath) {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  // Check exact path first
  if (fs.existsSync(basePath)) return basePath;
  
  // Try with extensions
  for (const ext of extensions) {
    const withExt = basePath + ext;
    if (fs.existsSync(withExt)) return withExt;
  }
  
  // Try index files
  for (const ext of extensions) {
    const indexFile = path.join(basePath, 'index' + ext);
    if (fs.existsSync(indexFile)) return indexFile;
  }
  
  return null;
}

// Function to extract imports from a file
function extractImports(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Match import statements
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Test key files
const testFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/fallback-ad/FallbackAdWizard.tsx',
  'src/lib/mongodb.ts',
  'src/lib/broadstreet-api.ts',
  'src/lib/types/broadstreet.ts'
];

let errorCount = 0;

testFiles.forEach(file => {
  console.log(`\n📄 Checking ${file}...`);
  
  if (!fs.existsSync(file)) {
    console.log(`❌ File not found: ${file}`);
    errorCount++;
    return;
  }
  
  const imports = extractImports(file);
  
  imports.forEach(importPath => {
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      return;
    }
    
    const resolved = resolveImport(importPath, file);
    const exists = fileExists(resolved);
    
    if (exists) {
      console.log(`✅ ${importPath} → ${exists}`);
    } else {
      console.log(`❌ ${importPath} → NOT FOUND (resolved to: ${resolved})`);
      errorCount++;
    }
  });
});

console.log(`\n🎯 Import Resolution Summary`);
console.log(`Total import errors: ${errorCount}`);

if (errorCount === 0) {
  console.log('✅ All imports resolve correctly!');
} else {
  console.log('❌ Import resolution errors found.');
}

// Additional checks
console.log('\n🔧 Additional Checks...');

// Check for common TypeScript issues
const checkTSIssues = (file) => {
  if (!fs.existsSync(file)) return;
  
  const content = fs.readFileSync(file, 'utf8');
  
  // Check for missing React import in JSX files
  if ((file.endsWith('.tsx') || file.endsWith('.jsx')) && 
      (content.includes('<') || content.includes('JSX')) && 
      !content.includes('import React') && 
      !content.includes("'use client'") &&
      !file.includes('layout.tsx')) {
    console.log(`⚠️  ${file} might need React import for JSX`);
  }
  
  // Check for async components without proper typing
  if (content.includes('export default async function') && 
      !content.includes(': Promise<') &&
      file.includes('page.tsx')) {
    console.log(`ℹ️  ${file} is async component (should be fine in App Router)`);
  }
};

testFiles.forEach(checkTSIssues);

console.log('\n📋 If imports are correct, try:');
console.log('1. Delete node_modules and package-lock.json');
console.log('2. npm install');
console.log('3. npm run build');
console.log('4. Check for any remaining TypeScript errors');
