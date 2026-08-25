import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jobApplicationSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = jobApplicationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [job, provider] = await Promise.all([
    prisma.jobRequest.findUnique({ where: { id: parsed.data.jobRequestId } }),
    prisma.serviceProvider.findUnique({ where: { id: parsed.data.providerId } }),
  ]);
  if (!job || !provider || job.status !== "ACTIVE" || provider.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid job or provider" }, { status: 400 });
  }
  if (provider.userId !== session.user.id) {
    return NextResponse.json({ error: "Only provider owner can apply" }, { status: 403 });
  }

  const app = await prisma.jobApplication.upsert({
    where: {
      jobRequestId_providerId: {
        jobRequestId: parsed.data.jobRequestId,
        providerId: parsed.data.providerId,
      },
    },
    create: {
      jobRequestId: parsed.data.jobRequestId,
      providerId: parsed.data.providerId,
      fromUserId: session.user.id,
      message: parsed.data.message || null,
      proposedPriceAmd:
        parsed.data.proposedPriceAmd === "" || parsed.data.proposedPriceAmd == null
          ? null
          : Number(parsed.data.proposedPriceAmd),
    },
    update: {
      message: parsed.data.message || null,
      status: "SENT",
    },
  });
  return NextResponse.json(app, { status: 201 });
}
