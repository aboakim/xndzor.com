import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SpaceForm } from "@/components/farm/SpaceForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { MARZES } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function EditSpacePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/farm/spaces/${id}/edit`);
  }

  const listing = await prisma.spaceListing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/farm/spaces`);
  }

  const marzes = MARZES.map((m) => ({
    id: m,
    slug: m,
    name: t(`marzes.${m}` as "marzes.Yerevan"),
  }));

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <SpaceForm
        marzes={marzes}
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          spaceType: listing.spaceType,
          area: listing.area,
          priceAmd: listing.priceAmd,
          marzId: listing.marzId,
          phone: listing.phone,
          capacityNote: listing.capacityNote,
        }}
      />
      <p className="muted">
        <Link href="/farm/spaces">{listing.title}</Link>
      </p>
    </div>
  );
}
