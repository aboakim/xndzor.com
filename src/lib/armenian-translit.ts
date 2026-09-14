/**
 * Eastern Armenian ↔ Latin phonetic transliteration for site search.
 *
 * Users often type Latin on phones without an Armenian keyboard. We expand
 * queries with a small set of variants (original + translit ± synonym).
 *
 * ## Latin → Armenian (longest digraphs first)
 * | Latin | Armenian |
 * |-------|----------|
 * | zh    | ժ        |
 * | sh    | շ        |
 * | kh, x | խ        |
 * | gh    | ղ        |
 * | dz    | ձ        |
 * | ts    | ծ        |
 * | ch    | չ        |
 * | th    | թ        |
 * | ph    | փ        |
 * | ev    | և        |
 * | a b g d e z i l k h m y n o p j r s v t u f q c |
 * | ա բ գ դ ե զ է ի լ կ հ մ յ ն ո պ ջ ր ս վ տ ու ֆ ք ց |
 *
 * ## Armenian → Latin (primary)
 * խ→kh, ձ→dz, ղ→gh, շ→sh, ժ→zh, չ|ճ→ch, ծ|ց→ts, թ→t, ու→u, և→ev, …
 * Alternate for խ: **x** (so խնձոր ↔ xndzor / khndzor).
 *
 * Ambiguous letters (չ/ճ, ծ/ց, կ/ք, …) use one primary mapping; catalog
 * product aliases cover crop names reliably.
 */

const MAX_SEARCH_VARIANTS = 5;

/** Multi-char Armenian → Latin (primary / alternate for խ). */
const HY_TO_LATIN_PRIMARY: [string, string][] = [
  ["ու", "u"],
  ["և", "ev"],
  ["խ", "kh"],
  ["ձ", "dz"],
  ["ղ", "gh"],
  ["ժ", "zh"],
  ["շ", "sh"],
  ["թ", "t"],
  ["ծ", "ts"],
  ["ց", "ts"],
  ["չ", "ch"],
  ["ճ", "ch"],
  ["փ", "p"],
  ["ք", "k"],
  ["ռ", "r"],
  ["ա", "a"],
  ["բ", "b"],
  ["գ", "g"],
  ["դ", "d"],
  ["ե", "e"],
  ["զ", "z"],
  ["է", "e"],
  ["ը", "y"],
  ["ի", "i"],
  ["լ", "l"],
  ["կ", "k"],
  ["հ", "h"],
  ["մ", "m"],
  ["յ", "y"],
  ["ն", "n"],
  ["շ", "sh"],
  ["ո", "o"],
  ["պ", "p"],
  ["ջ", "j"],
  ["ս", "s"],
  ["վ", "v"],
  ["տ", "t"],
  ["ր", "r"],
  ["օ", "o"],
  ["ֆ", "f"],
  ["ւ", "w"],
];

const HY_TO_LATIN_X: [string, string][] = HY_TO_LATIN_PRIMARY.map(([hy, lat]) =>
  hy === "խ" ? (["խ", "x"] as [string, string]) : [hy, lat],
);

/** Latin digraphs / letters → Armenian (lowercase keys). */
const LATIN_TO_HY: [string, string][] = [
  ["zh", "ժ"],
  ["sh", "շ"],
  ["kh", "խ"],
  ["gh", "ղ"],
  ["dz", "ձ"],
  ["ts", "ծ"],
  ["ch", "չ"],
  ["th", "թ"],
  ["ph", "փ"],
  ["ev", "և"],
  ["x", "խ"],
  ["a", "ա"],
  ["b", "բ"],
  ["g", "գ"],
  ["d", "դ"],
  ["e", "ե"],
  ["z", "զ"],
  ["i", "ի"],
  ["l", "լ"],
  ["k", "կ"],
  ["h", "հ"],
  ["m", "մ"],
  ["y", "յ"],
  ["n", "ն"],
  ["o", "ո"],
  ["p", "պ"],
  ["j", "ջ"],
  ["r", "ր"],
  ["s", "ս"],
  ["v", "վ"],
  ["t", "տ"],
  ["u", "ու"],
  ["f", "ֆ"],
  ["q", "ք"],
  ["c", "ց"],
  ["w", "վ"],
];

/**
 * High-value Latin/English spellings that transliteration alone misses
 * (e.g. English “cow” ≠ phonetic “kov”).
 */
const SEARCH_SYNONYMS: Record<string, string[]> = {
  xndzor: ["խնձոր"],
  khndzor: ["խնձոր"],
  cow: ["կով"],
  cows: ["կով", "կովեր"],
  kov: ["կով"],
  sheep: ["ոչխար"],
  goat: ["այծ"],
  tractor: ["տրակտոր"],
  tractors: ["տրակտոր"],
  traktor: ["տրակտոր"],
  traktori: ["տրակտոր"],
  lolik: ["լոլիկ"],
  kartofil: ["կարտոֆիլ"],
};

const ARMENIAN_RE = /[\u0531-\u0556\u0561-\u0587]/;
const LATIN_LETTER_RE = /[A-Za-z]/;

function foldKey(s: string): string {
  return s.trim().toLocaleLowerCase("hy");
}

function mapByTable(input: string, table: [string, string][]): string {
  const lower = input.toLocaleLowerCase("hy");
  let out = "";
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (const [from, to] of table) {
      if (lower.startsWith(from, i)) {
        out += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += lower[i];
      i += 1;
    }
  }
  return out;
}

/** Armenian script → Latin phonetic (խ→kh by default). */
export function armenianToLatin(text: string, opts?: { xForKh?: boolean }): string {
  const table = opts?.xForKh ? HY_TO_LATIN_X : HY_TO_LATIN_PRIMARY;
  return mapByTable(text, table);
}

/** Latin phonetic → Armenian (approximate Eastern Armenian). */
export function latinToArmenian(text: string): string {
  return mapByTable(text, LATIN_TO_HY);
}

export function isMostlyLatin(text: string): boolean {
  const letters = text.replace(/[^A-Za-z\u0531-\u0556\u0561-\u0587]/g, "");
  if (!letters) return false;
  const latin = (letters.match(/[A-Za-z]/g) ?? []).length;
  return latin / letters.length >= 0.6;
}

export function isMostlyArmenian(text: string): boolean {
  const letters = text.replace(/[^A-Za-z\u0531-\u0556\u0561-\u0587]/g, "");
  if (!letters) return false;
  const hy = (letters.match(ARMENIAN_RE) ?? []).length;
  return hy / letters.length >= 0.6;
}

/**
 * Unique query variants for Prisma `contains` ORs (capped).
 * Always includes the original trimmed query first.
 */
export function searchQueryVariants(raw: string, max = MAX_SEARCH_VARIANTS): string[] {
  const q = raw.trim();
  if (!q) return [];

  const out: string[] = [];
  const add = (s: string | undefined | null) => {
    if (!s) return;
    const t = s.trim();
    if (!t || t.length < 2) return;
    const key = foldKey(t);
    if (out.some((x) => foldKey(x) === key)) return;
    out.push(t);
  };

  add(q);

  const lower = foldKey(q);
  for (const syn of SEARCH_SYNONYMS[lower] ?? []) {
    add(syn);
  }

  if (isMostlyLatin(q) && LATIN_LETTER_RE.test(q)) {
    add(latinToArmenian(q));
    // Common Latin habit: trailing -i (տրակտորի) — also try stem
    if (q.length > 3 && /[aeiouy]$/i.test(q)) {
      add(latinToArmenian(q.slice(0, -1)));
    }
  }

  if (isMostlyArmenian(q) && ARMENIAN_RE.test(q)) {
    add(armenianToLatin(q));
    add(armenianToLatin(q, { xForKh: true }));
  }

  return out.slice(0, max);
}

/** Latin aliases for an Armenian display name (kh- and x- forms). */
export function latinAliasesForArmenian(hyName: string): string[] {
  const a = foldKey(armenianToLatin(hyName));
  const b = foldKey(armenianToLatin(hyName, { xForKh: true }));
  return a === b ? [a] : [a, b];
}

/**
 * Prisma `OR` of `contains` across fields × searchQueryVariants(q).
 * Returns `undefined` when q is empty (caller should omit the clause).
 */
export function textContainsOr(
  q: string | undefined,
  fields: string[],
): { OR: Array<Record<string, { contains: string; mode: "insensitive" }>> } | undefined {
  const trimmed = q?.trim();
  if (!trimmed || fields.length === 0) return undefined;
  const variants = searchQueryVariants(trimmed);
  return {
    OR: variants.flatMap((v) =>
      fields.map((field) => ({
        [field]: { contains: v, mode: "insensitive" as const },
      })),
    ),
  };
}
