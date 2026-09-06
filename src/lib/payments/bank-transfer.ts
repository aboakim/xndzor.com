/**
 * Manual bank transfer — money lands in the owner's AMD account.
 * Package activates only after admin confirms the PENDING payment.
 */

export type OwnerBankDetails = {
  bankName: string;
  account: string;
  holder: string;
  note: string;
  inn?: string;
  bic?: string;
};

/** Enabled when account number + account holder name are set in env. */
export function isBankTransferConfigured(): boolean {
  return Boolean(
    process.env.OWNER_BANK_ACCOUNT?.trim() &&
      process.env.OWNER_BANK_HOLDER?.trim(),
  );
}

export function getOwnerBankDetails(): OwnerBankDetails | null {
  if (!isBankTransferConfigured()) return null;
  const inn = process.env.OWNER_BANK_INN?.trim();
  const bic = process.env.OWNER_BANK_BIC?.trim();
  return {
    bankName: process.env.OWNER_BANK_NAME?.trim() || "",
    account: process.env.OWNER_BANK_ACCOUNT!.trim(),
    holder: process.env.OWNER_BANK_HOLDER!.trim(),
    note: process.env.OWNER_BANK_NOTE?.trim() || "",
    ...(inn ? { inn } : {}),
    ...(bic ? { bic } : {}),
  };
}

/** Short reference for the transfer purpose / memo field. */
export function paymentTransferReference(paymentId: string): string {
  const tail = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `XND-${tail || paymentId.slice(0, 8).toUpperCase()}`;
}
