import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AnimalForm } from "@/components/AnimalForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/animals/${id}/edit`);
  }

  const listing = await prisma.animalListing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/animals/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <AnimalForm
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          animalType: listing.animalType,
          breed: listing.breed,
          sex: listing.sex,
          ageValue: listing.ageValue,
          ageUnit: listing.ageUnit,
          weightKg: listing.weightKg,
          quantity: listing.quantity,
          purpose: listing.purpose,
          vaccinated: listing.vaccinated,
          healthNotes: listing.healthNotes,
          documentsNote: listing.documentsNote,
          pedigreeNote: listing.pedigreeNote,
          priceAmd: listing.priceAmd,
          priceNegotiable: listing.priceNegotiable,
          priceMode: listing.priceMode,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          imageUrls: parseImageUrls(listing.imageUrls),
        }}
      />
      <p className="muted">
        <Link href={`/animals/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
