/**
 * Set (or create) admin user password + ADMIN role.
 *
 * Usage:
 *   node scripts/set-admin-password.mjs
 *   ADMIN_PASSWORD=Akim1234 node scripts/set-admin-password.mjs
 *   DATABASE_URL="postgresql://..." node scripts/set-admin-password.mjs
 *
 * Production (Neon): paste Neon DATABASE_URL into .env (or pass inline), then run.
 * Auth compares bcrypt against User.passwordHash (12 rounds) — same as this script.
 */
import { config } from "dotenv";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

config(); // .env → ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 12;
const DEFAULT_EMAIL = "albertakimyan1@gmail.com";
const DEFAULT_PASSWORD = "Akim1234";

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      "DATABASE_URL is missing. Paste your Neon connection string into .env, then re-run.",
    );
    process.exit(1);
  }

  if (url.startsWith("file:")) {
    console.warn(
      "⚠ DATABASE_URL is SQLite (file:…). Production on Vercel uses Neon Postgres — this will NOT fix www.xndzor.com login.",
    );
  } else if (/localhost|127\.0\.0\.1/.test(url)) {
    console.warn(
      "⚠ DATABASE_URL points at localhost — this updates LOCAL DB only, not Vercel/Neon production.",
    );
  }

  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_EMAIL;
  const password = process.env.ADMIN_PASSWORD?.trim() || DEFAULT_PASSWORD;

  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: "ADMIN",
        suspended: false,
      },
    });
    console.log(`✓ Updated password + ADMIN role for ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Xndzor Admin",
        role: "ADMIN",
        // marzId left null — empty prod DB may have no Marz rows yet
      },
    });
    console.log(`✓ Created admin user ${email}`);
  }

  console.log(`  Password: ${password}`);
  console.log(`  Login: /hy/auth/login → then /hy/admin`);
  console.log(
    `  DB: ${url.replace(/:[^:@/]+@/, ":***@")}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
