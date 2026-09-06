import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseDiaryText } from "@/lib/farm-os/diary-parse";

const diarySchema = z.object({
  rawText: z.string().min(1).max(4000),
  plotId: z.string().optional().nullable(),
  entryDate: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.farmDiaryEntry.findMany({
    where: { userId: session.user.id },
    include: { plot: { select: { id: true, name: true } } },
    orderBy: { entryDate: "desc" },
    take: 50,
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = diarySchema.safeParse(body);
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

  const structured = parseDiaryText(d.rawText);

  const entry = await prisma.farmDiaryEntry.create({
    data: {
      userId: session.user.id,
      plotId: d.plotId || null,
      rawText: d.rawText,
      parsedJson: JSON.stringify(structured),
      entryDate: d.entryDate ? new Date(d.entryDate) : new Date(),
    },
  });

  // Soft-link: if wateredHa parsed and plot selected, refresh lastIrrigationAt
  if (d.plotId && structured.wateredHa != null) {
    await prisma.plot.update({
      where: { id: d.plotId },
      data: { lastIrrigationAt: new Date() },
    });
  }

  return NextResponse.json({ ...entry, parsed: structured }, { status: 201 });
}
