"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { RESOURCE_TYPES } from "@/lib/validations";

export function ResourceFilters({
  type,
  marz,
  q,
}: {
  type?: string;
  marz?: string;
  q?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [resourceType, setResourceType] = useState(type || "");
  const [marzId, setMarzId] = useState(marz || "");
  const [query, setQuery] = useState(q || "");

  useEffect(() => {
    setResourceType(type || "");
    setMarzId(marz || "");
    setQuery(q || "");
  }, [type, marz, q]);

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (resourceType) params.set("type", resourceType);
    if (marzId) params.set("marz", marzId);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(qs ? `/resources?${qs}` : "/resources");
  }

  return (
    <form className="filters-bar" onSubmit={apply}>
      <label>
        <span>{t("board.search")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        <span>{t("resources.filterType")}</span>
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="">{t("resources.allTypes")}</option>
          {RESOURCE_TYPES.map((rt) => (
            <option key={rt} value={rt}>
              {t(`resources.types.${rt}` as "resources.types.TRACTOR")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.marz")}</span>
        <select value={marzId} onChange={(e) => setMarzId(e.target.value)}>
          <option value="">{t("board.allMarzes")}</option>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn primary">
        {t("board.apply")}
      </button>
    </form>
  );
}
