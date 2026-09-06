/**
 * Promote an existing user (or ADMIN_EMAIL) to ADMIN role.
 * Optionally set password when ADMIN_PASSWORD is provided.
 * Usage: npm run admin:promote
 *        ADMIN_EMAIL=you@example.com npm run admin:promote
 *        ADMIN_PASSWORD=Akim1234 npm run admin:promote
 * For password-only updates prefer: npm run admin:set-password
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../src/lib/password";

config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error("Set ADMIN_EMAIL in .env");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    console.error("Register first at /hy/auth/register, then run this again.");
    console.error("Or create + set password: npm run admin:set-password");
    process.exit(1);
  }

  const data: { role: "ADMIN"; suspended: boolean; passwordHash?: string } = {
    role: "ADMIN",
    suspended: false,
  };

  const password = process.env.ADMIN_PASSWORD?.trim();
  if (password) {
    data.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  await prisma.user.update({
    where: { email },
    data,
  });

  console.log(`✓ ${email} is now ADMIN (role=${user.role} → ADMIN)`);
  if (password) {
    console.log(`  Password updated (ADMIN_PASSWORD)`);
  }
  console.log(`  Admin panel: /hy/admin`);
  console.log(`  To set password without promote: npm run admin:set-password`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
