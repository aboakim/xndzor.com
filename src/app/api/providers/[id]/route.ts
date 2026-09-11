import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { providerSchema } from "@/lib/validations";
import { resolveLocationRefs } from "@/lib/resolve-refs";
import { filterListingImageUrls } from "@/lib/upload-urls";
import { listingAuthError } from "@/lib/listing-ownership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listing = await prisma.serviceProvider.findUnique({
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
  const existing = await prisma.serviceProvider.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = providerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const locRef = await resolveLocationRefs(d.marzId, d.villageId || null);
  if (!locRef.ok) {
    return NextResponse.json({ error: locRef.error }, { status: 400 });
  }

  const listing = await prisma.serviceProvider.update({
    where: { id },
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
  const existing = await prisma.serviceProvider.findUnique({ where: { id } });
  const authErr = listingAuthError(session, existing?.userId);
  if (authErr) return authErr;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.jobApplication.deleteMany({ where: { providerId: id } });
  await prisma.serviceProvider.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
