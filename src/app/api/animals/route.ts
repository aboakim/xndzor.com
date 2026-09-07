import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { animalListingSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";

function optInt(v: number | "" | undefined | null): number | null {
  if (v === "" || v == null) return null;
  return Number(v);
}

function optFloat(v: number | "" | undefined | null): number | null {
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
  const purpose = searchParams.get("purpose");
  const q = searchParams.get("q")?.trim()?.slice(0, 120);
  const ageMin = searchParams.get("ageMin");
  const ageMax = searchParams.get("ageMax");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  const listings = await prisma.animalListing.findMany({
    where: {
      status: "ACTIVE",
      ...(type ? { animalType: type } : {}),
      ...(marzId ? { marzId } : {}),
      ...(villageId ? { villageId } : {}),
      ...(purpose ? { purpose } : {}),
      ...(ageMin || ageMax
        ? {
            ageValue: {
              ...(ageMin ? { gte: Number(ageMin) } : {}),
              ...(ageMax ? { lte: Number(ageMax) } : {}),
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
              { breed: { contains: q } },
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

  const limited = rateLimit(`animals-post:${session.user.id}:${clientIp(req)}`, {
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
  const parsed = animalListingSchema.safeParse(body);
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

  const imageUrls = JSON.stringify(filterListingImageUrls(data.imageUrls));

  const listing = await prisma.animalListing.create({
    data: {
      title: cleanText(data.title, 160),
      description: cleanText(data.description, 12000),
      animalType: data.animalType,
      breed: cleanText(data.breed, 80),
      sex: data.sex,
      ageValue: optInt(data.ageValue),
      ageUnit: data.ageUnit || "MONTHS",
      weightKg: optFloat(data.weightKg),
      quantity: data.quantity,
      purpose: data.purpose,
      vaccinated: Boolean(data.vaccinated),
      healthNotes: optStr(data.healthNotes, 2000),
      documentsNote: optStr(data.documentsNote, 500),
      pedigreeNote: optStr(data.pedigreeNote, 500),
      priceAmd: optInt(data.priceAmd),
      priceNegotiable: Boolean(data.priceNegotiable),
      priceMode: data.priceMode || "LOT",
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
