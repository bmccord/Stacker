/**
 * Playwright global teardown — cleans up test environment.
 */

import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function run(cmd: string) {
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch {
    // Ignore cleanup errors
  }
}

export default async function globalTeardown() {
  console.log('E2E Teardown: Cleaning up...');

  // Kill servers by port
  run('lsof -ti:4001 | xargs kill -9');
  run('lsof -ti:5174 | xargs kill -9');

  // Remove test database container
  run('docker stop stacker-e2e-db');
  run('docker rm stacker-e2e-db');

  // Clean up credentials file
  try {
    unlinkSync(join(__dirname, '.e2e-credentials.json'));
  } catch {
    // Ignore
  }

  console.log('E2E Teardown: Complete.');
}
