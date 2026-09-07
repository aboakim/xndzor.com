import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { machineryListingSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocationRefs } from "@/lib/resolve-refs";

function optInt(v: number | "" | undefined | null): number | null {
  if (v === "" || v == null) return null;
  return Number(v);
}

function optStr(v: string | undefined | null, max = 200): string | null {
  const s = cleanText(v, max);
  return s || null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const marzId = searchParams.get("marz");
  const villageId = searchParams.get("village");
  const condition = searchParams.get("condition");
  const q = searchParams.get("q")?.trim()?.slice(0, 120);
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  const listings = await prisma.machineryListing.findMany({
    where: {
      status: "ACTIVE",
      ...(type ? { machineryType: type } : {}),
      ...(marzId ? { marzId } : {}),
      ...(villageId ? { villageId } : {}),
      ...(condition ? { condition } : {}),
      ...(yearMin || yearMax
        ? {
            year: {
              ...(yearMin ? { gte: Number(yearMin) } : {}),
              ...(yearMax ? { lte: Number(yearMax) } : {}),
            },
          }
        : {}),
      ...(priceMin || priceMax
        ? {
            priceAmd: {
              ...(priceMin ? { gte: Number(priceMin) } : {}),
              ...(priceMax ? { lte: Number(priceMax) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { make: { contains: q } },
              { model: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      marz: true,
      village: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`machinery-post:${session.user.id}:${clientIp(req)}`, {
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const body = await req.json();
  const parsed = machineryListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const locRef = await resolveLocationRefs(data.marzId, data.villageId);
  if (!locRef.ok || !locRef.villageId) {
    return NextResponse.json(
      { error: locRef.ok ? "Village required" : locRef.error },
      { status: 400 },
    );
  }

  const imageUrls = JSON.stringify(
    (data.imageUrls || []).filter(
      (u) => u.startsWith("/uploads/") && !u.includes("..") && !u.includes("//")
    )
  );

  const listing = await prisma.machineryListing.create({
    data: {
      title: cleanText(data.title, 120),
      description: cleanText(data.description, 8000),
      machineryType: data.machineryType,
      make: cleanText(data.make, 80),
      model: cleanText(data.model, 80),
      year: data.year,
      engineHours: optInt(data.engineHours),
      mileageKm: optInt(data.mileageKm),
      condition: data.condition,
      priceAmd: optInt(data.priceAmd),
      priceNegotiable: Boolean(data.priceNegotiable),
      powerHp: optInt(data.powerHp),
      transmission: optStr(data.transmission),
      driveType: optStr(data.driveType),
      fuel: optStr(data.fuel),
      workingWidth: optStr(data.workingWidth),
      capacity: optStr(data.capacity),
      attachments: optStr(data.attachments, 500),
      documentsNote: optStr(data.documentsNote, 500),
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: cleanText(data.phone, 20),
      whatsapp: optStr(data.whatsapp, 20),
      imageUrls,
      userId: session.user.id,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
