import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";
  const session = await getSession();

  const rows = await prisma.returnCapacityOffer.findMany({
    where: mine
      ? { userId: session?.user?.id ?? "__none__" }
      : { status: "OPEN" },
    include: { user: { select: { id: true, name: true, farmName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    fromNote?: string;
    toNote?: string;
    fromMarzId?: string | null;
    toMarzId?: string | null;
    freeTons?: number | null;
    priceAmd?: number | null;
    departAt?: string | null;
    dateHint?: string | null;
    capacityNote?: string | null;
    phone?: string | null;
  };
  if (!body.fromNote?.trim() || !body.toNote?.trim()) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const row = await prisma.returnCapacityOffer.create({
    data: {
      userId: session.user.id,
      fromNote: body.fromNote.trim().slice(0, 120),
      toNote: body.toNote.trim().slice(0, 120),
      fromMarzId: body.fromMarzId || null,
      toMarzId: body.toMarzId || null,
      freeTons: body.freeTons != null ? Number(body.freeTons) : null,
      priceAmd: body.priceAmd != null ? Math.round(Number(body.priceAmd)) : null,
      departAt: body.departAt ? new Date(body.departAt) : null,
      dateHint: body.dateHint?.slice(0, 80) || null,
      capacityNote: body.capacityNote?.slice(0, 200) || null,
      phone: body.phone?.slice(0, 40) || null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
