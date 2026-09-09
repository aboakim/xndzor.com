import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { OwnerContactActions } from "@/components/OwnerContactActions";
import { ShareButtons } from "@/components/ShareButtons";
import { findProvidersForJob, parseJobTypesJson } from "@/lib/matching";
import { formatAmd } from "@/lib/utils";
import { getSession } from "@/lib/session";
import { ApplyToJobButton } from "@/components/ApplyToJobButton";
import { JobTypeIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";
import { SellerCard } from "@/components/SellerCard";
import { USER_PROFILE_SELECT } from "@/lib/profile-privacy";
import { MyListingActions } from "@/components/MyListingActions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: { marz: true, village: true, user: { select: USER_PROFILE_SELECT } },
  });
  if (!job || job.status === "HIDDEN") notFound();
  const isOwner = session?.user?.id === job.userId;

  const providers = await prisma.serviceProvider.findMany({
    where: { status: "ACTIVE" },
    include: { marz: true, user: { select: { name: true } } },
  });

  const matchable = providers.map((p) => ({
    ...p,
    jobTypes: parseJobTypesJson(p.jobTypesJson),
  }));
  const matches = findProvidersForJob(job, matchable);
  const byId = Object.fromEntries(providers.map((p) => [p.id, p]));

  const myProviders = session?.user?.id
    ? providers.filter((p) => p.userId === session.user!.id)
    : [];

  return (
    <div className="section detail-page">
      <p className="eyebrow">{t("actions.orderJob.title")}</p>
      <h1>{job.title}</h1>
      <p className="detail-product">
        <JobTypeIcon type={job.jobType} size={18} />
        {t(`jobTypes.${job.jobType}` as "jobTypes.HARVEST")}
      </p>
      <p className="detail-location">
        {job.village ? (
          <>
            <VillageLink village={job.village} locale={locale} />
            {", "}
          </>
        ) : null}
        {t(`marzes.${job.marz.slug}` as "marzes.Yerevan")}
        {job.workDate ? ` · ${job.workDate.toISOString().slice(0, 10)}` : ""}
      </p>

      <div className="detail-stats">
        <div>
          <span>{t("jobsForm.hectares")}</span>
          <strong>{job.areaNote || (job.hectares != null ? `${job.hectares} հա` : "—")}</strong>
        </div>
        <div>
          <span>{t("jobsForm.budget")}</span>
          <strong>
            {job.budgetAmd != null ? `${formatAmd(job.budgetAmd)} ֏` : t("detail.priceOpen")}
          </strong>
        </div>
      </div>

      <div className="detail-body">
        <h2>{t("detail.description")}</h2>
        <p className="pre-wrap">{job.description}</p>
        <SellerCard
          user={job.user}
          viewerId={session?.user?.id}
          locale={locale}
          compact
        />
      </div>

      <ShareButtons
        title={job.title}
        priceSnippet={
          job.budgetAmd != null ? `${formatAmd(job.budgetAmd)} ֏` : t("detail.priceOpen")
        }
      />

      <OwnerContactActions phone={job.phone} whatsapp={job.whatsapp} ownerId={job.userId} />

      {isOwner ? (
        <section className="owner-panel">
          <MyListingActions
            id={job.id}
            status={job.status}
            apiBase="/api/jobs"
            soldStatus="FILLED"
          />
        </section>
      ) : null}

      <section className="match-section killer-flow">
        <h2>{t("jobsBoard.matchingProviders")}</h2>
        <p className="lede">{t("jobsBoard.matchLede")}</p>
        {matches.length === 0 ? (
          <p className="empty-state">{t("detail.noMatches")}</p>
        ) : (
          <ul className="match-list">
            {matches.map((m) => {
              const p = byId[m.providerId];
              if (!p) return null;
              return (
                <li key={p.id} className="match-row">
                  <div>
                    <Link href={`/providers/${p.id}`}>
                      <strong>{p.title}</strong>
                    </Link>
                    <p>
                      {t(`marzes.${p.marz.slug}` as "marzes.Yerevan")}
                      {p.rateAmd != null
                        ? ` · ${formatAmd(p.rateAmd)} ֏/${p.rateUnit || "ha"}`
                        : ""}
                      {" · "}
                      {t("detail.score", { score: m.score })}
                    </p>
                  </div>
                  <div className="match-actions">
                    <OwnerContactActions
                      ownerId={p.userId}
                      phone={p.phone}
                      whatsapp={p.whatsapp}
                    />
                    {myProviders.some((mp) => mp.id === p.id) ? (
                      <ApplyToJobButton jobRequestId={job.id} providerId={p.id} />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
