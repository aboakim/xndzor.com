import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { SupplyForm } from "@/components/SupplyForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditSupplyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/supply/${id}/edit`);
  }

  const [listing, products] = await Promise.all([
    prisma.supply.findUnique({ where: { id } }),
    getProducts(),
  ]);
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/supply/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <SupplyForm
        products={products}
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          productId: listing.productId,
          qtyAvailable: listing.qtyAvailable,
          unit: listing.unit,
          priceAmd: listing.priceAmd,
          readyInDays: listing.readyInDays,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          imageUrls: parseImageUrls(listing.imageUrls),
        }}
      />
      <p className="muted">
        <Link href={`/supply/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
