"use client";

import { useTranslations } from "next-intl";

export function ProBadge() {
  const t = useTranslations("pricing");
  return <span className="pro-badge">{t("badges.pro")}</span>;
}

export function BoostedBadge() {
  const t = useTranslations("pricing");
  return <span className="boosted-badge">{t("badges.boosted")}</span>;
}

export function UrgentBadge() {
  const t = useTranslations("pricing");
  return <span className="urgent-badge">{t("badges.urgent")}</span>;
}

export function VerifiedPaidBadge() {
  const t = useTranslations("pricing");
  return <span className="verified-farm-badge">{t("badges.verified")}</span>;
}

export function MonetizationPills({
  isPro,
  boosted,
  verified,
  urgent,
}: {
  isPro?: boolean;
  boosted?: boolean;
  verified?: boolean;
  urgent?: boolean;
}) {
  if (!isPro && !boosted && !verified && !urgent) return null;
  return (
    <span className="monetization-pills">
      {urgent ? <UrgentBadge /> : null}
      {boosted ? <BoostedBadge /> : null}
      {isPro ? <ProBadge /> : null}
      {verified ? <VerifiedPaidBadge /> : null}
    </span>
  );
}
