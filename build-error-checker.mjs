// Comprehensive build error checker
import fs from 'fs';
import path from 'path';

console.log('\ud83d\udd0d Comprehensive Build Error Check...\n');

let errorCount = 0;

// Check 1: Required files
const requiredFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/lib/mongodb.ts',
  'src/lib/broadstreet-api.ts',
  'src/lib/types/broadstreet.ts',
  'src/lib/types/global.d.ts',
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
  '.env.local'
];

console.log('\ud83d\udcc1 Checking required files...');
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`\u2705 ${file}`);
  } else {
    console.log(`\u274c Missing: ${file}`);
    errorCount++;
  }
});

// Check 2: Package.json dependencies
console.log('\n\ud83d\udce6 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredDeps = {
  react: '^19',
  'react-dom': '^19',
  next: '^15',
  mongoose: '^8',
};

const requiredDevDeps = {
  typescript: '^5',
  '@types/node': '^20',
  '@types/react': '^19',
  '@types/react-dom': '^19',
  tailwindcss: '^4',
};

Object.entries(requiredDeps).forEach(([dep]) => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`\u2705 ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`\u274c Missing dependency: ${dep}`);
    errorCount++;
  }
});

Object.entries(requiredDevDeps).forEach(([dep]) => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`\u2705 ${dep}: ${packageJson.devDependencies[dep]}`);
  } else {
    console.log(`\u274c Missing dev dependency: ${dep}`);
    errorCount++;
  }
});

// Check 3: TypeScript issues
console.log('\n\ud83d\udd27 Checking TypeScript issues...');

const checkTypeScriptFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Check for common TS issues
  if (content.includes('any') && !filePath.includes('global.d.ts')) {
    console.log(`\u26a0\ufe0f  ${filePath} contains 'any' types`);
  }

  if (content.includes('// @ts-ignore')) {
    console.log(`\u26a0\ufe0f  ${filePath} contains @ts-ignore`);
  }

  // Check for missing imports
  if (content.includes('useState') && !content.includes('import { useState') && !content.includes('import React')) {
    console.log(`\u274c ${filePath} uses useState but doesn't import it`);
    errorCount++;
  }

  if (content.includes('useEffect') && !content.includes('import { useEffect') && !content.includes('import React')) {
    console.log(`\u274c ${filePath} uses useEffect but doesn't import it`);
    errorCount++;
  }
};

// Check key TypeScript files
const tsFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/lib/mongodb.ts',
  'src/lib/broadstreet-api.ts',
];

tsFiles.forEach(checkTypeScriptFile);

// Check 4: Client/Server component issues
console.log('\n\ud83d\udd04 Checking client/server components...');

const checkClientServerIssues = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const hasUseClient = content.includes("'use client'");
  const hasServerFeatures = content.includes('await ') || content.includes('connectDB');
  const hasClientFeatures = content.includes('useState') || content.includes('onClick') || content.includes('useEffect');

  if (hasServerFeatures && hasClientFeatures && !filePath.includes('api/')) {
    console.log(`\u274c ${filePath} mixes server and client features`);
    errorCount++;
  }

  if (hasClientFeatures && !hasUseClient && !filePath.includes('page.tsx') && !filePath.includes('layout.tsx')) {
    console.log(`\u26a0\ufe0f  ${filePath} might need 'use client' directive`);
  }
};

tsFiles.forEach(checkClientServerIssues);

// Check 5: CSS issues
console.log('\n\ud83c\udfa8 Checking CSS...');
if (fs.existsSync('src/app/globals.css')) {
  const cssContent = fs.readFileSync('src/app/globals.css', 'utf8');

  if (!cssContent.includes('@import "tailwindcss"')) {
    console.log('\u274c Missing Tailwind v4 import in globals.css');
    errorCount++;
  } else {
    console.log('\u2705 Tailwind v4 import found');
  }

  if (cssContent.includes('@tailwind')) {
    console.log('\u26a0\ufe0f  Found v3 @tailwind directives (should use @import for v4)');
  }
}

// Check 6: Environment variables
console.log('\n\ud83d\udd10 Checking environment variables...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const requiredEnvVars = ['BROADSTREET_API_TOKEN', 'BROADSTREET_API_BASE_URL', 'MONGODB_URI'];

  requiredEnvVars.forEach((envVar) => {
    if (envContent.includes(envVar)) {
      console.log(`\u2705 ${envVar} found`);
    } else {
      console.log(`\u274c Missing environment variable: ${envVar}`);
      errorCount++;
    }
  });
}

// Summary
console.log('\n\ud83c\udfaf Build Error Check Summary');
console.log(`Total errors found: ${errorCount}`);

if (errorCount === 0) {
  console.log('\u2705 No critical errors found! Build should succeed.');
  console.log('\n\ud83d\udccb Try running:');
  console.log('1. npm install (if dependencies changed)');
  console.log('2. npm run build');
} else {
  console.log('\u274c Critical errors found. Please fix before building.');
  console.log('\n\ud83d\udd27 Common fixes:');
  console.log('- Install missing dependencies: npm install');
  console.log('- Fix import statements');
  console.log("- Add 'use client' to interactive components");
  console.log('- Check environment variables');
}

