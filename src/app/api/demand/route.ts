import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { demandSchema } from "@/lib/validations";

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

  const [product, village] = await Promise.all([
    prisma.product.findUnique({ where: { id: data.productId } }),
    prisma.village.findUnique({ where: { id: data.villageId } }),
  ]);
  if (!product) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  if (!village || village.marzId !== data.marzId) {
    return NextResponse.json({ error: "Village must belong to marz" }, { status: 400 });
  }

  const imageUrls = JSON.stringify(
    (data.imageUrls || []).filter(
      (u) => u.startsWith("/uploads/") && !u.includes("..") && !u.includes("//")
    )
  );

  const demand = await prisma.demand.create({
    data: {
      title: data.title,
      description: data.description,
      productId: data.productId,
      qtyMin: data.qtyMin,
      qtyMax: data.qtyMax === "" || data.qtyMax == null ? null : Number(data.qtyMax),
      unit: data.unit,
      priceMinAmd:
        data.priceMinAmd === "" || data.priceMinAmd == null ? null : Number(data.priceMinAmd),
      priceMaxAmd:
        data.priceMaxAmd === "" || data.priceMaxAmd == null ? null : Number(data.priceMaxAmd),
      timingNote: data.timingNote || null,
      marzId: data.marzId,
      villageId: data.villageId,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      imageUrls,
      userId: session.user.id,
    },
  });

  return NextResponse.json(demand, { status: 201 });
}
