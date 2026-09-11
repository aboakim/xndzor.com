import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { ForwardCropForm } from "@/components/ForwardCropForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditForwardPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/forward/${id}/edit`);
  }

  const [listing, products] = await Promise.all([
    prisma.futureHarvest.findUnique({ where: { id } }),
    getProducts(),
  ]);
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/forward/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <ForwardCropForm
        products={products}
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          productId: listing.productId,
          qtyExpected: listing.qtyExpected,
          unit: listing.unit,
          harvestDate: listing.harvestDate,
          priceAmd: listing.priceAmd,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          plotId: listing.plotId,
          imageUrls: parseImageUrls(listing.imageUrls),
        }}
      />
      <p className="muted">
        <Link href={`/forward/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
