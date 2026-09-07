import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { demandSchema } from "@/lib/validations";
import { resolveLocationRefs, resolveProductId } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const marzId = searchParams.get("marz");
  const villageId = searchParams.get("village");
  const q = searchParams.get("q")?.trim();

  const demands = await prisma.demand.findMany({
    where: {
      status: "ACTIVE",
      ...(marzId ? { marzId } : {}),
      ...(villageId ? { villageId } : {}),
      ...(product ? { product: { slug: product } } : {}),
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
    },
    include: {
      product: true,
      marz: true,
      village: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(demands);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = demandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [productRef, locRef] = await Promise.all([
    resolveProductId(data.productId),
    resolveLocationRefs(data.marzId, data.villageId),
  ]);
  if (!productRef.ok) {
    return NextResponse.json({ error: productRef.error }, { status: 400 });
  }
  if (!locRef.ok || !locRef.villageId) {
    return NextResponse.json(
      { error: locRef.ok ? "Village required" : locRef.error },
      { status: 400 },
    );
  }

  const imageUrls = JSON.stringify(filterListingImageUrls(data.imageUrls));

  const demand = await prisma.demand.create({
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
      imageUrls,
      userId: session.user.id,
    },
  });

  return NextResponse.json(demand, { status: 201 });
}
