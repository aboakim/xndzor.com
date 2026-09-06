/**
 * Promote an existing user (or ADMIN_EMAIL) to ADMIN role.
 * Usage: npm run admin:promote
 *        ADMIN_EMAIL=you@example.com npm run admin:promote
 */
import { PrismaClient } from "@prisma/client";

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
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN", suspended: false },
  });

  console.log(`✓ ${email} is now ADMIN (role=${user.role} → ADMIN)`);
  console.log(`  Admin panel: /hy/admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
