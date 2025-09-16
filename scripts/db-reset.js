/* eslint-disable no-console */
const { spawn } = require('child_process');

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
  await runNode(require.resolve('./db-drop.js'));
  // Seed via existing seed-test-data using dev server sync endpoints
  await runNode(require.resolve('../seed-test-data.js'));
}

main().catch((err) => {
  process.exit(1);
});


