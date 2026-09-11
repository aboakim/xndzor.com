import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jobRequestSchema, jobStatusSchema } from "@/lib/validations";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { isStatusOnlyBody, listingAuthError } from "@/lib/listing-ownership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      marz: true,
      village: true,
      user: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!listing || listing.status === "HIDDEN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.jobRequest.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isStatusOnlyBody(body)) {
    const parsed = jobStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const listing = await prisma.jobRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(listing);
  }

  const parsed = jobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const listing = await prisma.jobRequest.update({
    where: { id },
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
      imageUrls: JSON.stringify(filterListingImageUrls(d.imageUrls)),
    },
  });
  return NextResponse.json(listing);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.jobRequest.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.jobApplication.deleteMany({ where: { jobRequestId: id } });
  await prisma.jobRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
