"use client";

import { useTranslations } from "next-intl";
import type { TimelineStage } from "@/lib/farm-os/timeline";

export function SeedToSaleTimeline({
  stages,
  profitAmd,
}: {
  stages: TimelineStage[];
  profitAmd?: number | null;
}) {
  const t = useTranslations("farmOs.timeline");

  return (
    <section className="fos-timeline">
      <h2>{t("title")}</h2>
      <p className="lede tight">{t("lede")}</p>
      <ol className="fos-timeline-track">
        {stages.map((s) => (
          <li key={s.id} className={`fos-tl-step is-${s.status}`}>
            <span className="fos-tl-dot" aria-hidden />
            <div>
              <strong>{t(s.id as "plant")}</strong>
              <p className="muted tiny">
                {s.date === "logged" || s.date === "listed" || s.date === "done"
                  ? t(`status.${s.date}` as "status.logged")
                  : s.date || t("missing")}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {profitAmd != null ? (
        <p className="fos-timeline-profit">
          {t("profit", { amount: profitAmd.toLocaleString() })}
        </p>
      ) : (
        <p className="muted tiny">{t("profitNeed")}</p>
      )}
    </section>
  );
}
