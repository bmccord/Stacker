#!/bin/sh
set -e

echo "Ensuring database exists..."
node scripts/ensure-db.js

echo "Running database migrations..."
yarn prisma migrate deploy

echo "Seeding database..."
yarn prisma db seed

echo "Starting API server..."
exec node dist/index.js
