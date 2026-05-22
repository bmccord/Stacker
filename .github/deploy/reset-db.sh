#!/bin/sh
# Resets the database by dropping and recreating it, then restarts the API
# container which auto-runs migrations and seed on startup.
#
# Usage: ./reset-db.sh (run from the stacker deploy directory on the server)

set -e

echo "Resetting database..."
docker compose exec -T api node -e '
const mariadb = require("mariadb");
const u = new URL(process.env.DATABASE_URL);
const opts = { host: u.hostname, port: parseInt(u.port || "3306"), user: u.username, password: u.password };
const db = u.pathname.replace(/^\//, "");
(async () => {
  const conn = await mariadb.createConnection(opts);
  console.log("Dropping database " + db + "...");
  await conn.query("DROP DATABASE IF EXISTS `" + db + "`");
  console.log("Creating database " + db + "...");
  await conn.query("CREATE DATABASE `" + db + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  await conn.end();
  console.log("Database reset complete.");
})().catch(e => { console.error(e); process.exit(1); });
'

echo "Restarting API container..."
docker compose restart api

echo "Waiting for API to start..."
sleep 15

echo "=== API logs ==="
docker compose logs --tail 30 api
