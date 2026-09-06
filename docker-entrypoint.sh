#!/bin/sh
set -eu

echo "[Xndzor] Applying Prisma schema to ${DATABASE_URL:-db}…"
node ./node_modules/prisma/build/index.js db push --skip-generate --schema=./prisma/schema.prisma

echo "[Xndzor] Starting Next.js on :${PORT:-3000}…"
exec node server.js
