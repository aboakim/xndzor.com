"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckoutButton } from "@/components/CheckoutButton";
import { arePackagesFree } from "@/lib/pricing";

type Props = {
  targetId: string;
  currentlyUrgentUntil?: string | null;
  /** Server-computed: owner qualifies for free checkout */
  freeMode?: boolean;
};

/** Paid «Շտապ վաճառք» placement — Supply listings only. */
export function UrgentButton({
  targetId,
  currentlyUrgentUntil,
  freeMode: freeModeProp,
}: Props) {
  const t = useTranslations("pricing");
  const [open, setOpen] = useState(false);
  const freeMode = freeModeProp ?? arePackagesFree();

  return (
    <div className="boost-panel urgent-panel">
      {currentlyUrgentUntil ? (
        <p className="boosted-active-note">
          {t("urgent.activeUntil", {
            date: new Date(currentlyUrgentUntil).toLocaleDateString(),
          })}
        </p>
      ) : null}
      <button type="button" className="btn ghost" onClick={() => setOpen((v) => !v)}>
        {t("urgent.cta")}
      </button>
      {open ? (
        <div className="boost-choices">
          <p className="tiny muted">
            {freeMode ? t("urgent.chooseFree") : t("urgent.choose")}
          </p>
          <CheckoutButton
            productCode="URGENT_3"
            targetType="SUPPLY"
            targetId={targetId}
            className="btn primary"
            label={freeMode ? t("urgent.activate3") : t("urgent.buy3")}
            freeMode={freeMode}
          />
          <CheckoutButton
            productCode="URGENT_7"
            targetType="SUPPLY"
            targetId={targetId}
            className="btn primary"
            label={freeMode ? t("urgent.activate7") : t("urgent.buy7")}
            freeMode={freeMode}
          />
        </div>
      ) : null}
    </div>
  );
}
