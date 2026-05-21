/**
 * Creates the database specified in DATABASE_URL if it doesn't already exist.
 * Runs before migrations and seed on every dev startup.
 */

require('dotenv/config');
const mariadb = require('mariadb');

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, '');

  const conn = await mariadb.createConnection({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: url.username,
    password: url.password,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database "${dbName}" ready.`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => { console.error('ensure-db failed:', e.message); process.exit(1); });
