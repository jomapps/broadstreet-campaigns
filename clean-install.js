// Clean installation script for Tailwind v4
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🧹 Starting clean Tailwind v4 installation...\n');

// Step 1: Remove node_modules if it exists
if (fs.existsSync('node_modules')) {
  console.log('🗑️  Removing existing node_modules...');
  try {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  } catch (error) {
    // Try Windows command if Unix fails
    try {
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
    } catch (winError) {
      console.log('⚠️  Could not remove node_modules automatically. Please delete it manually.');
    }
  }
}

// Step 2: Remove any remaining lock files
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
lockFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`🗑️  Removing ${file}...`);
    fs.unlinkSync(file);
  }
});

// Step 3: Verify package.json is clean
console.log('📦 Verifying package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check for v3 remnants
const v3Remnants = [
  '@tailwindcss/postcss',
  '@tailwindcss/forms',
  '@tailwindcss/typography',
  'autoprefixer'
];

let hasV3Remnants = false;
v3Remnants.forEach(pkg => {
  if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
    console.log(`❌ Found v3 remnant: ${pkg}`);
    hasV3Remnants = true;
  }
});

if (hasV3Remnants) {
  console.log('⚠️  Please remove v3 packages from package.json manually');
  process.exit(1);
}

// Step 4: Verify Tailwind v4 is present
if (!packageJson.devDependencies || !packageJson.devDependencies.tailwindcss) {
  console.log('❌ Tailwind CSS not found in devDependencies');
  process.exit(1);
}

console.log('✅ package.json looks clean for Tailwind v4');

// Step 5: Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 6: Verify installation
console.log('\n🔍 Verifying Tailwind v4 installation...');
try {
  const tailwindVersion = execSync('npm list tailwindcss --depth=0', { encoding: 'utf8' });
  if (tailwindVersion.includes('tailwindcss@4')) {
    console.log('✅ Tailwind CSS v4 installed correctly');
  } else {
    console.log('⚠️  Tailwind version check inconclusive');
  }
} catch (error) {
  console.log('⚠️  Could not verify Tailwind version');
}

console.log('\n🎉 Clean installation complete!');
console.log('📋 Next steps:');
console.log('1. npm run build (to test build)');
console.log('2. npm run dev (to start development server)');
console.log('3. Open http://localhost:3005 in your browser');
