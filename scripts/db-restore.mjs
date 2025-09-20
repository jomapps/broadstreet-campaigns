import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.mjs';

function getLatestBackupDir(backupsDir) {
  if (!fs.existsSync(backupsDir)) return null;
  const entries = fs
    .readdirSync(backupsDir)
    .map((name) => ({ name, full: path.join(backupsDir, name) }))
    .filter((e) => fs.statSync(e.full).isDirectory())
    .sort((a, b) => b.name.localeCompare(a.name));
  return entries.length ? entries[0].full : null;
}

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[db:restore] MONGODB_URI not set. Define it in .env.local');
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const root = path.resolve(__dirname, '..');
  const backupsDir = path.join(root, 'backups');
  const named = process.argv[2];
  let restoreDir;
  if (named) {
    restoreDir = path.isAbsolute(named) ? named : path.join(backupsDir, named);
    if (!fs.existsSync(restoreDir)) {
      console.error(`[db:restore] Backup folder not found: ${restoreDir}`);
      process.exit(1);
    }
  } else {
    restoreDir = getLatestBackupDir(backupsDir);
    if (!restoreDir) {
      console.error('[db:restore] No backups found.');
      process.exit(1);
    }
  }

  console.log(`[db:restore] Restoring from ${restoreDir}`);
  const args = ['--uri', mongoUri, '--drop', '--dir', restoreDir];
  const proc = spawn('mongorestore', args, { stdio: 'inherit' });
  proc.on('error', (err) => {
    console.error('[db:restore] Failed to start mongorestore. Is it installed and in PATH?', err.message);
  });
  proc.on('close', (code) => {
    if (code === 0) {
      console.log('[db:restore] Success');
      process.exit(0);
    } else {
      console.error('[db:restore] mongorestore exited with code', code);
      process.exit(code || 1);
    }
  });
}

main();

