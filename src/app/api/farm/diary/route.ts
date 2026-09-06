import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseDiaryTranscript } from "@/lib/farm-diary-parse";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = await prisma.farmDiaryEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { entryDate: "desc" },
    take: 50,
    include: { plot: { select: { id: true, name: true } } },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    rawText?: string;
    plotId?: string | null;
    entryDate?: string;
  };
  const rawText = (body.rawText || "").trim();
  if (rawText.length < 2) {
    return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
  }
  const parsed = parseDiaryTranscript(rawText);
  const entry = await prisma.farmDiaryEntry.create({
    data: {
      userId: session.user.id,
      rawText: rawText.slice(0, 4000),
      parsedJson: JSON.stringify(parsed),
      plotId: body.plotId || null,
      entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
    },
  });

  // Optionally mirror detected expense
  if (parsed.expenseAmd && parsed.expenseAmd > 0) {
    await prisma.farmExpense.create({
      data: {
        userId: session.user.id,
        category: parsed.expenseCategory || "other",
        amountAmd: parsed.expenseAmd,
        note: rawText.slice(0, 200),
        plotId: body.plotId || null,
        date: entry.entryDate,
      },
    });
  }

  return NextResponse.json({ ...entry, parsed }, { status: 201 });
}
