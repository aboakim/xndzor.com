import crypto from "crypto";

export function isIdramConfigured(): boolean {
  return Boolean(
    process.env.IDRAM_SECRET_KEY?.trim() &&
      process.env.IDRAM_EDP_REC_ACCOUNT?.trim(),
  );
}

/** iDram hosted payment page (POST form). Override via env if Idram assigns a custom URL. */
export function getIdramCheckoutBaseUrl(): string {
  return (
    process.env.IDRAM_CHECKOUT_BASE_URL?.trim() ||
    "https://bank.idram.am/payment.aspx"
  );
}

export type PaymentRedirectForm = {
  action: string;
  fields: Record<string, string>;
};

export function buildIdramCheckoutForm(opts: {
  paymentId: string;
  amountAmd: number;
  description: string;
  locale: string;
}): PaymentRedirectForm {
  const account = process.env.IDRAM_EDP_REC_ACCOUNT!.trim();
  const email = process.env.IDRAM_EDP_EMAIL?.trim() || "";
  const lang =
    opts.locale === "hy" ? "AM" : opts.locale === "ru" ? "RU" : "EN";

  return {
    action: getIdramCheckoutBaseUrl(),
    fields: {
      EDP_LANGUAGE: lang,
      EDP_REC_ACCOUNT: account,
      EDP_DESCRIPTION: opts.description,
      EDP_AMOUNT: opts.amountAmd.toFixed(2),
      EDP_BILL_NO: opts.paymentId,
      ...(email ? { EDP_EMAIL: email } : {}),
    },
  };
}

export type IdramCallbackParams = {
  EDP_PRECHECK?: string;
  EDP_BILL_NO?: string;
  EDP_REC_ACCOUNT?: string;
  EDP_AMOUNT?: string;
  EDP_PAYER_ACCOUNT?: string;
  EDP_TRANS_ID?: string;
  EDP_TRANS_DATE?: string;
  EDP_CHECKSUM?: string;
};

/** Precheck request — verify order exists before Idram debits wallet. */
export function verifyIdramPrecheck(params: IdramCallbackParams): {
  ok: boolean;
  billNo?: string;
} {
  if (params.EDP_PRECHECK !== "YES") return { ok: false };
  const account = process.env.IDRAM_EDP_REC_ACCOUNT?.trim();
  if (!account || params.EDP_REC_ACCOUNT !== account) return { ok: false };
  if (!params.EDP_BILL_NO?.trim()) return { ok: false };
  return { ok: true, billNo: params.EDP_BILL_NO.trim() };
}

/**
 * Payment confirmation checksum per Idram Merchant API:
 * MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE)
 */
export function verifyIdramPaymentChecksum(params: IdramCallbackParams): boolean {
  const secret = process.env.IDRAM_SECRET_KEY?.trim();
  if (!secret || !params.EDP_CHECKSUM?.trim()) return false;

  const parts = [
    params.EDP_REC_ACCOUNT ?? "",
    params.EDP_AMOUNT ?? "",
    secret,
    params.EDP_BILL_NO ?? "",
    params.EDP_PAYER_ACCOUNT ?? "",
    params.EDP_TRANS_ID ?? "",
    params.EDP_TRANS_DATE ?? "",
  ];
  const hash = crypto.createHash("md5").update(parts.join(":")).digest("hex");
  return hash.toUpperCase() === params.EDP_CHECKSUM.trim().toUpperCase();
}
