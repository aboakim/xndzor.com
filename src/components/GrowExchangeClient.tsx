"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { ArmeniaMarzMap } from "@/components/ArmeniaMarzMap";
import { OverproductionSignal, signalLabel } from "@/components/OverproductionSignal";
import { ProductIcon } from "@/components/AgIcons";
import { formatAmd } from "@/lib/utils";
import type { CropExchangeRow, MarzBalance } from "@/lib/exchange";

type MatchHarvest = {
  id: string;
  title: string;
  qtyExpected: number;
  unit: string;
  harvestDate: string;
  marz: { slug: string };
};

type MatchDemand = {
  id: string;
  title: string;
  buyerKind: string;
  qtyMin: number;
  qtyMax: number | null;
  unit: string;
  marz: { slug: string };
  user: { name: string | null };
};

export function GrowExchangeClient({
  rankings,
  initialProductId,
  initialBalances,
  harvests,
  demands,
  kindBreakdown,
}: {
  rankings: CropExchangeRow[];
  initialProductId: string | null;
  initialBalances: MarzBalance[];
  harvests: MatchHarvest[];
  demands: MatchDemand[];
  kindBreakdown: { kind: string; tons: number; count: number }[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [productId, setProductId] = useState(initialProductId || rankings[0]?.productId || "");
  const [balances, setBalances] = useState(initialBalances);
  const [marzId, setMarzId] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [matchHarvests, setMatchHarvests] = useState(harvests);
  const [matchDemands, setMatchDemands] = useState(demands);
  const [kinds, setKinds] = useState(kindBreakdown);

  const selected = rankings.find((r) => r.productId === productId) || rankings[0] || null;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoadingMap(true);
    fetch(`/api/exchange?mode=detail&productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.balances)) setBalances(data.balances);
        if (Array.isArray(data.harvests)) setMatchHarvests(data.harvests);
        if (Array.isArray(data.demands)) setMatchDemands(data.demands);
        if (Array.isArray(data.kindBreakdown)) setKinds(data.kindBreakdown);
      })
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function pickCrop(id: string) {
    setProductId(id);
    setMarzId(null);
    router.replace(`${pathname}?crop=${encodeURIComponent(id)}`);
  }

  return (
    <div className="grow-exchange">
      <div className="grow-board">
        <section id="grow-rankings" className="grow-panel grow-supply">
          <h2>{t("grow.supplyBoardTitle")}</h2>
          <p className="muted">{t("grow.supplyBoardLede")}</p>
          <ol className="crop-rank-list">
            {[...rankings]
              .sort((a, b) => b.supplyTons - a.supplyTons)
              .map((r, i) => (
                <li key={`s-${r.productId}`}>
                  <button
                    type="button"
                    className={r.productId === productId ? "on" : ""}
                    onClick={() => pickCrop(r.productId)}
                  >
                    <span className="rank-n">{i + 1}</span>
                    <ProductIcon slugOrKey={r.slug} size={18} />
                    <span className="rank-body">
                      <strong>{t(r.nameKey as "products.tomato")}</strong>
                      <em>
                        {r.supplyTons} {t("units.ton")} · {r.harvestCount + r.plotCount}{" "}
                        {t("grow.sources")}
                      </em>
                    </span>
                  </button>
                </li>
              ))}
          </ol>
        </section>

        <section id="grow-demand" className="grow-panel grow-demand">
          <h2>{t("grow.demandBoardTitle")}</h2>
          <p className="muted">{t("grow.demandBoardLede")}</p>
          <ol className="crop-rank-list">
            {rankings.map((r, i) => (
              <li key={`d-${r.productId}`}>
                <button
                  type="button"
                  className={r.productId === productId ? "on" : ""}
                  onClick={() => pickCrop(r.productId)}
                >
                  <span className="rank-n">{i + 1}</span>
                  <ProductIcon slugOrKey={r.slug} size={18} />
                  <span className="rank-body">
                    <strong>{t(r.nameKey as "products.tomato")}</strong>
                    <em>
                      {r.demandTons} {t("units.ton")} · {r.buyerCount} {t("grow.buyers")}
                      {r.avgPriceAmdPerKg != null
                        ? ` · ~${formatAmd(r.avgPriceAmdPerKg, locale)} ֏/${t("units.kg")}`
                        : ""}
                    </em>
                  </span>
                  <span className={`signal-chip is-${r.signal.toLowerCase()} signal-pulse-once`}>
                    {signalLabel(r.signal, (k, v) => t(k as "grow.chipOver", v))}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {selected ? (
        <section id="grow-signal" className="grow-signal-block">
          <OverproductionSignal
            row={selected}
            t={(k, v) => t(k as "grow.signalOverTitle", v)}
            locale={locale}
          />
          {kinds.length > 0 ? (
            <div className="buyer-kind-row">
              {kinds.map((k) => (
                <span key={k.kind} className="buyer-kind-chip">
                  {t(`buyerKinds.${k.kind}` as "buyerKinds.WHOLESALE")}: {k.tons} {t("units.ton")} (
                  {k.count})
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section id="grow-map" className="grow-map-block">
        <div className="grow-map-head">
          <h2>
            {t("grow.mapTitle")}
            {selected ? ` — ${t(selected.nameKey as "products.tomato")}` : ""}
          </h2>
          {loadingMap ? <span className="muted small">{t("common.loading")}</span> : null}
        </div>
        <ArmeniaMarzMap
          balances={balances}
          selectedMarzId={marzId}
          onSelect={setMarzId}
          t={(k, v) => t(k as "grow.mapTitle", v)}
        />
      </section>

      <section className="grow-matches">
        <div className="grow-match-col">
          <h3>{t("grow.matchSupply")}</h3>
          {matchHarvests.length === 0 ? (
            <p className="muted">{t("forwardBoard.empty")}</p>
          ) : (
            <ul className="match-list">
              {matchHarvests.map((h) => (
                <li key={h.id} className="match-row">
                  <div>
                    <strong>{h.title}</strong>
                    <p>
                      {h.qtyExpected} {t(`units.${h.unit}` as "units.ton")} ·{" "}
                      {t(`marzes.${h.marz.slug}` as "marzes.Yerevan")}
                    </p>
                  </div>
                  <Link href={`/forward/${h.id}`} className="btn secondary dark">
                    {t("common.open")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grow-match-col">
          <h3>{t("grow.matchDemand")}</h3>
          {matchDemands.length === 0 ? (
            <p className="muted">{t("demandBoard.empty")}</p>
          ) : (
            <ul className="match-list">
              {matchDemands.map((d) => (
                <li key={d.id} className="match-row">
                  <div>
                    <strong>{d.user.name || d.title}</strong>
                    <p>
                      {t(`buyerKinds.${d.buyerKind}` as "buyerKinds.WHOLESALE")} · {d.qtyMin}
                      {d.qtyMax ? `–${d.qtyMax}` : "+"} {t(`units.${d.unit}` as "units.kg")} ·{" "}
                      {t(`marzes.${d.marz.slug}` as "marzes.Yerevan")}
                    </p>
                  </div>
                  <Link href={`/demand/${d.id}`} className="btn secondary dark">
                    {t("common.open")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="grow-cta-row">
        <Link href="/plots/new" className="btn primary">
          {t("grow.ctaPlot")}
        </Link>
        <Link href="/forward/new" className="btn ghost">
          {t("grow.ctaForward")}
        </Link>
        <Link href="/demand" className="btn ghost">
          {t("grow.ctaDemand")}
        </Link>
      </div>
    </div>
  );
}
