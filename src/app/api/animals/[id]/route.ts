import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { animalListingSchema, animalStatusSchema } from "@/lib/validations";
import { cleanText } from "@/lib/sanitize";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { isStatusOnlyBody, listingAuthError } from "@/lib/listing-ownership";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.animalListing.findUnique({
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
  const existing = await prisma.animalListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  if (isStatusOnlyBody(body)) {
    const parsed = animalStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const listing = await prisma.animalListing.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(listing);
  }

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

  const listing = await prisma.animalListing.update({
    where: { id },
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
  const existing = await prisma.animalListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.animalListing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
