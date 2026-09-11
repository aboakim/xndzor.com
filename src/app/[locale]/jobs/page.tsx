import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatAmd } from "@/lib/utils";
import { JobTypeIcon } from "@/components/AgIcons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassifiedRow } from "@/components/ClassifiedRow";
import { EmptyState } from "@/components/EmptyState";
import { VillageLink } from "@/components/VillageLink";
import { JOB_TYPES } from "@/lib/matching";

import { seoMessagesMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return seoMessagesMetadata(locale, "/jobs", "jobs");
}

export const dynamic = "force-dynamic";

export default async function JobsBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; marz?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: "ACTIVE",
      ...(sp.type ? { jobType: sp.type } : {}),
      ...(sp.marz ? { marzId: sp.marz } : {}),
    },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("jobsBoard.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("jobsBoard.title")}</h1>
          <p className="lede">{t("jobsBoard.lede")}</p>
        </div>
        <Link href="/jobs/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      <div className="job-type-shortcuts" aria-label={t("jobsForm.jobType")}>
        <Link href="/jobs" className={!sp.type ? "active" : undefined}>
          {t("board.allProducts")}
        </Link>
        {JOB_TYPES.map((jt) => (
          <Link
            key={jt}
            href={`/jobs?type=${jt}`}
            className={sp.type === jt ? "active" : undefined}
          >
            <JobTypeIcon type={jt} size={15} />
            {t(`jobTypes.${jt}` as "jobTypes.HARVEST")}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          message={t("jobsBoard.empty")}
          actionHref="/jobs/new"
          actionLabel={t("actions.orderJob.title")}
        />
      ) : (
        <div className="classified-list">
          {jobs.map((j) => {
            const marzLabel = t(`marzes.${j.marz.slug}` as "marzes.Yerevan");
            const meta = [
              t(`jobTypes.${j.jobType}` as "jobTypes.HARVEST"),
              j.areaNote || (j.hectares != null ? `${j.hectares} ${t("farmos.ha")}` : null),
              j.village ? null : marzLabel,
              j.workDate ? j.workDate.toISOString().slice(0, 10) : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <ClassifiedRow
                key={j.id}
                href={`/jobs/${j.id}`}
                title={j.title}
                meta={meta}
                value={j.budgetAmd != null ? `${formatAmd(j.budgetAmd)} ֏` : undefined}
                icon={<JobTypeIcon type={j.jobType} size={20} />}
                place={
                  j.village ? (
                    <>
                      <VillageLink village={j.village} locale={locale} />
                      <span className="classified-marz">{marzLabel}</span>
                    </>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
