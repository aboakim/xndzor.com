"use client";

import { useTranslations } from "next-intl";

type Risk = {
  id: string;
  severity: "high" | "medium" | "low";
  titleKey: string;
  detailKey: string;
  detailParams?: Record<string, string | number>;
};

type Props = {
  risks: Risk[];
  placeLabel?: string | null;
  cropLabel?: string | null;
};

export function TomorrowDangerCard({ risks, placeLabel, cropLabel }: Props) {
  const t = useTranslations();

  return (
    <section className="fos-danger-card">
      <header>
        <p className="eyebrow">{t("farmOs.danger.eyebrow")}</p>
        <h2>{t("farmOs.danger.title")}</h2>
        {(placeLabel || cropLabel) && (
          <p className="lede tight">
            {[placeLabel, cropLabel].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>
      <ul className="fos-risk-list">
        {risks.map((r) => (
          <li key={r.id} className={`fos-risk fos-risk-${r.severity}`}>
            <strong>
              {t(r.titleKey as "farmOs.risks.frost")}
            </strong>
            <p>
              {t(
                r.detailKey as "farmOs.risks.frostDetail",
                r.detailParams as Record<string, string | number | Date>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
