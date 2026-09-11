import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { DemandForm } from "@/components/DemandForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditDemandPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/demand/${id}/edit`);
  }

  const [listing, products] = await Promise.all([
    prisma.demand.findUnique({ where: { id } }),
    getProducts(),
  ]);
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/demand/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <DemandForm
        products={products}
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          productId: listing.productId,
          qtyMin: listing.qtyMin,
          qtyMax: listing.qtyMax,
          unit: listing.unit,
          buyerKind: listing.buyerKind,
          priceMinAmd: listing.priceMinAmd,
          priceMaxAmd: listing.priceMaxAmd,
          timingNote: listing.timingNote,
          marzId: listing.marzId,
          villageId: listing.villageId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          imageUrls: parseImageUrls(listing.imageUrls),
        }}
      />
      <p className="muted">
        <Link href={`/demand/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
