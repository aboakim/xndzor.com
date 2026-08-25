import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { parseJobTypesJson } from "@/lib/matching";
import { formatAmd } from "@/lib/utils";
import { JobTypeIcon } from "@/components/AgIcons";
import { VillageLink } from "@/components/VillageLink";

export default async function ProvidersBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const providers = await prisma.serviceProvider.findMany({
    where: { status: "ACTIVE" },
    include: { marz: true, village: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="section page-board">
      <div className="section-head">
        <div>
          <h1>{t("providersBoard.title")}</h1>
          <p className="lede">{t("providersBoard.lede")}</p>
        </div>
        <Link href="/providers/new" className="btn primary">
          {t("actions.doJob.title")}
        </Link>
      </div>
      <ul className="match-list">
        {providers.map((p) => {
          const types = parseJobTypesJson(p.jobTypesJson);
          return (
            <li key={p.id} className="match-row">
              <div>
                <Link href={`/providers/${p.id}`}>
                  <strong>{p.title}</strong>
                </Link>
                <p className="icon-label-wrap">
                  {types.map((jt) => (
                    <span key={jt} className="icon-label">
                      <JobTypeIcon type={jt} size={14} />
                      {t(`jobTypes.${jt}` as "jobTypes.HARVEST")}
                    </span>
                  ))}
                  {p.village ? <VillageLink village={p.village} locale={locale} /> : null}
                  <span>
                    · {t(`marzes.${p.marz.slug}` as "marzes.Yerevan")}
                    {p.rateAmd != null ? ` · ${formatAmd(p.rateAmd)} ֏/${p.rateUnit}` : ""}
                  </span>
                </p>
              </div>
              <Link href={`/providers/${p.id}`} className="btn secondary dark">
                {t("common.open")}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
