import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProducts } from "@/lib/products";
import { PlotForm } from "@/components/PlotForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";

export const dynamic = "force-dynamic";

export default async function EditPlotPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/plots/${id}/edit`);
  }

  const [listing, products] = await Promise.all([
    prisma.plot.findUnique({
      where: { id },
      include: { yieldEstimate: true },
    }),
    getProducts(),
  ]);
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/plots/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <PlotForm
        products={products}
        listingId={listing.id}
        initial={{
          name: listing.name,
          hectares: listing.hectares,
          cropProductId: listing.cropProductId,
          plantDate: listing.plantDate,
          irrigationNotes: listing.irrigationNotes,
          lastFertilizer: listing.lastFertilizer,
          lastIrrigationAt: listing.lastIrrigationAt,
          harvestFrom: listing.harvestFrom,
          harvestTo: listing.harvestTo,
          marzId: listing.marzId,
          villageId: listing.villageId,
          farmerOverrideTons: listing.yieldEstimate?.farmerOverrideTons ?? null,
        }}
      />
      <p className="muted">
        <Link href={`/plots/${id}`}>{listing.name}</Link>
      </p>
    </div>
  );
}
