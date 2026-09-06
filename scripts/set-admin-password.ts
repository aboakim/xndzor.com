/**
 * Set (or create) admin user password + ADMIN role.
 *
 * Usage:
 *   npm run admin:set-password
 *   ADMIN_PASSWORD=Akim1234 npm run admin:set-password
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=Akim1234 npx tsx scripts/set-admin-password.ts
 *
 * Production (Neon): set DATABASE_URL to the production connection string first, then run.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../src/lib/password";

config(); // load .env (ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL)

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Akim1234";

async function main() {
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    "albertakimyan1@gmail.com";
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
        // marzId omitted — empty Neon DB may have no Marz rows yet
      },
    });
    console.log(`✓ Created admin user ${email}`);
  }

  console.log(`  Password: ${password}`);
  console.log(`  Login: /hy/auth/login → then /hy/admin`);
  console.log(
    `  DB: ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@") ?? "(unset)"}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
