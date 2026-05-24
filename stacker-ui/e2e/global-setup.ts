/**
 * Playwright global setup — creates an isolated test environment:
 *   1. Docker MariaDB on port 3308
 *   2. API server on port 4001
 *   3. UI dev server on port 5174
 *   4. Test admin user with known credentials
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

const DB_CONTAINER = 'stacker-e2e-db';
const DB_PORT = 3308;
const API_PORT = 4001;
const UI_PORT = 5174;
const DB_PASSWORD = 'testpass';
const DB_NAME = 'stacker_e2e';
const TEST_EMAIL = 'e2e@test.com';
const TEST_PASSWORD = 'e2eTestPass123';
const JWT_SECRET = 'e2e-test-jwt-secret';
const API_KEY = 'sk-e2e-test-key';

function run(cmd: string, opts?: { cwd?: string; ignoreError?: boolean }) {
  try {
    return execSync(cmd, { stdio: 'pipe', cwd: opts?.cwd }).toString().trim();
  } catch (e) {
    if (opts?.ignoreError) return '';
    throw e;
  }
}

function killPort(port: number) {
  run(`lsof -ti:${port} | xargs kill -9`, { ignoreError: true });
}

function waitForPort(port: number, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      run(`curl -sf http://localhost:${port} > /dev/null 2>&1 || curl -sf http://localhost:${port}/graphql > /dev/null 2>&1`);
      return;
    } catch {
      if (i === maxAttempts - 1) throw new Error(`Port ${port} not ready after ${maxAttempts}s`);
      execSync('sleep 1');
    }
  }
}

function waitForDb(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      run(`docker exec ${DB_CONTAINER} mariadb -uroot -p${DB_PASSWORD} -e "SELECT 1"`);
      return;
    } catch {
      if (i === maxAttempts - 1) throw new Error('Test database failed to start');
      execSync('sleep 1');
    }
  }
}

export default async function globalSetup() {
  const apiDir = join(__dirname, '../../stacker-api');

  console.log('E2E Setup: Cleaning up stale processes...');
  killPort(API_PORT);
  killPort(UI_PORT);
  run(`docker stop ${DB_CONTAINER}`, { ignoreError: true });
  run(`docker rm ${DB_CONTAINER}`, { ignoreError: true });

  // Start test database
  console.log('E2E Setup: Starting test database...');
  run([
    'docker run -d',
    `--name ${DB_CONTAINER}`,
    `-p ${DB_PORT}:3306`,
    `-e MARIADB_ROOT_PASSWORD=${DB_PASSWORD}`,
    `-e MARIADB_DATABASE=${DB_NAME}`,
    'mariadb:11',
  ].join(' '));

  waitForDb();
  console.log('E2E Setup: Database ready.');

  // Set up environment for API
  const dbUrl = `mysql://root:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}`;
  const apiEnv = {
    DATABASE_URL: dbUrl,
    JWT_SECRET: JWT_SECRET,
    STACKER_API_KEY: API_KEY,
    PORT: String(API_PORT),
    SEED_ADMIN_EMAIL: TEST_EMAIL,
    SEED_ADMIN_PASSWORD: TEST_PASSWORD,
    SEED_ADMIN_FIRST_NAME: 'E2E',
    SEED_ADMIN_LAST_NAME: 'Admin',
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
  };

  const envString = Object.entries(apiEnv).map(([k, v]) => `${k}="${v}"`).join('\n');
  writeFileSync(join(apiDir, '.env.test'), envString);

  // Run migrations and seed
  console.log('E2E Setup: Running migrations...');
  run('npx prisma migrate deploy', { cwd: apiDir });
  console.log('E2E Setup: Seeding database...');
  run('npx prisma db seed', { cwd: apiDir });

  // Start API server
  console.log('E2E Setup: Starting API server...');
  const apiEnvStr = Object.entries(apiEnv).map(([k, v]) => `${k}=${v}`).join(' ');
  execSync(`${apiEnvStr} node -e "require('ts-node').register(); require('./src/index.ts')" &`, {
    cwd: apiDir,
    stdio: 'ignore',
    shell: '/bin/bash',
  });
  waitForPort(API_PORT);
  console.log(`E2E Setup: API ready on port ${API_PORT}.`);

  // Start UI dev server
  console.log('E2E Setup: Starting UI dev server...');
  execSync(`VITE_API_URL=http://localhost:${API_PORT}/graphql npx vite --port ${UI_PORT} &`, {
    cwd: join(__dirname, '..'),
    stdio: 'ignore',
    shell: '/bin/bash',
  });
  waitForPort(UI_PORT);
  console.log(`E2E Setup: UI ready on port ${UI_PORT}.`);

  // Save credentials for tests
  const credentials = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    apiUrl: `http://localhost:${API_PORT}/graphql`,
    uiUrl: `http://localhost:${UI_PORT}`,
    jwtSecret: JWT_SECRET,
  };
  writeFileSync(join(__dirname, '.e2e-credentials.json'), JSON.stringify(credentials, null, 2));
  console.log('E2E Setup: Complete.');
}
