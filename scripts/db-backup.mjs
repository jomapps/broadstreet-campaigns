import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}-${hh}${mm}${ss}`;
}

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[db:backup] MONGODB_URI not set. Define it in .env.local');
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const root = path.resolve(__dirname, '..');
  const backupsDir = path.join(root, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const stamp = formatTimestamp();
  const outDir = path.join(backupsDir, stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const args = ['--uri', mongoUri, '--out', outDir];
  const proc = spawn('mongodump', args, { stdio: 'inherit' });
  proc.on('error', (err) => {
    console.error('[db:backup] Failed to start mongodump:', err?.message || err);
    process.exit(1);
  });
  proc.on('close', (code) => {
    process.exit(code || 0);
  });
}

main();

