/**
 * Optionally apply Prisma schema during Vercel/CI build when DATABASE_URL is Postgres.
 * Soft-fails so a missing Neon URL still lets the site deploy (empty-state homepage).
 */
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);

if (!isPostgres) {
  console.log(
    "[db-prepare] Skip prisma db push — set DATABASE_URL to a postgresql://… Neon/Vercel Postgres URL.",
  );
  process.exit(0);
}

console.log("[db-prepare] Running prisma db push against Postgres…");
const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate"],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

if (result.status !== 0) {
  console.warn(
    "[db-prepare] prisma db push failed — continuing build. Fix DATABASE_URL / Neon and redeploy.",
  );
}

process.exit(0);
