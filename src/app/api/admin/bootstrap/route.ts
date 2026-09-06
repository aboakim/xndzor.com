import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS } from "@/lib/password";

/**
 * One-time / emergency admin upsert against the DB this deployment uses.
 *
 * Disabled unless ADMIN_BOOTSTRAP_SECRET is set in the environment.
 * Call:
 *   POST /api/admin/bootstrap
 *   Authorization: Bearer <ADMIN_BOOTSTRAP_SECRET>
 *   Body (optional JSON): { "email"?, "password"?, "secret"? }
 *
 * Defaults: albertakimyan1@gmail.com / Akim1234
 * Remove ADMIN_BOOTSTRAP_SECRET from Vercel after success.
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  let body: { email?: string; password?: string; secret?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const provided = bearer || body.secret?.trim() || "";
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = (
    body.email?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "albertakimyan1@gmail.com"
  ).toLowerCase();
  const password =
    body.password?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "Akim1234";

  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  try {
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
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: "Xndzor Admin",
          role: "ADMIN",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      email,
      created: !existing,
      login: "/hy/auth/login",
      admin: "/hy/admin",
    });
  } catch (error) {
    console.error(
      "[Xndzor] admin bootstrap failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
