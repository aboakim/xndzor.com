import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const villageId = searchParams.get("villageId");
  if (!villageId) {
    return NextResponse.json({ error: "villageId required" }, { status: 400 });
  }
  const goals = await prisma.villageGoal.findMany({
    where: { villageId, status: "OPEN" },
    include: {
      joins: { include: { user: { select: { id: true, name: true, farmName: true } } } },
      village: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    action?: "create" | "join";
    villageId?: string;
    title?: string;
    targetQty?: number;
    unit?: string;
    goalId?: string;
    qty?: number;
  };

  if (body.action === "join") {
    if (!body.goalId || body.qty == null) {
      return NextResponse.json({ error: "goalId and qty required" }, { status: 400 });
    }
    const qty = Number(body.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Invalid qty" }, { status: 400 });
    }
    const goal = await prisma.villageGoal.findUnique({ where: { id: body.goalId } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.villageGoalJoin.upsert({
      where: { goalId_userId: { goalId: body.goalId, userId: session.user.id } },
      create: { goalId: body.goalId, userId: session.user.id, qty },
      update: { qty },
    });
    const joins = await prisma.villageGoalJoin.findMany({ where: { goalId: body.goalId } });
    const progressQty = joins.reduce((s, j) => s + j.qty, 0);
    const updated = await prisma.villageGoal.update({
      where: { id: body.goalId },
      data: { progressQty },
      include: {
        joins: { include: { user: { select: { id: true, name: true, farmName: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  if (!body.villageId || !body.title?.trim() || body.targetQty == null) {
    return NextResponse.json({ error: "villageId, title, targetQty required" }, { status: 400 });
  }
  const row = await prisma.villageGoal.create({
    data: {
      villageId: body.villageId,
      title: body.title.trim().slice(0, 160),
      targetQty: Number(body.targetQty),
      unit: body.unit || "ton",
    },
  });
  return NextResponse.json(row, { status: 201 });
}
