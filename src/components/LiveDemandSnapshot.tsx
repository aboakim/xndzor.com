"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DemandSnapshotPanel } from "@/components/DemandSnapshotPanel";
import type { DemandSnapshot } from "@/lib/exchange";

/** Live demand panel for plot create / crop change. */
export function LiveDemandSnapshot({
  productId,
  marzId,
}: {
  productId: string;
  marzId?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [snap, setSnap] = useState<DemandSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setSnap(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const q = new URLSearchParams({ mode: "snapshot", productId });
    if (marzId) q.set("marz", marzId);
    fetch(`/api/exchange?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSnap(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, marzId]);

  if (!productId) return null;

  return (
    <div className="live-demand-wrap">
      {loading ? <p className="muted small">{t("common.loading")}</p> : null}
      <DemandSnapshotPanel
        snap={snap}
        t={(k, v) => t(k as "grow.snapshotTitle", v)}
        locale={locale}
        compact
      />
    </div>
  );
}
