import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const journeys = await prisma.cropJourney.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return NextResponse.json(journeys);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    cropName?: string;
    seasonYear?: number;
    plotId?: string | null;
    stages?: { title: string; costAmd: number; note?: string }[];
    yieldKg?: number | null;
    revenueAmd?: number | null;
  };
  if (!body.cropName?.trim()) {
    return NextResponse.json({ error: "cropName required" }, { status: 400 });
  }
  const stages = Array.isArray(body.stages) ? body.stages : [];
  const totalCostAmd = stages.reduce((s, st) => s + (Number(st.costAmd) || 0), 0);

  const row = await prisma.cropJourney.create({
    data: {
      userId: session.user.id,
      cropName: body.cropName.trim().slice(0, 80),
      seasonYear: body.seasonYear || new Date().getFullYear(),
      plotId: body.plotId || null,
      stagesJson: JSON.stringify(
        stages.map((st, i) => ({
          id: `s${i + 1}`,
          title: String(st.title).slice(0, 80),
          costAmd: Math.round(Number(st.costAmd) || 0),
          note: st.note?.slice(0, 200),
        }))
      ),
      totalCostAmd: Math.round(totalCostAmd),
      yieldKg: body.yieldKg != null ? Number(body.yieldKg) : null,
      revenueAmd: body.revenueAmd != null ? Math.round(Number(body.revenueAmd)) : null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
