import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MachineryForm } from "@/components/MachineryForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditMachineryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/machinery/${id}/edit`);
  }

  const listing = await prisma.machineryListing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/machinery/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <MachineryForm
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          machineryType: listing.machineryType,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          engineHours: listing.engineHours,
          mileageKm: listing.mileageKm,
          condition: listing.condition,
          priceAmd: listing.priceAmd,
          priceNegotiable: listing.priceNegotiable,
          powerHp: listing.powerHp,
          transmission: listing.transmission,
          driveType: listing.driveType,
          fuel: listing.fuel,
          workingWidth: listing.workingWidth,
          capacity: listing.capacity,
          attachments: listing.attachments,
          documentsNote: listing.documentsNote,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          imageUrls: parseImageUrls(listing.imageUrls),
        }}
      />
      <p className="muted">
        <Link href={`/machinery/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
