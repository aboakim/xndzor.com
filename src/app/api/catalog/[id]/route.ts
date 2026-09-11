import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { catalogListingSchema, catalogStatusSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { CATALOG_SUBTYPES, stringifySpecs } from "@/lib/catalog";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { isStatusOnlyBody, listingAuthError } from "@/lib/listing-ownership";

function optNum(v: number | "" | undefined | null): number | null {
  if (v === "" || v == null) return null;
  return Number(v);
}

function optStr(v: string | undefined | null, max = 200): string | null {
  const s = cleanText(v, max);
  return s || null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.catalogListing.findUnique({
    where: { id },
    include: {
      marz: true,
      village: true,
      user: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!listing || listing.status === "HIDDEN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.catalogListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  if (isStatusOnlyBody(body)) {
    const parsed = catalogStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const listing = await prisma.catalogListing.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(listing);
  }

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

  const listing = await prisma.catalogListing.update({
    where: { id },
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
      imageUrls: JSON.stringify(filterListingImageUrls(data.imageUrls)),
    },
  });
  return NextResponse.json(listing);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.catalogListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.catalogListing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
