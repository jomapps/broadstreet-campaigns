// Clean installation script for Tailwind v4
import fs from 'fs';
import { execSync } from 'node:child_process';

console.log('\ud83e\uddf9 Starting clean Tailwind v4 installation...\n');

// Step 1: Remove node_modules if it exists
if (fs.existsSync('node_modules')) {
  console.log('\ud83d\uddd1\ufe0f  Removing existing node_modules...');
  try {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  } catch (error) {
    // Try Windows command if Unix fails
    try {
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
    } catch (winError) {
      console.log('\u26a0\ufe0f  Could not remove node_modules automatically. Please delete it manually.');
    }
  }
}

// Step 2: Remove any remaining lock files
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
lockFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`\ud83d\uddd1\ufe0f  Removing ${file}...`);
    fs.unlinkSync(file);
  }
});

// Step 3: Verify package.json is clean
console.log('\ud83d\udce6 Verifying package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check for v3 remnants
const v3Remnants = ['@tailwindcss/postcss', '@tailwindcss/forms', '@tailwindcss/typography', 'autoprefixer'];

let hasV3Remnants = false;
v3Remnants.forEach((pkg) => {
  if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
    console.log(`\u274c Found v3 remnant: ${pkg}`);
    hasV3Remnants = true;
  }
});

if (hasV3Remnants) {
  console.log('\u26a0\ufe0f  Please remove v3 packages from package.json manually');
  process.exit(1);
}

// Step 4: Verify Tailwind v4 is present
if (!packageJson.devDependencies || !packageJson.devDependencies.tailwindcss) {
  console.log('\u274c Tailwind CSS not found in devDependencies');
  process.exit(1);
}

console.log('\u2705 package.json looks clean for Tailwind v4');

// Step 5: Install dependencies
console.log('\n\ud83d\udce6 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\u2705 Dependencies installed successfully');
} catch (error) {
  console.log('\u274c Failed to install dependencies');
  process.exit(1);
}

// Step 6: Verify installation
console.log('\n\ud83d\udd0d Verifying Tailwind v4 installation...');
try {
  const tailwindVersion = execSync('npm list tailwindcss --depth=0', { encoding: 'utf8' });
  if (tailwindVersion.includes('tailwindcss@4')) {
    console.log('\u2705 Tailwind CSS v4 installed correctly');
  } else {
    console.log('\u26a0\ufe0f  Tailwind version check inconclusive');
  }
} catch (error) {
  console.log('\u26a0\ufe0f  Could not verify Tailwind version');
}

console.log('\n\ud83c\udf89 Clean installation complete!');
console.log('\ud83d\udccb Next steps:');
console.log('1. npm run build (to test build)');
console.log('2. npm run dev (to start development server)');
console.log('3. Open http://localhost:3005 in your browser');

