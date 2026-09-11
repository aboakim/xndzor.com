import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { futureHarvestSchema, forwardStatusSchema } from "@/lib/validations";
import { resolveLocationRefs, resolveProductId } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { isStatusOnlyBody, listingAuthError } from "@/lib/listing-ownership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.futureHarvest.findUnique({
    where: { id },
    include: {
      product: true,
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
  const existing = await prisma.futureHarvest.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isStatusOnlyBody(body)) {
    const parsed = forwardStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const listing = await prisma.futureHarvest.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(listing);
  }

  const parsed = futureHarvestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.plotId) {
    const plot = await prisma.plot.findFirst({
      where: { id: d.plotId, userId: existing.userId },
    });
    if (!plot) return NextResponse.json({ error: "Plot not found" }, { status: 404 });
  }

  const [productRef, locRef] = await Promise.all([
    resolveProductId(d.productId),
    resolveLocationRefs(d.marzId, d.villageId || null),
  ]);
  if (!productRef.ok) {
    return NextResponse.json({ error: productRef.error }, { status: 400 });
  }
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const listing = await prisma.futureHarvest.update({
    where: { id },
    data: {
      productId: productRef.productId,
      plotId: d.plotId || null,
      title: d.title,
      description: d.description,
      qtyExpected: d.qtyExpected,
      unit: d.unit,
      harvestDate: new Date(d.harvestDate),
      priceAmd: d.priceAmd === "" || d.priceAmd == null ? null : Number(d.priceAmd),
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
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
  const existing = await prisma.futureHarvest.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.preOffer.deleteMany({ where: { futureHarvestId: id } });
  await prisma.productBatch.updateMany({
    where: { futureHarvestId: id },
    data: { futureHarvestId: null },
  });
  await prisma.futureHarvest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
