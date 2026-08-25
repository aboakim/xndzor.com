"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatAmd } from "@/lib/utils";
import { localizedPlaceName } from "@/lib/places";

type Place = { nameHy: string; nameEn: string; nameRu: string; slug?: string };

export function ResourceCard({
  id,
  type,
  title,
  capacityNote,
  availabilityNote,
  priceAmd,
  priceUnit,
  marz,
  village,
}: {
  id: string;
  type: string;
  title: string;
  capacityNote?: string | null;
  availabilityNote?: string | null;
  priceAmd?: number | null;
  priceUnit?: string | null;
  marz: Place;
  village?: Place | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const marzLabel = marz.slug
    ? t(`marzes.${marz.slug}` as "marzes.Yerevan")
    : localizedPlaceName(marz, locale);
  const villageLabel = village ? localizedPlaceName(village, locale) : null;

  let priceLabel = t("resources.free");
  if (priceUnit && priceUnit !== "free" && priceAmd != null) {
    priceLabel = `${formatAmd(priceAmd)} ${t("common.amd")}/${t(`resources.priceUnits.${priceUnit}` as "resources.priceUnits.hour")}`;
  }

  return (
    <Link href={`/resources/${id}`} className="trade-card trade-resource">
      <div className="trade-card-top">
        <span className="pill pill-resource">
          {t(`resources.types.${type}` as "resources.types.TRACTOR")}
        </span>
        <span className="trade-product">{priceLabel}</span>
      </div>
      <h3>{title}</h3>
      {capacityNote ? <p className="trade-qty">{capacityNote}</p> : null}
      {availabilityNote ? <p className="trade-price">{availabilityNote}</p> : null}
      <p className="trade-meta">
        {villageLabel ? `${villageLabel}, ` : ""}
        {marzLabel}
      </p>
    </Link>
  );
}
