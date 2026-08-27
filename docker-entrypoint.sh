#!/bin/sh
set -eu

echo "[FarmOS] Applying Prisma schema to ${DATABASE_URL:-db}…"
node ./node_modules/prisma/build/index.js db push --skip-generate --schema=./prisma/schema.prisma

echo "[FarmOS] Starting Next.js on :${PORT:-3000}…"
exec node server.js
