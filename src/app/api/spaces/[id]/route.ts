import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { listingAuthError } from "@/lib/listing-ownership";

const spaceSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(2000),
  spaceType: z.enum(["WAREHOUSE", "COLD", "SILO", "GREENHOUSE", "DRYER", "LAND"]),
  area: z.coerce.number().positive().max(1_000_000).optional().nullable().or(z.literal("")),
  areaUnit: z.string().max(20).optional().nullable(),
  capacityNote: z.string().max(200).optional().nullable(),
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
  priceAmd: z.coerce.number().int().positive().optional().nullable().or(z.literal("")),
  priceUnit: z.enum(["PER_DAY", "PER_MONTH", "LOT"]).optional(),
  marzId: z.string().min(1),
  villageId: z.string().optional().nullable(),
  phone: z.string().min(5).max(40),
  imageUrls: z.array(z.string().min(1)).max(8).optional().default([]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.spaceListing.findUnique({
    where: { id },
    include: {
      marz: true,
      village: true,
      user: { select: { id: true, name: true, farmId: true } },
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
  const existing = await prisma.spaceListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = spaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const listing = await prisma.spaceListing.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      spaceType: d.spaceType,
      area: d.area === "" || d.area == null ? null : Number(d.area),
      areaUnit: d.areaUnit || existing.areaUnit || "m2",
      capacityNote: d.capacityNote || null,
      availableFrom: d.availableFrom ? new Date(d.availableFrom) : null,
      availableTo: d.availableTo ? new Date(d.availableTo) : null,
      priceAmd: d.priceAmd === "" || d.priceAmd == null ? null : Number(d.priceAmd),
      priceUnit: d.priceUnit || "PER_MONTH",
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: d.phone,
      imageUrls: JSON.stringify(filterListingImageUrls(d.imageUrls)),
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
  const existing = await prisma.spaceListing.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.spaceListing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
