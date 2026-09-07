import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jobRequestSchema } from "@/lib/validations";
import { resolveLocationRefs } from "@/lib/resolve-refs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobType = searchParams.get("type");
  const marzId = searchParams.get("marz");

  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: "ACTIVE",
      ...(jobType ? { jobType } : {}),
      ...(marzId ? { marzId } : {}),
    },
    include: { marz: true, village: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = jobRequestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const job = await prisma.jobRequest.create({
    data: {
      jobType: d.jobType,
      title: d.title,
      description: d.description,
      hectares: d.hectares === "" || d.hectares == null ? null : Number(d.hectares),
      areaNote: d.areaNote || null,
      workDate: d.workDate ? new Date(d.workDate) : null,
      budgetAmd: d.budgetAmd === "" || d.budgetAmd == null ? null : Number(d.budgetAmd),
      marzId: locRef.marzId,
      villageId: locRef.villageId,
      phone: d.phone,
      whatsapp: d.whatsapp || null,
      userId: session.user.id,
    },
  });
  return NextResponse.json(job, { status: 201 });
}
