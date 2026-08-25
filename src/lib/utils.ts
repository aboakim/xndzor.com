export { MARZES, type MarzSlug as Marz } from "./locations";

export function formatAmd(amount: number, locale = "hy-AM"): string {
  return new Intl.NumberFormat(locale, {
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
