// Comprehensive build check script for Tailwind v4 + Next.js 15
import fs from 'fs';
import path from 'path';

console.log('🔍 Checking for build issues (Tailwind v4 + Next.js 15)...\n');

// Check if all required files exist
const requiredFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/lib/mongodb.ts',
  'src/lib/broadstreet-api.ts',
  'src/lib/types/broadstreet.ts',
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
  '.env.local'
];

let allFilesExist = true;
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['react', 'react-dom', 'next', 'mongoose'];
const requiredDevDeps = ['tailwindcss'];

console.log('\n📦 Checking dependencies...');
requiredDeps.forEach((dep) => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ Missing dependency: ${dep}`);
    allFilesExist = false;
  }
});

console.log('\n🎨 Checking Tailwind v4 setup...');
requiredDevDeps.forEach((dep) => {
  if (packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`);
  } else {
    console.log(`❌ Missing dev dependency: ${dep}`);
    allFilesExist = false;
  }
});

// Check Tailwind v4 CSS setup
console.log('\n🎨 Checking CSS setup...');
if (fs.existsSync('src/app/globals.css')) {
  const cssContent = fs.readFileSync('src/app/globals.css', 'utf8');
  if (cssContent.includes('@import "tailwindcss"')) {
    console.log('✅ Tailwind v4 CSS import found');
  } else {
    console.log('❌ Missing Tailwind v4 CSS import');
    allFilesExist = false;
  }

  if (cssContent.includes('@theme inline')) {
    console.log('✅ Tailwind v4 theme syntax found');
  } else {
    console.log('⚠️  No Tailwind v4 theme syntax found (optional)');
  }
}

// Check for client/server component issues
console.log('\n🔧 Checking component structure...');

const checkFile = (filePath, shouldBeClient = false) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasUseClient = content.includes("'use client'");
    const hasOnClick = content.includes('onClick');
    const hasUseState = content.includes('useState');

    if (shouldBeClient && !hasUseClient && (hasOnClick || hasUseState)) {
      console.log(`⚠️  ${filePath} might need 'use client' directive`);
    } else if (!shouldBeClient && hasUseClient) {
      console.log(`ℹ️  ${filePath} is a client component`);
    } else {
      console.log(`✅ ${filePath} component structure looks good`);
    }
  }
};

// Check key files
checkFile('src/app/dashboard/page.tsx');
checkFile('src/app/campaigns/page.tsx');
checkFile('src/components/dashboard/QuickActions.tsx', true);
checkFile('src/components/campaigns/CampaignActions.tsx', true);

// Check API routes
console.log('\n🔌 Checking API routes...');
const apiRoutes = [
  'src/app/api/sync/all/route.ts',
  'src/app/api/sync/networks/route.ts',
  'src/app/api/fallback-ad/create/route.ts'
];

apiRoutes.forEach((route) => {
  if (fs.existsSync(route)) {
    console.log(`✅ ${route}`);
  } else {
    console.log(`❌ Missing API route: ${route}`);
    allFilesExist = false;
  }
});

console.log('\n🎯 Build check complete!');
if (allFilesExist) {
  console.log('✅ All checks passed. Ready to build with Tailwind v4!');
  console.log('\n📋 Next steps:');
  console.log('1. npm install (if not done)');
  console.log('2. npm run build');
  console.log('3. npm run dev (to test)');
} else {
  console.log('❌ Some issues found. Please fix before building.');
}

