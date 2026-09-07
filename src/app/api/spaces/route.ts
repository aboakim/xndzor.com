import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveLocationRefs } from "@/lib/resolve-refs";

const spaceSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(2000),
  spaceType: z.enum(["WAREHOUSE", "COLD", "SILO", "GREENHOUSE"]),
  capacityNote: z.string().max(200).optional().nullable(),
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
  priceAmd: z.number().int().positive().optional().nullable(),
  priceUnit: z.enum(["PER_DAY", "PER_MONTH", "LOT"]).optional(),
  marzId: z.string().min(1),
  villageId: z.string().optional().nullable(),
  phone: z.string().min(5).max(40),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marzId = searchParams.get("marzId") || undefined;
  const spaceType = searchParams.get("type") || undefined;

  const listings = await prisma.spaceListing.findMany({
    where: {
      status: "ACTIVE",
      ...(marzId ? { marzId } : {}),
      ...(spaceType ? { spaceType } : {}),
    },
    include: {
      marz: true,
      village: true,
      user: { select: { name: true, farmId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = spaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const listing = await prisma.spaceListing.create({
    data: {
      title: d.title,
      description: d.description,
      spaceType: d.spaceType,
      capacityNote: d.capacityNote || null,
      availableFrom: d.availableFrom ? new Date(d.availableFrom) : null,
      availableTo: d.availableTo ? new Date(d.availableTo) : null,
      priceAmd: d.priceAmd ?? null,
      priceUnit: d.priceUnit || "PER_MONTH",
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: d.phone,
      userId: session.user.id,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
