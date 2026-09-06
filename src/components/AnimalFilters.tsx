"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { ANIMAL_PURPOSES, ANIMAL_TYPES } from "@/lib/animals";
import { AnimalTypeIcon } from "@/components/AgIcons";

export function AnimalFilters({
  type,
  marz,
  village,
  purpose,
  q,
  ageMin,
  ageMax,
  priceMin,
  priceMax,
}: {
  type?: string;
  marz?: string;
  village?: string;
  purpose?: string;
  q?: string;
  ageMin?: string;
  ageMax?: string;
  priceMin?: string;
  priceMax?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [animalType, setAnimalType] = useState(type || "");
  const [marzId, setMarzId] = useState(marz || "");
  const [villageId, setVillageId] = useState(village || "");
  const [purp, setPurp] = useState(purpose || "");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [query, setQuery] = useState(q || "");
  const [aMin, setAMin] = useState(ageMin || "");
  const [aMax, setAMax] = useState(ageMax || "");
  const [pMin, setPMin] = useState(priceMin || "");
  const [pMax, setPMax] = useState(priceMax || "");

  useEffect(() => {
    setAnimalType(type || "");
    setMarzId(marz || "");
    setVillageId(village || "");
    setPurp(purpose || "");
    setQuery(q || "");
    setAMin(ageMin || "");
    setAMax(ageMax || "");
    setPMin(priceMin || "");
    setPMax(priceMax || "");
  }, [type, marz, village, purpose, q, ageMin, ageMax, priceMin, priceMax]);

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
    if (animalType) params.set("type", animalType);
    if (marzId) params.set("marz", marzId);
    if (villageId) params.set("village", villageId);
    if (purp) params.set("purpose", purp);
    if (query.trim()) params.set("q", query.trim());
    if (aMin) params.set("ageMin", aMin);
    if (aMax) params.set("ageMax", aMax);
    if (pMin) params.set("priceMin", pMin);
    if (pMax) params.set("priceMax", pMax);
    const qs = params.toString();
    router.push(qs ? `/animals?${qs}` : "/animals");
  }

  return (
    <form className="browse-filter-form" onSubmit={apply}>
      <div className="browse-filter-clear-row">
        <Link href="/animals" className="browse-clear">
          {t("browse.clearAll")}
        </Link>
      </div>
      <label>
        <span>{t("board.search")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        <span>{t("animalsBoard.type")}</span>
        <span className="select-with-icon">
          {animalType ? <AnimalTypeIcon type={animalType} size={16} /> : null}
          <select value={animalType} onChange={(e) => setAnimalType(e.target.value)}>
            <option value="">{t("animalsBoard.allTypes")}</option>
            {ANIMAL_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`animalTypes.${ty}` as "animalTypes.COW")}
              </option>
            ))}
          </select>
        </span>
      </label>
      <label>
        <span>{t("animalsBoard.purpose")}</span>
        <select value={purp} onChange={(e) => setPurp(e.target.value)}>
          <option value="">{t("animalsBoard.allPurposes")}</option>
          {ANIMAL_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {t(`animalPurposes.${p}` as "animalPurposes.DAIRY")}
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
      <fieldset className="browse-price-range">
        <legend>{t("browse.price")}</legend>
        <div className="browse-price-inputs">
          <label>
            <span>{t("browse.priceFrom")}</span>
            <input type="number" min={0} value={pMin} onChange={(e) => setPMin(e.target.value)} />
          </label>
          <label>
            <span>{t("browse.priceTo")}</span>
            <input type="number" min={0} value={pMax} onChange={(e) => setPMax(e.target.value)} />
          </label>
        </div>
      </fieldset>
      <label>
        <span>{t("animalsBoard.ageFrom")}</span>
        <input type="number" min={0} value={aMin} onChange={(e) => setAMin(e.target.value)} />
      </label>
      <label>
        <span>{t("animalsBoard.ageTo")}</span>
        <input type="number" min={0} value={aMax} onChange={(e) => setAMax(e.target.value)} />
      </label>
      <button type="submit" className="btn primary browse-apply">
        {t("board.apply")}
      </button>
    </form>
  );
}
