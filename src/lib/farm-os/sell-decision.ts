/**
 * «Եթե հիմա վաճառեմ / եթե սպասեմ» — rule-based demo scenarios in AMD.
 */

export type SellScenarioId = "now" | "store30" | "store60";

export type SellScenario = {
  id: SellScenarioId;
  netAmd: number;
  storageCostAmd: number;
  pricePerTonAmd: number;
  riskBand: "low" | "medium" | "high";
  riskNoteKey: string;
};

export type SellDecisionInput = {
  qtyTons: number;
  /** Current offered / market hint AMD per ton */
  pricePerTonAmd: number;
  /** Crop slug for spoilage heuristics */
  cropSlug: string;
};

/** Daily storage cost AMD/ton — demo table */
const STORAGE_PER_TON_DAY: Record<string, number> = {
  tomato: 450,
  grape: 380,
  potato: 120,
  apple: 200,
  peach: 500,
  wheat: 40,
  other: 250,
};

/** Expected price drift after storage (multiplier) — demo only */
const PRICE_DRIFT: Record<string, { d30: number; d60: number }> = {
  tomato: { d30: 1.08, d60: 0.95 },
  grape: { d30: 1.12, d60: 1.05 },
  potato: { d30: 1.05, d60: 1.1 },
  apple: { d30: 1.06, d60: 1.12 },
  peach: { d30: 0.9, d60: 0.7 },
  wheat: { d30: 1.02, d60: 1.04 },
  other: { d30: 1.03, d60: 1.0 },
};

const RISK: Record<string, { d30: SellScenario["riskBand"]; d60: SellScenario["riskBand"] }> = {
  tomato: { d30: "medium", d60: "high" },
  grape: { d30: "medium", d60: "high" },
  potato: { d30: "low", d60: "medium" },
  apple: { d30: "low", d60: "medium" },
  peach: { d30: "high", d60: "high" },
  wheat: { d30: "low", d60: "low" },
  other: { d30: "medium", d60: "medium" },
};

export function computeSellScenarios(input: SellDecisionInput): SellScenario[] {
  const qty = Math.max(0, input.qtyTons);
  const price = Math.max(0, input.pricePerTonAmd);
  const slug = PRICE_DRIFT[input.cropSlug] ? input.cropSlug : "other";
  const storageDay = STORAGE_PER_TON_DAY[slug] ?? STORAGE_PER_TON_DAY.other;
  const drift = PRICE_DRIFT[slug];
  const risk = RISK[slug];

  const nowNet = Math.round(qty * price);

  const store30Cost = Math.round(qty * storageDay * 30);
  const price30 = Math.round(price * drift.d30);
  const store30Net = Math.round(qty * price30 - store30Cost);

  const store60Cost = Math.round(qty * storageDay * 60);
  const price60 = Math.round(price * drift.d60);
  const store60Net = Math.round(qty * price60 - store60Cost);

  return [
    {
      id: "now",
      netAmd: nowNet,
      storageCostAmd: 0,
      pricePerTonAmd: price,
      riskBand: "low",
      riskNoteKey: "farmOs.sell.riskNow",
    },
    {
      id: "store30",
      netAmd: store30Net,
      storageCostAmd: store30Cost,
      pricePerTonAmd: price30,
      riskBand: risk.d30,
      riskNoteKey: "farmOs.sell.risk30",
    },
    {
      id: "store60",
      netAmd: store60Net,
      storageCostAmd: store60Cost,
      pricePerTonAmd: price60,
      riskBand: risk.d60,
      riskNoteKey: "farmOs.sell.risk60",
    },
  ];
}

export function bestScenario(scenarios: SellScenario[]): SellScenario {
  return scenarios.reduce((a, b) => (b.netAmd > a.netAmd ? b : a));
}
