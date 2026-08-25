"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { MACHINERY_CONDITIONS, MACHINERY_TYPES } from "@/lib/machinery";
import { MachineryTypeIcon } from "@/components/AgIcons";

export function MachineryFilters({
  type,
  marz,
  village,
  condition,
  q,
  yearMin,
  yearMax,
  priceMin,
  priceMax,
}: {
  type?: string;
  marz?: string;
  village?: string;
  condition?: string;
  q?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [machineryType, setMachineryType] = useState(type || "");
  const [marzId, setMarzId] = useState(marz || "");
  const [villageId, setVillageId] = useState(village || "");
  const [cond, setCond] = useState(condition || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [query, setQuery] = useState(q || "");
  const [yMin, setYMin] = useState(yearMin || "");
  const [yMax, setYMax] = useState(yearMax || "");
  const [pMin, setPMin] = useState(priceMin || "");
  const [pMax, setPMax] = useState(priceMax || "");

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVillages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (machineryType) params.set("type", machineryType);
    if (marzId) params.set("marz", marzId);
    if (villageId) params.set("village", villageId);
    if (cond) params.set("condition", cond);
    if (query.trim()) params.set("q", query.trim());
    if (yMin) params.set("yearMin", yMin);
    if (yMax) params.set("yearMax", yMax);
    if (pMin) params.set("priceMin", pMin);
    if (pMax) params.set("priceMax", pMax);
    const qs = params.toString();
    router.push(qs ? `/machinery?${qs}` : "/machinery");
  }

  return (
    <form className="filters-bar machinery-filters" onSubmit={apply}>
      <label>
        <span>{t("board.search")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        <span>{t("machineryBoard.type")}</span>
        <span className="select-with-icon">
          {machineryType ? <MachineryTypeIcon type={machineryType} size={16} /> : null}
          <select value={machineryType} onChange={(e) => setMachineryType(e.target.value)}>
            <option value="">{t("machineryBoard.allTypes")}</option>
            {MACHINERY_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`machineryTypes.${ty}` as "machineryTypes.TRACTOR")}
              </option>
            ))}
          </select>
        </span>
      </label>
      <label>
        <span>{t("machineryBoard.condition")}</span>
        <select value={cond} onChange={(e) => setCond(e.target.value)}>
          <option value="">{t("machineryBoard.allConditions")}</option>
          {MACHINERY_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {t(`machineryConditions.${c}` as "machineryConditions.USED")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.marz")}</span>
        <select
          value={marzId}
          onChange={(e) => {
            setMarzId(e.target.value);
            setVillageId("");
          }}
        >
          <option value="">{t("board.allMarzes")}</option>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("board.village")}</span>
        <select
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
          disabled={!marzId}
        >
          <option value="">{t("board.allVillages")}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {localizedPlaceName(v, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("machineryBoard.yearFrom")}</span>
        <input type="number" min={1950} max={2100} value={yMin} onChange={(e) => setYMin(e.target.value)} />
      </label>
      <label>
        <span>{t("machineryBoard.yearTo")}</span>
        <input type="number" min={1950} max={2100} value={yMax} onChange={(e) => setYMax(e.target.value)} />
      </label>
      <label>
        <span>{t("machineryBoard.priceFrom")}</span>
        <input type="number" min={0} value={pMin} onChange={(e) => setPMin(e.target.value)} />
      </label>
      <label>
        <span>{t("machineryBoard.priceTo")}</span>
        <input type="number" min={0} value={pMax} onChange={(e) => setPMax(e.target.value)} />
      </label>
      <button type="submit" className="btn primary">
        {t("board.apply")}
      </button>
    </form>
  );
}
