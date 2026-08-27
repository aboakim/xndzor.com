"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { OverproductionSignal } from "@/components/OverproductionSignal";
import type { CropExchangeRow } from "@/lib/exchange";

export function LiveCropSignal({ productId }: { productId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [row, setRow] = useState<CropExchangeRow | null>(null);

  useEffect(() => {
    if (!productId) {
      setRow(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/exchange?mode=signal&productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setRow(data);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!productId) return null;

  return (
    <OverproductionSignal
      row={row}
      t={(k, v) => t(k as "grow.signalOverTitle", v)}
      locale={locale}
      compact
    />
  );
}
