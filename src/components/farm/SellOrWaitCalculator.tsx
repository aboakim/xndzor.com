"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { computeSellOrWait } from "@/lib/sell-or-wait";

export function SellOrWaitCalculator() {
  const t = useTranslations("farm.sellOrWait");
  const [qtyKg, setQtyKg] = useState(1000);
  const [priceNow, setPriceNow] = useState(250);
  const [lift30, setLift30] = useState(8);
  const [lift60, setLift60] = useState(15);
  const [storageDay, setStorageDay] = useState(1.5);
  const [spoil30, setSpoil30] = useState(3);
  const [spoil60, setSpoil60] = useState(7);

  const rows = useMemo(
    () =>
      computeSellOrWait({
        qtyKg,
        priceNowAmdPerKg: priceNow,
        expectedLift30: lift30 / 100,
        expectedLift60: lift60 / 100,
        storageCostPerKgPerDay: storageDay,
        spoilagePct30: spoil30 / 100,
        spoilagePct60: spoil60 / 100,
      }),
    [qtyKg, priceNow, lift30, lift60, storageDay, spoil30, spoil60]
  );

  const best = rows.reduce((a, b) => (b.netAmd > a.netAmd ? b : a));

  return (
    <div className="farm-calc">
      <div className="farm-calc-grid">
        <label>
          {t("qtyKg")}
          <input type="number" value={qtyKg} onChange={(e) => setQtyKg(Number(e.target.value))} />
        </label>
        <label>
          {t("priceNow")}
          <input type="number" value={priceNow} onChange={(e) => setPriceNow(Number(e.target.value))} />
        </label>
        <label>
          {t("lift30")}
          <input type="number" value={lift30} onChange={(e) => setLift30(Number(e.target.value))} />
        </label>
        <label>
          {t("lift60")}
          <input type="number" value={lift60} onChange={(e) => setLift60(Number(e.target.value))} />
        </label>
        <label>
          {t("storageDay")}
          <input
            type="number"
            step="0.1"
            value={storageDay}
            onChange={(e) => setStorageDay(Number(e.target.value))}
          />
        </label>
        <label>
          {t("spoil30")}
          <input type="number" value={spoil30} onChange={(e) => setSpoil30(Number(e.target.value))} />
        </label>
        <label>
          {t("spoil60")}
          <input type="number" value={spoil60} onChange={(e) => setSpoil60(Number(e.target.value))} />
        </label>
      </div>

      <div className="farm-scenario-grid">
        {rows.map((r) => (
          <article
            key={r.id}
            className={`farm-scenario ${r.id === best.id ? "is-best" : ""}`}
          >
            <h3>{t(`scenarios.${r.id}`)}</h3>
            <p className="farm-scenario-net">
              {r.netAmd.toLocaleString()} AMD
            </p>
            <ul>
              <li>
                {t("revenue")}: {r.revenueAmd.toLocaleString()}
              </li>
              <li>
                {t("storage")}: {r.storageCostAmd.toLocaleString()}
              </li>
              <li>
                {t("spoilage")}: {r.spoilageLossAmd.toLocaleString()}
              </li>
              <li>
                {t("perKg")}: {r.netPerKg.toLocaleString()}
              </li>
            </ul>
            {r.id === best.id ? <span className="farm-pill">{t("best")}</span> : null}
          </article>
        ))}
      </div>
      <p className="muted small">{t("disclaimer")}</p>
    </div>
  );
}
