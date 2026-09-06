"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type PlotOpt = { id: string; name: string; cropSlug: string };

export function PlotSelector({
  plots,
  selectedId,
  paramName = "plot",
}: {
  plots: PlotOpt[];
  selectedId: string | null;
  paramName?: string;
}) {
  const t = useTranslations("farmOs");
  const router = useRouter();

  if (plots.length === 0) {
    return <p className="muted">{t("noPlots")}</p>;
  }

  return (
    <label className="fos-plot-selector">
      <span>{t("plotSelect")}</span>
      <select
        value={selectedId || plots[0].id}
        onChange={(e) => {
          router.push(`/today?${paramName}=${encodeURIComponent(e.target.value)}`);
        }}
      >
        {plots.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
