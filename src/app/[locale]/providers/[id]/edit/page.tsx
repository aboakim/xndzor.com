import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProviderForm } from "@/components/ProviderForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";

export const dynamic = "force-dynamic";

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/providers/${id}/edit`);
  }

  const listing = await prisma.serviceProvider.findUnique({ where: { id } });
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/providers/${id}`);
  }

  let jobTypes: string[] = ["HARVEST"];
  try {
    const parsed = JSON.parse(listing.jobTypesJson || "[]");
    if (Array.isArray(parsed) && parsed.length) jobTypes = parsed.map(String);
  } catch {
    /* keep default */
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <ProviderForm
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          jobTypes,
          hectaresMax: listing.hectaresMax,
          rateAmd: listing.rateAmd,
          rateUnit: listing.rateUnit || "ha",
          availableFrom: listing.availableFrom,
          availableTo: listing.availableTo,
          coverageNote: listing.coverageNote,
          marzId: listing.marzId,
          phone: listing.phone || "",
          whatsapp: listing.whatsapp,
        }}
      />
      <p className="muted">
        <Link href={`/providers/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
