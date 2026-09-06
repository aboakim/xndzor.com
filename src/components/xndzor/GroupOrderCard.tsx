"use client";

import { useTranslations } from "next-intl";
import { getDemoGroupOrder } from "@/lib/xndzor-solution";
import { formatAmd } from "@/lib/utils";

type GroupOrderCardProps = {
  locale: string;
};

export function GroupOrderCard({ locale }: GroupOrderCardProps) {
  const t = useTranslations("xndzor.groupOrder");
  const demo = getDemoGroupOrder();

  return (
    <article className="xndzor-group-card">
      <header className="xndzor-group-header">
        <span className="xndzor-group-icon" aria-hidden>
          👥
        </span>
        <div>
          <h3 className="xndzor-group-title">{t("title")}</h3>
          <p className="xndzor-group-sub">{t("subtitle")}</p>
        </div>
      </header>

      <div className="xndzor-group-stats">
        <div className="xndzor-group-stat">
          <strong>{demo.farmCount}</strong>
          <span>{t("farms")}</span>
        </div>
        <div className="xndzor-group-stat">
          <strong>{demo.totalHa} {t("ha")}</strong>
          <span>{t("totalArea")}</span>
        </div>
        <div className="xndzor-group-stat xndzor-group-stat-savings">
          <strong>−{demo.savingsPct}%</strong>
          <span>{t("savings")}</span>
        </div>
      </div>

      <ul className="xndzor-group-neighbors">
        {demo.neighbors.map((n) => (
          <li key={n.name}>
            <span className="xndzor-neighbor-name">{n.name}</span>
            <span>
              {n.ha} {t("ha")} · {t(`crops.${n.crop}` as "crops.apple")}
            </span>
          </li>
        ))}
      </ul>

      <div className="xndzor-group-pricing">
        <div className="xndzor-price-row">
          <span>{t("soloPrice")}</span>
          <del>{formatAmd(demo.soloPriceAmd, locale)} ֏</del>
        </div>
        <div className="xndzor-price-row xndzor-price-row-group">
          <span>{t("groupPrice")}</span>
          <strong>{formatAmd(demo.groupPriceAmd, locale)} ֏</strong>
          <em>{t("perFarm")}</em>
        </div>
      </div>

      <button type="button" className="btn primary xndzor-group-cta">
        {t("joinNeighbors")}
      </button>
    </article>
  );
}
