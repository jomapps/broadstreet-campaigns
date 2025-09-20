import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';

function runNode(script, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

async function main() {
  // Drop
  const dropPath = fileURLToPath(new URL('./db-drop.mjs', import.meta.url));
  await runNode(dropPath);
  // Seed via seed-test-data using dev server sync endpoints
  const seedPath = fileURLToPath(new URL('../seed-test-data.mjs', import.meta.url));
  await runNode(seedPath);
}

main().catch((err) => {
  console.error('[db:reset] Error:', err?.message || err);
  process.exit(1);
});

