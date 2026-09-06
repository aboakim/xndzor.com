import crypto from "crypto";

export function isTelcellConfigured(): boolean {
  return Boolean(
    process.env.TELCELL_MERCHANT_ID?.trim() &&
      process.env.TELCELL_SECRET?.trim(),
  );
}

export function getTelcellCheckoutUrl(): string {
  return (
    process.env.TELCELL_CHECKOUT_URL?.trim() ||
    "https://telcellmoney.am/invoices"
  );
}

export type PaymentRedirectForm = {
  action: string;
  fields: Record<string, string>;
};

export function buildTelcellCheckoutForm(opts: {
  paymentId: string;
  amountAmd: number;
  description: string;
  locale: string;
}): PaymentRedirectForm {
  const issuer = process.env.TELCELL_MERCHANT_ID!.trim();
  const secret = process.env.TELCELL_SECRET!.trim();
  const currency = "֏";
  const price = String(opts.amountAmd);
  const product = Buffer.from(opts.description, "utf-8").toString("base64");
  const issuer_id = Buffer.from(opts.paymentId, "utf-8").toString("base64");
  const valid_days = "3";
  const lang =
    opts.locale === "hy" ? "am" : opts.locale === "ru" ? "ru" : "en";

  const security_code = crypto
    .createHash("md5")
    .update(secret + issuer + currency + price + product + issuer_id + valid_days)
    .digest("hex");

  return {
    action: getTelcellCheckoutUrl(),
    fields: {
      action: "PostInvoice",
      issuer,
      currency,
      price,
      product,
      issuer_id,
      valid_days,
      lang,
      security_code,
    },
  };
}

export type TelcellCallbackParams = {
  invoice?: string;
  issuer_id?: string;
  payment_id?: string;
  buyer?: string;
  currency?: string;
  sum?: string;
  time?: string;
  status?: string;
  checksum?: string;
};

/**
 * Callback checksum per Telcell docs:
 * MD5(shop_key + invoice + issuer_id + payment_id + buyer + currency + sum + time + status)
 */
export function verifyTelcellCallbackChecksum(params: TelcellCallbackParams): boolean {
  const secret = process.env.TELCELL_SECRET?.trim();
  if (!secret || !params.checksum?.trim()) return false;

  const parts = [
    secret,
    params.invoice ?? "",
    params.issuer_id ?? "",
    params.payment_id ?? "",
    params.buyer ?? "",
    params.currency ?? "",
    params.sum ?? "",
    params.time ?? "",
    params.status ?? "",
  ];
  const expected = crypto.createHash("md5").update(parts.join("")).digest("hex");
  return expected === params.checksum.trim();
}

export function decodeTelcellIssuerId(issuer_id: string): string {
  try {
    return Buffer.from(issuer_id, "base64").toString("utf-8");
  } catch {
    return issuer_id;
  }
}
