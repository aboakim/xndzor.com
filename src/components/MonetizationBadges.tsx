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

export function VerifiedPaidBadge() {
  const t = useTranslations("pricing");
  return <span className="verified-farm-badge">{t("badges.verified")}</span>;
}

export function MonetizationPills({
  isPro,
  boosted,
  verified,
}: {
  isPro?: boolean;
  boosted?: boolean;
  verified?: boolean;
}) {
  if (!isPro && !boosted && !verified) return null;
  return (
    <span className="monetization-pills">
      {boosted ? <BoostedBadge /> : null}
      {isPro ? <ProBadge /> : null}
      {verified ? <VerifiedPaidBadge /> : null}
    </span>
  );
}
