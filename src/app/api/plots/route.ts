import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { plotSchema } from "@/lib/validations";
import { estimateYieldTons } from "@/lib/yield";
import { buildTodaySuggestions } from "@/lib/farm-today";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plots = await prisma.plot.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      cropProduct: true,
      marz: true,
      village: true,
      yieldEstimate: true,
      tasks: { where: { status: "OPEN" }, orderBy: { priority: "desc" } },
      futureHarvests: {
        where: { status: "ACTIVE" },
        include: { preOffers: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(plots);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = plotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: d.cropProductId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 400 });

  const est = estimateYieldTons(product.slug, d.hectares, "hy");
  const override =
    d.farmerOverrideTons === "" || d.farmerOverrideTons == null
      ? null
      : Number(d.farmerOverrideTons);

  const plot = await prisma.plot.create({
    data: {
      name: d.name,
      hectares: d.hectares,
      cropProductId: d.cropProductId,
      plantDate: new Date(d.plantDate),
      irrigationNotes: d.irrigationNotes || null,
      lastFertilizer: d.lastFertilizer || null,
      lastIrrigationAt: d.lastIrrigationAt ? new Date(d.lastIrrigationAt) : null,
      harvestFrom: d.harvestFrom ? new Date(d.harvestFrom) : null,
      harvestTo: d.harvestTo ? new Date(d.harvestTo) : null,
      marzId: d.marzId,
      villageId: d.villageId || null,
      userId: session.user.id,
      yieldEstimate: {
        create: {
          tonsMin: est.tonsMin,
          tonsMax: est.tonsMax,
          assumptionNote: est.assumptionNote,
          farmerOverrideTons: override,
          source: "RULE_TABLE",
        },
      },
    },
    include: { yieldEstimate: true, cropProduct: true },
  });

  const suggestions = buildTodaySuggestions({
    cropSlug: product.slug,
    lastIrrigationAt: plot.lastIrrigationAt,
    harvestFrom: plot.harvestFrom,
    harvestTo: plot.harvestTo,
    interestedBuyers: 0,
  });

  if (suggestions.length) {
    await prisma.plotTask.createMany({
      data: suggestions.slice(0, 4).map((s) => ({
        plotId: plot.id,
        kind: s.kind,
        title: s.titleKey,
        detail: formatSuggestionDetail(s),
        priority: s.priority,
        dueDate: new Date(),
        status: "OPEN",
      })),
    });
  }

  return NextResponse.json(plot, { status: 201 });
}

function formatSuggestionDetail(s: {
  detailKey: string;
  detailParams?: Record<string, string | number>;
}): string {
  const p = s.detailParams || {};
  return `${s.detailKey}|${JSON.stringify(p)}`;
}
