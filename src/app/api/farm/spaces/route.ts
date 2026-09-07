import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveLocationRefs } from "@/lib/resolve-refs";

const TYPES = new Set(["WAREHOUSE", "COLD", "SILO", "GREENHOUSE", "DRYER", "LAND"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";
  const session = await getSession();

  const spaces = await prisma.spaceListing.findMany({
    where: mine
      ? { userId: session?.user?.id ?? "__none__" }
      : { status: "ACTIVE" },
    include: {
      marz: true,
      village: true,
      user: { select: { id: true, name: true, farmName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(spaces);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    title?: string;
    description?: string;
    spaceType?: string;
    area?: number | null;
    areaUnit?: string;
    capacityNote?: string;
    availableFrom?: string | null;
    priceAmd?: number | null;
    priceUnit?: string;
    marzId?: string;
    villageId?: string | null;
    phone?: string;
  };
  const spaceType = (body.spaceType || "").toUpperCase();
  if (!TYPES.has(spaceType)) {
    return NextResponse.json({ error: "Invalid spaceType" }, { status: 400 });
  }
  if (!body.title?.trim() || !body.marzId) {
    return NextResponse.json({ error: "title and marzId required" }, { status: 400 });
  }

  const locRef = await resolveLocationRefs(body.marzId, body.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const row = await prisma.spaceListing.create({
    data: {
      title: body.title.trim().slice(0, 120),
      description: (body.description || "").slice(0, 2000),
      spaceType,
      area: body.area != null ? Number(body.area) : null,
      areaUnit: body.areaUnit || "m2",
      capacityNote: body.capacityNote?.slice(0, 200) || null,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      priceAmd: body.priceAmd != null ? Math.round(Number(body.priceAmd)) : null,
      priceUnit: body.priceUnit || "PER_MONTH",
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: (body.phone || "").slice(0, 40),
      userId: session.user.id,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
