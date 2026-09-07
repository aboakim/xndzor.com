import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { catalogListingSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CATALOG_SUBTYPES, isCatalogCategory, stringifySpecs } from "@/lib/catalog";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";

function optNum(v: number | "" | undefined | null): number | null {
  if (v === "" || v == null) return null;
  return Number(v);
}

function optStr(v: string | undefined | null, max = 200): string | null {
  const s = cleanText(v, max);
  return s || null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const subtype = searchParams.get("subtype");
  const marzId = searchParams.get("marz");
  const villageId = searchParams.get("village");
  const q = searchParams.get("q")?.trim()?.slice(0, 120);
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  if (category && !isCatalogCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const listings = await prisma.catalogListing.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category } : {}),
      ...(subtype ? { subtype } : {}),
      ...(marzId ? { marzId } : {}),
      ...(villageId ? { villageId } : {}),
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
              { brand: { contains: q } },
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

  const limited = rateLimit(`catalog-post:${session.user.id}:${clientIp(req)}`, {
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
  const parsed = catalogListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const allowed = CATALOG_SUBTYPES[data.category];
  if (!allowed.includes(data.subtype as (typeof allowed)[number])) {
    return NextResponse.json({ error: "Invalid subtype for category" }, { status: 400 });
  }

  const locRef = await resolveLocationRefs(data.marzId, data.villageId);
  if (!locRef.ok || !locRef.villageId) {
    return NextResponse.json(
      { error: locRef.ok ? "Village required" : locRef.error },
      { status: 400 },
    );
  }

  const imageUrls = JSON.stringify(filterListingImageUrls(data.imageUrls));

  const listing = await prisma.catalogListing.create({
    data: {
      category: data.category,
      subtype: data.subtype,
      title: cleanText(data.title, 160),
      description: cleanText(data.description, 12000),
      brand: optStr(data.brand, 80),
      specsJson: stringifySpecs(data.specs || {}),
      quantity: optNum(data.quantity),
      unit: optStr(data.unit, 20),
      packageSize: optStr(data.packageSize, 80),
      priceAmd: optNum(data.priceAmd) != null ? Math.round(optNum(data.priceAmd)!) : null,
      priceNegotiable: Boolean(data.priceNegotiable),
      priceUnit: data.priceUnit || "LOT",
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
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
