import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { JobRequestForm } from "@/components/JobRequestForm";
import { Link } from "@/i18n/navigation";
import { canManageListing } from "@/lib/listing-ownership";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/jobs/${id}/edit`);
  }

  const listing = await prisma.jobRequest.findUnique({ where: { id } });
  if (!listing) notFound();
  if (!canManageListing(session, listing.userId)) {
    redirect(`/${locale}/jobs/${id}`);
  }

  return (
    <div className="section form-page">
      <h1>{t("listingEdit.title")}</h1>
      <p className="lede">{t("listingEdit.lede")}</p>
      <JobRequestForm
        listingId={listing.id}
        initial={{
          jobType: listing.jobType,
          title: listing.title,
          description: listing.description,
          hectares: listing.hectares,
          areaNote: listing.areaNote,
          workDate: listing.workDate,
          budgetAmd: listing.budgetAmd,
          marzId: listing.marzId,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
        }}
      />
      <p className="muted">
        <Link href={`/jobs/${id}`}>{listing.title}</Link>
      </p>
    </div>
  );
}
