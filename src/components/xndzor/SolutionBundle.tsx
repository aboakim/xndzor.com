"use client";

import { useTranslations } from "next-intl";
import type { SolutionBundle } from "@/lib/xndzor-solution";
import { formatAmd } from "@/lib/utils";

type SolutionBundleCardProps = {
  bundle: SolutionBundle;
  locale: string;
};

type TFn = ReturnType<typeof useTranslations>;

function itemLabel(
  t: TFn,
  type: string,
  count: number,
  detail?: string,
): string {
  const base = t(`items.${type}` as "items.workers", { count });
  if (detail) {
    const detailKey = `itemDetails.${detail}` as "itemDetails.harvest_crew";
    const d = t(detailKey);
    if (d && d !== detailKey) return `${base} · ${d}`;
  }
  return base;
}

export function SolutionBundleCard({ bundle, locale }: SolutionBundleCardProps) {
  const t = useTranslations("xndzor");

  const params = { ...bundle.summaryParams };
  if (bundle.crop) {
    params.crop = t(`crops.${bundle.crop}` as "crops.apple");
  }
  if (params.need && typeof params.need === "string") {
    params.need = t(`needTypes.${params.need}` as "needTypes.harvest");
  }

  const summary = t(
    bundle.summaryKey as "bundle.appleHarvest",
    params as Record<string, string | number> | undefined,
  );

  return (
    <article className="xndzor-bundle-card">
      <header className="xndzor-bundle-header">
        <div>
          <p className="xndzor-bundle-eyebrow">{t("bundleEyebrow")}</p>
          <h2 className="xndzor-bundle-title">{summary}</h2>
        </div>
        <span className={`xndzor-confidence is-${bundle.confidence}`}>
          {t(`confidence.${bundle.confidence}` as "confidence.high")}
        </span>
      </header>

      <ul className="xndzor-bundle-items">
        {bundle.items.map((item, i) => (
          <li key={`${item.type}-${i}`}>
            <span className="xndzor-bundle-item-count">{item.count}</span>
            <span>{itemLabel(t, item.type, item.count, item.detail)}</span>
          </li>
        ))}
      </ul>

      <div className="xndzor-bundle-meta">
        <div>
          <span className="xndzor-bundle-meta-label">{t("estimatedPrice")}</span>
          <strong className="xndzor-bundle-price">
            ~{formatAmd(bundle.priceAmd, locale)} ֏
          </strong>
          {bundle.priceNoteKey ? (
            <span className="xndzor-bundle-price-note">
              {t(bundle.priceNoteKey as "bundle.priceIncludesAll")}
            </span>
          ) : null}
        </div>
        <div>
          <span className="xndzor-bundle-meta-label">{t("startDate")}</span>
          <strong>{bundle.startDate}</strong>
        </div>
        <div>
          <span className="xndzor-bundle-meta-label">{t("location")}</span>
          <strong>{t(`locations.${bundle.location}` as "locations.Armavir")}</strong>
        </div>
      </div>

      <div className="xndzor-bundle-actions">
        <button type="button" className="btn primary xndzor-organize-btn">
          {t("organizeAll")}
        </button>
        <button type="button" className="btn ghost">
          {t("adjustBundle")}
        </button>
      </div>
    </article>
  );
}
