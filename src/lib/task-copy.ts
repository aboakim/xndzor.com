/** Resolve PlotTask title/detail which may be i18n keys, key|json, or key :: params. */
export function resolveTaskCopy(
  t: (key: string, values?: Record<string, string | number>) => string,
  raw: string | null | undefined
): string {
  if (!raw) return "";

  if (raw.includes("|") && raw.indexOf("|") > 0) {
    const idx = raw.indexOf("|");
    const key = raw.slice(0, idx);
    const json = raw.slice(idx + 1);
    try {
      const params = JSON.parse(json) as Record<string, string | number>;
      return t(key, params);
    } catch {
      try {
        return t(key);
      } catch {
        return key;
      }
    }
  }

  if (raw.includes(" :: ")) {
    const [key, paramsPart] = raw.split(" :: ");
    const params: Record<string, string | number> = {};
    for (const pair of (paramsPart || "").split(", ")) {
      const [k, v] = pair.split("=");
      if (k && v != null) params[k] = Number.isNaN(Number(v)) ? v : Number(v);
    }
    try {
      return t(key, params);
    } catch {
      return key;
    }
  }

  try {
    return t(raw);
  } catch {
    return raw;
  }
}

export function formatSuggestionDetail(s: {
  detailKey: string;
  detailParams?: Record<string, string | number>;
}): string {
  return `${s.detailKey}|${JSON.stringify(s.detailParams || {})}`;
}
