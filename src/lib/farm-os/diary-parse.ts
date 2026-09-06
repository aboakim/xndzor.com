/**
 * Armenian-first keyword parse for voice farm diary (rule-based, not NLP).
 */

export type DiaryParsed = {
  wateredHa: number | null;
  fertilizerKg: number | null;
  workersTomorrow: number | null;
  keywords: string[];
};

const NUM =
  /(\d+(?:[.,]\d+)?)/;

export function parseDiaryText(raw: string): DiaryParsed {
  const text = (raw || "").toLowerCase().replace(/և/g, "եւ");
  const keywords: string[] = [];
  let wateredHa: number | null = null;
  let fertilizerKg: number | null = null;
  let workersTomorrow: number | null = null;

  // Watered hectares: ոռոգ / ջր / watered / полил
  if (/ոռոգ|ջրեց|ջրել|water|полил|полив/.test(text)) {
    keywords.push("irrigation");
    const m =
      text.match(/(\d+(?:[.,]\d+)?)\s*(հա|ha|га)/) ||
      text.match(/(ոռոգ|ջր)\w*.*?(\d+(?:[.,]\d+)?)/) ||
      text.match(/(\d+(?:[.,]\d+)?)\s*(հա|ha)/);
    if (m) {
      const n = parseFloat((m[1] || m[2] || "").replace(",", "."));
      if (Number.isFinite(n)) wateredHa = n;
    }
  }

  // Fertilizer kg
  if (/պարարտ|ծիրան|npk|fertiliz|удобрен/.test(text)) {
    keywords.push("fertilizer");
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*(կգ|kg|кг)/);
    if (m) {
      const n = parseFloat(m[1].replace(",", "."));
      if (Number.isFinite(n)) fertilizerKg = n;
    }
  }

  // Workers tomorrow
  if (/վաղը|tomorrow|завтра/.test(text) && /աշխատ|worker|работн|մարդ/.test(text)) {
    keywords.push("workers");
    const m =
      text.match(/(\d+)\s*(աշխատ|մարդ|worker|человек)/) ||
      text.match(/(աշխատ|մարդ|worker).*?(\d+)/);
    if (m) {
      const rawN = m[1]?.match?.(/\d+/) ? m[1] : m[2];
      const n = parseInt(String(rawN).replace(/\D/g, ""), 10);
      if (Number.isFinite(n)) workersTomorrow = n;
    }
  } else if (/աշխատող|workers/.test(text)) {
    keywords.push("workers");
    const m = text.match(NUM);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) workersTomorrow = n;
    }
  }

  if (/բերք|harvest|урожай/.test(text)) keywords.push("harvest");
  if (/վնասատու|pest|вредител/.test(text)) keywords.push("pest");

  return { wateredHa, fertilizerKg, workersTomorrow, keywords };
}
