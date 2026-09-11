import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { demandSchema, demandStatusSchema } from "@/lib/validations";
import { resolveLocationRefs, resolveProductId } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { isStatusOnlyBody, listingAuthError } from "@/lib/listing-ownership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.demand.findUnique({
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
  const existing = await prisma.demand.findUnique({ where: { id } });
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
    const parsed = demandStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const listing = await prisma.demand.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(listing);
  }

  const parsed = demandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [productRef, locRef] = await Promise.all([
    resolveProductId(data.productId),
    resolveLocationRefs(data.marzId, data.villageId || null),
  ]);
  if (!productRef.ok) {
    return NextResponse.json({ error: productRef.error }, { status: 400 });
  }
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }
  if (data.marzId !== "Yerevan" && !locRef.villageId) {
    return NextResponse.json({ error: "Village required" }, { status: 400 });
  }

  const listing = await prisma.demand.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      productId: productRef.productId,
      qtyMin: data.qtyMin,
      qtyMax: data.qtyMax === "" || data.qtyMax == null ? null : Number(data.qtyMax),
      unit: data.unit,
      priceMinAmd:
        data.priceMinAmd === "" || data.priceMinAmd == null ? null : Number(data.priceMinAmd),
      priceMaxAmd:
        data.priceMaxAmd === "" || data.priceMaxAmd == null ? null : Number(data.priceMaxAmd),
      timingNote: data.timingNote || null,
      buyerKind: data.buyerKind || "WHOLESALE",
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
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
  const existing = await prisma.demand.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.offer.deleteMany({ where: { demandId: id } });
  await prisma.demand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
