import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { futureHarvestSchema, forwardInterestSchema } from "@/lib/validations";
import { resolveLocationRefs, resolveProductId } from "@/lib/resolve-refs";

export async function GET() {
  const crops = await prisma.futureHarvest.findMany({
    where: { status: "ACTIVE" },
    include: { product: true, marz: true, village: true, preOffers: true, plot: true },
    orderBy: { harvestDate: "asc" },
    take: 100,
  });
  return NextResponse.json(crops);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.forwardCropId || body.futureHarvestId) {
    const parsed = forwardInterestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const futureHarvestId = parsed.data.futureHarvestId || parsed.data.forwardCropId!;
    const interest = await prisma.preOffer.upsert({
      where: {
        futureHarvestId_fromUserId: {
          futureHarvestId,
          fromUserId: session.user.id,
        },
      },
      create: {
        futureHarvestId,
        fromUserId: session.user.id,
        qtyWanted: parsed.data.qtyWanted,
        message: parsed.data.message || null,
      },
      update: {
        qtyWanted: parsed.data.qtyWanted,
        message: parsed.data.message || null,
        status: "SENT",
      },
    });
    return NextResponse.json(interest, { status: 201 });
  }

  const parsed = futureHarvestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  if (d.plotId) {
    const plot = await prisma.plot.findFirst({
      where: { id: d.plotId, userId: session.user.id },
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

  const crop = await prisma.futureHarvest.create({
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
      userId: session.user.id,
      imageUrls: JSON.stringify(
        (d.imageUrls || []).filter(
          (u) => u.startsWith("/uploads/") && !u.includes("..") && !u.includes("//"),
        ),
      ),
    },
  });
  return NextResponse.json(crop, { status: 201 });
}
