/**
 * Rough AMD scenarios: sell now vs store 30/60 days.
 */

export type SellOrWaitInput = {
  qtyKg: number;
  priceNowAmdPerKg: number;
  /** Expected price change after storage (fraction, e.g. 0.08 = +8%) */
  expectedLift30: number;
  expectedLift60: number;
  storageCostPerKgPerDay: number;
  spoilagePct30: number;
  spoilagePct60: number;
};

export type SellOrWaitRow = {
  id: "now" | "d30" | "d60";
  days: number;
  revenueAmd: number;
  storageCostAmd: number;
  spoilageLossAmd: number;
  netAmd: number;
  netPerKg: number;
};

export function computeSellOrWait(input: SellOrWaitInput): SellOrWaitRow[] {
  const {
    qtyKg,
    priceNowAmdPerKg,
    expectedLift30,
    expectedLift60,
    storageCostPerKgPerDay,
    spoilagePct30,
    spoilagePct60,
  } = input;

  const nowRev = qtyKg * priceNowAmdPerKg;
  const row = (
    id: SellOrWaitRow["id"],
    days: number,
    lift: number,
    spoilPct: number
  ): SellOrWaitRow => {
    const price = priceNowAmdPerKg * (1 + lift);
    const remainingKg = qtyKg * (1 - spoilPct);
    const revenueAmd = Math.round(remainingKg * price);
    const storageCostAmd = Math.round(qtyKg * storageCostPerKgPerDay * days);
    const spoilageLossAmd = Math.round(qtyKg * spoilPct * priceNowAmdPerKg);
    const netAmd = revenueAmd - storageCostAmd;
    return {
      id,
      days,
      revenueAmd,
      storageCostAmd,
      spoilageLossAmd,
      netAmd,
      netPerKg: qtyKg > 0 ? Math.round(netAmd / qtyKg) : 0,
    };
  };

  return [
    {
      id: "now",
      days: 0,
      revenueAmd: Math.round(nowRev),
      storageCostAmd: 0,
      spoilageLossAmd: 0,
      netAmd: Math.round(nowRev),
      netPerKg: Math.round(priceNowAmdPerKg),
    },
    row("d30", 30, expectedLift30, spoilagePct30),
    row("d60", 60, expectedLift60, spoilagePct60),
  ];
}
