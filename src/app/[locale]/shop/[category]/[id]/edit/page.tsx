import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CatalogForm } from "@/components/CatalogForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";
import { CATALOG_ROUTE, isCatalogCategory, parseSpecs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function EditCatalogPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; id: string }>;
}) {
  const { locale, category: categorySlug, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(
      `/${locale}/auth/login?callbackUrl=/${locale}/shop/${categorySlug}/${id}/edit`,
    );
  }

  const listing = await prisma.catalogListing.findUnique({ where: { id } });
  if (!listing || !isCatalogCategory(listing.category)) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/shop/${CATALOG_ROUTE[listing.category]}/${id}`);
  }

  const route = CATALOG_ROUTE[listing.category];

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <CatalogForm
        category={listing.category}
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
          subtype: listing.subtype,
          quantity: listing.quantity,
          unit: listing.unit,
          packageSize: listing.packageSize,
          priceAmd: listing.priceAmd,
          priceNegotiable: listing.priceNegotiable,
          priceUnit: listing.priceUnit,
          expiryDate: listing.expiryDate?.toISOString() ?? null,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          imageUrls: parseImageUrls(listing.imageUrls),
          specs: parseSpecs(listing.specsJson),
        }}
      />
      <p className="muted">
        <Link href={`/shop/${route}/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
