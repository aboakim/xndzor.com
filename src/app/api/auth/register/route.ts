import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS } from "@/lib/password";
import { registerSchema, type RegisterErrorCode } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { allocateFarmId } from "@/lib/farm-id";
import { getEarlyBirdStats } from "@/lib/early-bird";
import { ensureMarz, ensureVillage } from "@/lib/ensure-locations";

function err(code: RegisterErrorCode, status: number, extra?: Record<string, string>) {
  return NextResponse.json(
    { error: code, code, ...extra },
    {
      status,
      ...(extra?.retryAfter
        ? { headers: { "Retry-After": extra.retryAfter } }
        : {}),
    }
  );
}

function zodCode(issueMessage: string | undefined): RegisterErrorCode {
  const known: RegisterErrorCode[] = [
    "INVALID_EMAIL",
    "PASSWORD_TOO_SHORT",
    "PASSWORD_TOO_LONG",
    "INVALID_NAME",
    "INVALID_PHONE",
    "INVALID_MARZ",
    "VILLAGE_REQUIRED",
  ];
  if (issueMessage && (known as string[]).includes(issueMessage)) {
    return issueMessage as RegisterErrorCode;
  }
  return "INVALID_INPUT";
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`register:${ip}`, {
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return err("RATE_LIMITED", 429, {
        retryAfter: String(limited.retryAfterSec),
      });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return err(zodCode(first?.message), 400);
    }
    const { email, password, phone, marz } = parsed.data;
    const villageIdRaw = (parsed.data.villageId || "").trim();
    const name = cleanText(parsed.data.name, 80);
    if (name.length < 2) {
      return err("INVALID_NAME", 400);
    }

    const marzOk = await ensureMarz(marz);
    if (!marzOk) {
      return err("INVALID_MARZ", 400);
    }

    let resolvedVillageId: string | null = null;
    if (villageIdRaw) {
      resolvedVillageId = await ensureVillage(villageIdRaw, marz);
      if (!resolvedVillageId) {
        return err("INVALID_VILLAGE", 400);
      }
    } else if (marz !== "Yerevan") {
      return err("VILLAGE_REQUIRED", 400);
    }

    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (exists) {
      return err("EMAIL_TAKEN", 409);
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const role = parsed.data.role ?? "BOTH";
    const wantsFarm =
      role === "FARMER" || role === "BOTH" || role === "PROVIDER";
    // Registration alone does NOT consume early-bird slots — only package claims do.
    const createUser = async (farmId: string | null) =>
      prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name,
          phone: phone ? cleanText(phone, 20) : null,
          marzId: marz,
          villageId: resolvedVillageId,
          role,
          farmId,
          earlyBirdFree: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          farmId: true,
          earlyBirdFree: true,
        },
      });

    let user;
    try {
      user = await createUser(wantsFarm ? await allocateFarmId() : null);
    } catch (e: unknown) {
      const prismaErr = e as { code?: string; meta?: { target?: string[] } };
      const targets = prismaErr.meta?.target || [];
      if (prismaErr.code === "P2002" && targets.includes("email")) {
        return err("EMAIL_TAKEN", 409);
      }
      // Unique farmId race — allocate once more and retry.
      if (wantsFarm && prismaErr.code === "P2002") {
        user = await createUser(await allocateFarmId());
      } else {
        throw e;
      }
    }
    const earlyBird = await getEarlyBirdStats();
    return NextResponse.json(
      {
        ...user,
        earlyBird: {
          // Slot not claimed at signup — user must activate a package on /pricing
          qualified: false,
          totalRegistered: earlyBird.earlyBirdClaimed,
          freeLimit: earlyBird.freeLimit,
          remaining: earlyBird.remaining,
          slotsFull: earlyBird.slotsFull,
        },
      },
      { status: 201 },
    );
  } catch {
    return err("SERVER_ERROR", 500);
  }
}
