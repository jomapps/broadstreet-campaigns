 
const fs = require('fs');
const path = require('path');

function parseLine(line) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;
  const key = match[1];
  let value = match[2];
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      if (!line || /^\s*#/.test(line)) return;
      const parsed = parseLine(line);
      if (parsed && process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    });
  } catch (err) {
    // Silently handle env loading errors
  }
}

function loadEnv() {
  const root = path.resolve(__dirname, '..');
  loadEnvFile(path.join(root, '.env')); // base
  loadEnvFile(path.join(root, '.env.local')); // override
}

module.exports = { loadEnv };


