/**
 * Playwright global setup — creates an isolated test environment:
 *   1. Docker MariaDB on port 3308
 *   2. API server on port 4001
 *   3. UI dev server on port 5174
 *   4. Test admin user with known credentials
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const API_DIR = join(__dirname, '../../stacker-api');
const UI_DIR = join(__dirname, '..');

function cleanupStaleProcesses() {
  for (const port of [API_PORT, UI_PORT]) {
    try {
      const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pids) {
        execSync(`kill -9 ${pids.split('\n').join(' ')}`, { stdio: 'ignore' });
        console.log(`  Killed stale process on port ${port}`);
      }
    } catch { /* nothing on that port */ }
  }
  try { execSync(`docker rm -f ${DB_CONTAINER}`, { stdio: 'ignore' }); } catch { /* ignore */ }
}

async function waitForServer(url: string, label: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 400) return;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`${label} did not start within ${timeoutMs}ms`);
}

async function setupDatabase(): Promise<string> {
  console.log('Setting up test database...');

  execSync(
    `docker run -d --name ${DB_CONTAINER} -p ${DB_PORT}:3306 -e MARIADB_ROOT_PASSWORD=${DB_PASSWORD} -e MARIADB_DATABASE=${DB_NAME} mariadb:11`,
    { stdio: 'ignore' }
  );

  // Wait for MariaDB
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`docker exec ${DB_CONTAINER} mariadb -uroot -p${DB_PASSWORD} -e "SELECT 1"`, { stdio: 'ignore' });
      break;
    } catch {
      if (i === 29) throw new Error('Test database failed to start');
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const dbUrl = `mysql://root:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}`;

  // Generate Prisma client, run migrations, seed
  const env = { DATABASE_URL: dbUrl, SEED_ADMIN_EMAIL: TEST_EMAIL, SEED_ADMIN_PASSWORD: TEST_PASSWORD, SEED_ADMIN_FIRST_NAME: 'E2E', SEED_ADMIN_LAST_NAME: 'Admin' };
  execSync('npx prisma generate', { cwd: API_DIR, env: { ...process.env, ...env }, stdio: 'pipe' });
  execSync('npx prisma migrate deploy', { cwd: API_DIR, env: { ...process.env, ...env }, stdio: 'pipe' });
  execSync('npx prisma db seed', { cwd: API_DIR, env: { ...process.env, ...env }, stdio: 'pipe' });

  console.log('Database ready.');
  return dbUrl;
}

function startApi(dbUrl: string) {
  console.log('Starting API server...');

  const proc = spawn('node_modules/.bin/ts-node', ['src/index.ts'], {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      JWT_SECRET: JWT_SECRET,
      STACKER_API_KEY: API_KEY,
      PORT: String(API_PORT),
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DEV_ADMIN_USER_ID: '',
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`  [API] ${line}`);
  });
  proc.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`  [API err] ${line}`);
  });
}

function startUi() {
  console.log('Starting UI dev server...');

  const proc = spawn('node_modules/.bin/vite', ['--port', String(UI_PORT), '--strictPort'], {
    cwd: UI_DIR,
    env: {
      ...process.env,
      VITE_API_URL: `http://localhost:${API_PORT}/graphql`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`  [UI] ${line}`);
  });
  proc.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (line && !line.includes('console.warn')) console.log(`  [UI err] ${line}`);
  });
}

export default async function globalSetup() {
  // 0. Clean up stale processes
  cleanupStaleProcesses();

  // 1. Database
  const dbUrl = await setupDatabase();

  // 2. Start API
  startApi(dbUrl);
  await waitForServer(`http://localhost:${API_PORT}/graphql`, 'API');
  console.log('API ready.');

  // 3. Start UI
  startUi();
  await waitForServer(`http://localhost:${UI_PORT}`, 'UI');
  console.log('UI ready.');

  // 4. Save credentials
  const credentials = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    apiUrl: `http://localhost:${API_PORT}/graphql`,
    uiUrl: `http://localhost:${UI_PORT}`,
  };
  writeFileSync(join(__dirname, '.e2e-credentials.json'), JSON.stringify(credentials, null, 2));
  console.log('E2E Setup: Complete.');
}
