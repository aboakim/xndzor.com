import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const expenseSchema = z.object({
  amountAmd: z.number().int().positive().max(500_000_000),
  category: z.enum(["diesel", "labor", "seed", "water", "other"]),
  note: z.string().max(500).optional().nullable(),
  date: z.string().optional().nullable(),
  plotId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.farmExpense.findMany({
    where: { userId: session.user.id },
    include: { plot: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.plotId) {
    const plot = await prisma.plot.findFirst({
      where: { id: d.plotId, userId: session.user.id },
    });
    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 400 });
    }
  }

  const expense = await prisma.farmExpense.create({
    data: {
      userId: session.user.id,
      plotId: d.plotId || null,
      category: d.category,
      amountAmd: d.amountAmd,
      note: d.note || null,
      date: d.date ? new Date(d.date) : new Date(),
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
