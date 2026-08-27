import type { CropExchangeRow, SignalLevel } from "@/lib/exchange";
import { formatAmd } from "@/lib/utils";

type TFn = (key: string, values?: Record<string, string | number>) => string;

export function OverproductionSignal({
  row,
  t,
  locale,
  compact,
  showMethod = true,
}: {
  row: Pick<
    CropExchangeRow,
    | "slug"
    | "nameKey"
    | "supplyTons"
    | "demandTons"
    | "buyerCount"
    | "avgPriceAmdPerKg"
    | "signal"
    | "gapTons"
  > | null;
  t: TFn;
  locale: string;
  compact?: boolean;
  showMethod?: boolean;
}) {
  if (!row || row.signal === "NO_DATA") {
    return (
      <aside className={`overprod-signal is-empty ${compact ? "is-compact" : ""}`}>
        <p className="muted">{t("grow.signalEmpty")}</p>
        {showMethod ? <p className="method-badge">{t("grow.methodBadge")}</p> : null}
      </aside>
    );
  }

  const crop = t(row.nameKey);
  const levelClass =
    row.signal === "OVER" ? "is-over" : row.signal === "UNDER" ? "is-under" : "is-balanced";

  return (
    <aside className={`overprod-signal ${levelClass} ${compact ? "is-compact" : ""}`}>
      <div className="overprod-signal-head">
        <span className="overprod-emoji signal-pulse-once" aria-hidden>
          {row.signal === "OVER" ? "⚠️" : row.signal === "UNDER" ? "🟢" : "⚖️"}
        </span>
        <div>
          <strong className="overprod-title">
            {row.signal === "OVER"
              ? t("grow.signalOverTitle", { crop })
              : row.signal === "UNDER"
                ? t("grow.signalUnderTitle", { crop })
                : t("grow.signalBalancedTitle", { crop })}
          </strong>
          <p className="overprod-body">
            {row.signal === "OVER"
              ? t("grow.signalOverBody")
              : row.signal === "UNDER"
                ? t("grow.signalUnderBody")
                : t("grow.signalBalancedBody")}
          </p>
        </div>
      </div>
      <div className="overprod-stats">
        <div>
          <span>{t("grow.expectedSupply")}</span>
          <strong>
            {row.supplyTons} {t("units.ton")}
          </strong>
        </div>
        <div>
          <span>{t("grow.openDemand")}</span>
          <strong>
            {row.demandTons} {t("units.ton")}
          </strong>
        </div>
        <div>
          <span>{t("grow.buyers")}</span>
          <strong>{row.buyerCount}</strong>
        </div>
        {row.avgPriceAmdPerKg != null ? (
          <div>
            <span>{t("grow.avgPrice")}</span>
            <strong>
              {formatAmd(row.avgPriceAmdPerKg, locale)} ֏/{t("units.kg")}
            </strong>
          </div>
        ) : null}
        <div>
          <span>{t("grow.gap")}</span>
          <strong>
            {row.gapTons} {t("units.ton")}
          </strong>
        </div>
      </div>
      {showMethod ? <p className="method-badge">{t("grow.methodBadge")}</p> : null}
    </aside>
  );
}

export function signalLabel(signal: SignalLevel, t: TFn): string {
  if (signal === "OVER") return `⚠️ ${t("grow.chipOver")}`;
  if (signal === "UNDER") return `🟢 ${t("grow.chipUnder")}`;
  if (signal === "BALANCED") return `⚖️ ${t("grow.chipBalanced")}`;
  return t("grow.chipNoData");
}
