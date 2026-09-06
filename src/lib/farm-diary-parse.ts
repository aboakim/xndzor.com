/**
 * Heuristic Armenian / Russian / English keyword parse for farm voice diary.
 */

export type DiaryStructured = {
  expenseAmd?: number;
  expenseCategory?: string;
  work?: string;
  materials?: string;
  tomorrowTasks?: string;
  keywords: string[];
};

const EXPENSE_RE =
  /(\d[\d\s.,]*)\s*(դրամ|դր\.|amd|֏|руб|р\.)/i;
const DIESEL = /դիզել|diesel|солярво|գազ|fuel/i;
const WORKERS = /աշխատող|բանվոր|worker|труд|վարձ/i;
const SEED = /սերմ|տնկի|seed|семен/i;
const WATER = /ոռոգ|ջուր|полив|water|irrigation/i;
const FERT = /պարարտ|fertiliz|удобрен/i;

export function parseDiaryTranscript(text: string): DiaryStructured {
  const keywords: string[] = [];
  const structured: DiaryStructured = { keywords };

  const exp = text.match(EXPENSE_RE);
  if (exp) {
    const n = Number(exp[1].replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) structured.expenseAmd = Math.round(n);
    keywords.push("expense");
  }

  if (DIESEL.test(text)) {
    structured.expenseCategory = "diesel";
    keywords.push("diesel");
  } else if (WORKERS.test(text)) {
    structured.expenseCategory = "labor";
    keywords.push("labor");
  } else if (SEED.test(text)) {
    structured.expenseCategory = "seed";
    keywords.push("seed");
  } else if (WATER.test(text)) {
    structured.expenseCategory = "water";
    keywords.push("water");
  } else if (FERT.test(text)) {
    structured.expenseCategory = "other";
    keywords.push("fertilizer");
  }

  if (WATER.test(text)) {
    structured.work = structured.work || "irrigation";
    keywords.push("work:irrigation");
  }
  if (/հնձ|բերք|harvest|уборк/i.test(text)) {
    structured.work = "harvest";
    keywords.push("work:harvest");
  }
  if (/սրսկ|spray|опрыск/i.test(text)) {
    structured.work = "spray";
    keywords.push("work:spray");
  }

  if (/վաղը|завтра|tomorrow/i.test(text)) {
    const after = text.split(/վաղը|завтра|tomorrow/i)[1]?.trim().slice(0, 200);
    if (after) structured.tomorrowTasks = after;
    keywords.push("tomorrow");
  }

  if (/պարարտ|սերմ|թաղանթ|material|материал/i.test(text)) {
    structured.materials = text.slice(0, 120);
    keywords.push("materials");
  }

  return structured;
}
