"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckoutButton } from "@/components/CheckoutButton";
import type { BoostTargetType } from "@/lib/pricing";

type Props = {
  targetType: BoostTargetType;
  targetId: string;
  boostQuotaRemaining?: number;
  isPro?: boolean;
  currentlyBoostedUntil?: string | null;
};

export function BoostButton({
  targetType,
  targetId,
  boostQuotaRemaining = 0,
  isPro = false,
  currentlyBoostedUntil,
}: Props) {
  const t = useTranslations("pricing");
  const [open, setOpen] = useState(false);

  return (
    <div className="boost-panel">
      {currentlyBoostedUntil ? (
        <p className="boosted-active-note">
          {t("boost.activeUntil", {
            date: new Date(currentlyBoostedUntil).toLocaleDateString(),
          })}
        </p>
      ) : null}
      <button type="button" className="btn primary" onClick={() => setOpen((v) => !v)}>
        {t("boost.cta")}
      </button>
      {open ? (
        <div className="boost-choices">
          <p className="tiny muted">{t("boost.choose")}</p>
          {isPro && boostQuotaRemaining > 0 ? (
            <CheckoutButton
              productCode="BOOST_7"
              targetType={targetType}
              targetId={targetId}
              useProQuota
              className="btn ghost"
              label={t("boost.useQuota", { n: boostQuotaRemaining })}
            />
          ) : null}
          <CheckoutButton
            productCode="BOOST_7"
            targetType={targetType}
            targetId={targetId}
            className="btn primary"
            label={t("boost.buy7")}
          />
          <CheckoutButton
            productCode="BOOST_30"
            targetType={targetType}
            targetId={targetId}
            className="btn primary"
            label={t("boost.buy30")}
          />
          {!isPro ? <p className="tiny muted">{t("boost.proHint")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
