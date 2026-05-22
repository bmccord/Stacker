import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const CONTAINER_NAME = 'stacker-test-db';
const NETWORK_NAME = 'stacker-test-net';
const PORT = process.env.TEST_DB_PORT ?? '3307';

// Detect if running inside Docker (CI runners) by checking for /.dockerenv
const isDocker = existsSync('/.dockerenv');

function run(cmd: string, options?: { ignoreError?: boolean }) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (e) {
    if (options?.ignoreError) return '';
    throw e;
  }
}

function waitForDb(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      run(`docker exec ${CONTAINER_NAME} mariadb -uroot -ptestpass -e "SELECT 1"`);
      return;
    } catch {
      if (i === maxAttempts - 1) throw new Error('Test database failed to start');
      execSync('sleep 1');
    }
  }
}

export async function setup() {
  console.log(`Starting test database container... (docker: ${isDocker})`);

  // Remove existing container/network if present
  run(`docker stop ${CONTAINER_NAME}`, { ignoreError: true });
  run(`docker rm ${CONTAINER_NAME}`, { ignoreError: true });

  let dbHost: string;

  if (isDocker) {
    // In CI: create a bridge network, attach both the test DB and the runner
    run(`docker network create ${NETWORK_NAME}`, { ignoreError: true });

    run([
      'docker run -d',
      `--name ${CONTAINER_NAME}`,
      `--network ${NETWORK_NAME}`,
      '-e MARIADB_ROOT_PASSWORD=testpass',
      '-e MARIADB_DATABASE=stacker_test',
      'mariadb:11',
    ].join(' '));

    // Connect this runner container to the same network
    const hostname = run('hostname');
    run(`docker network connect ${NETWORK_NAME} ${hostname}`, { ignoreError: true });

    dbHost = CONTAINER_NAME;
    console.log(`Using Docker network: ${NETWORK_NAME}, host: ${dbHost}`);
  } else {
    // Local: use port mapping
    run([
      'docker run -d',
      `--name ${CONTAINER_NAME}`,
      `-p ${PORT}:3306`,
      '-e MARIADB_ROOT_PASSWORD=testpass',
      '-e MARIADB_DATABASE=stacker_test',
      'mariadb:11',
    ].join(' '));

    dbHost = '127.0.0.1';
  }

  // Wait for MariaDB to be ready
  console.log('Waiting for MariaDB to be ready...');
  waitForDb();

  // Build DATABASE_URL — in Docker, use container name on port 3306; locally use localhost on mapped port
  const dbPort = isDocker ? '3306' : PORT;
  const dbUrl = `mysql://root:testpass@${dbHost}:${dbPort}/stacker_test`;

  process.env.DATABASE_URL = dbUrl;
  writeFileSync(join(__dirname, '.env.test'), `DATABASE_URL=${dbUrl}\n`);
  console.log(`DATABASE_URL=${dbUrl}`);

  // Run migrations
  console.log('Running migrations...');
  run('npx prisma migrate deploy');

  console.log('Test database ready.');
}

export async function teardown() {
  console.log('Stopping test database container...');
  run(`docker stop ${CONTAINER_NAME}`, { ignoreError: true });
  run(`docker rm ${CONTAINER_NAME}`, { ignoreError: true });
  if (isDocker) {
    run(`docker network rm ${NETWORK_NAME}`, { ignoreError: true });
  }
  console.log('Test database removed.');
}
