import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { supplySchema } from "@/lib/validations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const marzId = searchParams.get("marz");
  const villageId = searchParams.get("village");
  const q = searchParams.get("q")?.trim();

  const supplies = await prisma.supply.findMany({
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

  return NextResponse.json(supplies);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = supplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [product, village] = await Promise.all([
    prisma.product.findUnique({ where: { id: data.productId } }),
    data.villageId
      ? prisma.village.findUnique({ where: { id: data.villageId } })
      : Promise.resolve(null),
  ]);
  if (!product) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  if (data.villageId && (!village || village.marzId !== data.marzId)) {
    return NextResponse.json({ error: "Village must belong to marz" }, { status: 400 });
  }
  if (!data.villageId) {
    return NextResponse.json({ error: "Village required" }, { status: 400 });
  }

  const imageUrls = JSON.stringify(
    (data.imageUrls || []).filter(
      (u) => u.startsWith("/uploads/") && !u.includes("..") && !u.includes("//")
    )
  );

  const supply = await prisma.supply.create({
    data: {
      title: data.title,
      description: data.description,
      productId: data.productId,
      qtyAvailable: data.qtyAvailable,
      unit: data.unit,
      priceAmd: data.priceAmd === "" || data.priceAmd == null ? null : Number(data.priceAmd),
      readyInDays: data.readyInDays ?? 0,
      marzId: data.marzId,
      villageId: data.villageId,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      imageUrls,
      userId: session.user.id,
    },
  });

  return NextResponse.json(supply, { status: 201 });
}
