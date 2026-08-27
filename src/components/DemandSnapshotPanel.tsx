import { Link } from "@/i18n/navigation";
import type { DemandSnapshot } from "@/lib/exchange";
import { formatAmd, formatPriceRange } from "@/lib/utils";
import { OverproductionSignal } from "@/components/OverproductionSignal";
import { ProductIcon } from "@/components/AgIcons";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function DemandSnapshotPanel({
  snap,
  t,
  locale,
  compact,
}: {
  snap: DemandSnapshot | null;
  t: TFn;
  locale: string;
  compact?: boolean;
}) {
  if (!snap) {
    return (
      <div className={`demand-snapshot ${compact ? "is-compact" : ""}`}>
        <p className="muted">{t("grow.snapshotEmpty")}</p>
      </div>
    );
  }

  return (
    <div className={`demand-snapshot ${compact ? "is-compact" : ""}`}>
      <div className="demand-snapshot-head">
        <ProductIcon slugOrKey={snap.slug} size={22} />
        <div>
          <h3>{t("grow.snapshotTitle", { crop: t(snap.nameKey) })}</h3>
          <p className="muted">
            {t("grow.snapshotSummary", {
              buyers: snap.buyerCount,
              tons: snap.demandTons,
              price:
                snap.avgPriceAmdPerKg != null
                  ? `${formatAmd(snap.avgPriceAmdPerKg, locale)} ֏`
                  : "—",
            })}
          </p>
        </div>
      </div>

      <OverproductionSignal
        row={{
          slug: snap.slug,
          nameKey: snap.nameKey,
          supplyTons: snap.supplyTons,
          demandTons: snap.demandTons,
          buyerCount: snap.buyerCount,
          avgPriceAmdPerKg: snap.avgPriceAmdPerKg,
          signal: snap.signal,
          gapTons: Math.round(Math.abs(snap.supplyTons - snap.demandTons) * 10) / 10,
        }}
        t={t}
        locale={locale}
        compact
      />

      {snap.buyers.length === 0 ? (
        <p className="muted">{t("plots.noDemand")}</p>
      ) : (
        <ul className="snapshot-buyers">
          {snap.buyers.map((b) => (
            <li key={b.id}>
              <div>
                <strong>
                  {b.userName || t("grow.buyerAnon")}
                  {b.nearby ? (
                    <span className="near-chip">{t("grow.nearby")}</span>
                  ) : null}
                </strong>
                <p>
                  {t(`buyerKinds.${b.buyerKind}` as "buyerKinds.WHOLESALE")} · {b.qtyTons}{" "}
                  {t("units.ton")} · {t(`marzes.${b.marzSlug}` as "marzes.Yerevan")}
                </p>
                <p className="muted small">
                  {formatPriceRange(b.priceMinAmd, b.priceMaxAmd, b.unit, (k) =>
                    t(k as "common.amd")
                  ) || t("detail.priceOpen")}
                </p>
              </div>
              <Link href={`/demand/${b.id}`} className="btn secondary dark">
                {t("common.open")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
