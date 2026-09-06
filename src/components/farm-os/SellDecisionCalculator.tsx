"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { formatAmd } from "@/lib/utils";
import {
  bestScenario,
  computeSellScenarios,
  type SellScenario,
} from "@/lib/farm-os/sell-decision";

type CropOption = { slug: string; label: string; defaultPrice: number };

type Props = {
  crops: CropOption[];
  defaultQty?: number;
  embedded?: boolean;
};

export function SellDecisionCalculator({ crops, defaultQty = 10, embedded }: Props) {
  const t = useTranslations("farmOs.sell");
  const [qty, setQty] = useState(defaultQty);
  const [crop, setCrop] = useState(crops[0]?.slug || "tomato");
  const [price, setPrice] = useState(crops[0]?.defaultPrice || 160000);
  const [pending, startTransition] = useTransition();

  const scenarios: SellScenario[] = useMemo(
    () =>
      computeSellScenarios({
        qtyTons: qty,
        pricePerTonAmd: price,
        cropSlug: crop,
      }),
    [qty, price, crop]
  );
  const best = bestScenario(scenarios);

  return (
    <section className={`fos-sell${embedded ? " is-embedded" : ""}`}>
      <header>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2>{t("title")}</h2>
        <p className="lede tight">{t("lede")}</p>
      </header>

      <div className="fos-sell-form">
        <label>
          <span>{t("qty")}</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={qty}
            onChange={(e) =>
              startTransition(() => setQty(Number(e.target.value) || 0))
            }
          />
        </label>
        <label>
          <span>{t("crop")}</span>
          <select
            value={crop}
            onChange={(e) => {
              const slug = e.target.value;
              const c = crops.find((x) => x.slug === slug);
              startTransition(() => {
                setCrop(slug);
                if (c) setPrice(c.defaultPrice);
              });
            }}
          >
            {crops.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("price")}</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={(e) =>
              startTransition(() => setPrice(Number(e.target.value) || 0))
            }
          />
        </label>
      </div>

      <ul className={`fos-sell-scenarios${pending ? " is-pending" : ""}`}>
        {scenarios.map((s) => (
          <li
            key={s.id}
            className={`fos-sell-card fos-risk-${s.riskBand}${
              s.id === best.id ? " is-best" : ""
            }`}
          >
            <strong>{t(`scenario.${s.id}` as "scenario.now")}</strong>
            <p className="fos-sell-net">{formatAmd(s.netAmd)} ֏</p>
            <p className="muted tiny">
              {t("perTon", { price: formatAmd(s.pricePerTonAmd) })}
              {s.storageCostAmd > 0
                ? ` · ${t("storage", { cost: formatAmd(s.storageCostAmd) })}`
                : ""}
            </p>
            <p className="fos-sell-risk">
              {t(`riskBand.${s.riskBand}` as "riskBand.low")} —{" "}
              {t(s.riskNoteKey.replace("farmOs.sell.", "") as "riskNow")}
            </p>
          </li>
        ))}
      </ul>
      <p className="muted tiny">{t("disclaimer")}</p>
    </section>
  );
}
