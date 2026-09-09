import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { findJobsForProvider, parseJobTypesJson } from "@/lib/matching";
import { formatAmd } from "@/lib/utils";
import { ApplyToJobButton } from "@/components/ApplyToJobButton";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const provider = await prisma.serviceProvider.findUnique({
    where: { id },
    include: { marz: true, user: { select: { id: true, name: true } } },
  });
  if (!provider || provider.status === "HIDDEN") notFound();

  const jobTypes = parseJobTypesJson(provider.jobTypesJson);
  const jobs = await prisma.jobRequest.findMany({
    where: { status: "ACTIVE" },
    include: { marz: true },
  });
  const matches = findJobsForProvider({ ...provider, jobTypes }, jobs);
  const byId = Object.fromEntries(jobs.map((j) => [j.id, j]));
  const isOwner = session?.user?.id === provider.userId;

  return (
    <div className="section detail-page">
      <p className="eyebrow">{t("actions.doJob.title")}</p>
      <h1>{provider.title}</h1>
      <p className="detail-product">
        {jobTypes.map((jt) => t(`jobTypes.${jt}` as "jobTypes.HARVEST")).join(" · ")}
      </p>
      <p className="detail-location">{t(`marzes.${provider.marz.slug}` as "marzes.Yerevan")}</p>

      <div className="detail-body">
        <p className="pre-wrap">{provider.description}</p>
        {provider.rateAmd != null ? (
          <p>
            <strong>
              {formatAmd(provider.rateAmd)} ֏ / {provider.rateUnit}
            </strong>
          </p>
        ) : null}
      </div>

      <ShareButtons
        title={provider.title}
        priceSnippet={
          provider.rateAmd != null
            ? `${formatAmd(provider.rateAmd)} ֏ / ${provider.rateUnit}`
            : null
        }
      />

      <OwnerContactActions
        ownerId={provider.userId}
        phone={provider.phone}
        whatsapp={provider.whatsapp}
      />

      <section className="match-section killer-flow">
        <h2>{t("providersBoard.openJobs")}</h2>
        {matches.length === 0 ? (
          <p className="empty-state">{t("detail.noMatches")}</p>
        ) : (
          <ul className="match-list">
            {matches.map((m) => {
              const j = byId[m.jobRequestId];
              if (!j) return null;
              return (
                <li key={j.id} className="match-row">
                  <div>
                    <Link href={`/jobs/${j.id}`}>
                      <strong>{j.title}</strong>
                    </Link>
                    <p>
                      {t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST")} ·{" "}
                      {t(`marzes.${j.marz.slug}` as "marzes.Yerevan")} ·{" "}
                      {t("detail.score", { score: m.score })}
                    </p>
                  </div>
                  {isOwner ? (
                    <ApplyToJobButton jobRequestId={j.id} providerId={provider.id} />
                  ) : (
                    <Link href={`/jobs/${j.id}`} className="btn secondary">
                      {t("common.open")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
