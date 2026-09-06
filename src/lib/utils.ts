export { MARZES, type MarzSlug as Marz } from "./locations";
import { localeTag } from "./content-locale";

export function formatAmd(amount: number, locale = "hy"): string {
  const tag = locale.includes("-") ? locale : localeTag(locale);
  return new Intl.NumberFormat(tag, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseImageUrls(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function formatQty(
  min: number,
  max: number | null | undefined,
  unit: string,
  t: (key: string) => string
): string {
  const u = t(`units.${unit}` as "units.kg");
  if (max != null && max !== min) return `${formatAmd(min)}–${formatAmd(max)} ${u}`;
  return `${formatAmd(min)} ${u}`;
}

export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string,
  t: (key: string) => string
): string | undefined {
  if (min == null && max == null) return undefined;
  const u = t(`units.${unit}` as "units.kg");
  const amd = t("common.amd");
  if (min != null && max != null && min !== max) {
    return `${formatAmd(min)}–${formatAmd(max)} ${amd}/${u}`;
  }
  const v = min ?? max!;
  return `${formatAmd(v)} ${amd}/${u}`;
}

/** Short relative age for listing cards (today / N days / N months). */
export function formatListingAge(date: Date | string | number, locale = "hy"): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const tag = locale.includes("-") ? locale : localeTag(locale);
  const diffMs = d.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absMs < hour) {
    const m = Math.round(diffMs / minute) || (diffMs < 0 ? -1 : 0);
    return rtf.format(m, "minute");
  }
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (absMs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  return rtf.format(Math.round(diffMs / (30 * day)), "month");
}
