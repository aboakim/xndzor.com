import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { providerSchema } from "@/lib/validations";
import { resolveLocationRefs } from "@/lib/resolve-refs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marzId = searchParams.get("marz");
  const providers = await prisma.serviceProvider.findMany({
    where: {
      status: "ACTIVE",
      ...(marzId ? { marzId } : {}),
    },
    include: { marz: true, village: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(providers);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = providerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const provider = await prisma.serviceProvider.create({
    data: {
      title: d.title,
      description: d.description,
      jobTypesJson: JSON.stringify(d.jobTypes),
      coverageNote: d.coverageNote || null,
      hectaresMax: d.hectaresMax === "" || d.hectaresMax == null ? null : Number(d.hectaresMax),
      rateAmd: d.rateAmd === "" || d.rateAmd == null ? null : Number(d.rateAmd),
      rateUnit: d.rateUnit || "ha",
      availableFrom: d.availableFrom ? new Date(d.availableFrom) : null,
      availableTo: d.availableTo ? new Date(d.availableTo) : null,
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      userId: session.user.id,
    },
  });
  return NextResponse.json(provider, { status: 201 });
}
