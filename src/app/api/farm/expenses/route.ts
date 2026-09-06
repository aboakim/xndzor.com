import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const CATEGORIES = new Set(["diesel", "labor", "seed", "water", "other"]);

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expenses = await prisma.farmExpense.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 200,
    include: { plot: { select: { id: true, name: true } } },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    category?: string;
    amountAmd?: number;
    note?: string;
    date?: string;
    plotId?: string | null;
  };
  const category = (body.category || "other").toLowerCase();
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const amountAmd = Number(body.amountAmd);
  if (!Number.isFinite(amountAmd) || amountAmd <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const row = await prisma.farmExpense.create({
    data: {
      userId: session.user.id,
      category,
      amountAmd: Math.round(amountAmd),
      note: body.note?.slice(0, 500) || null,
      date: body.date ? new Date(body.date) : new Date(),
      plotId: body.plotId || null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
