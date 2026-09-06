/** Client-safe card validation helpers — full PAN/CVV never sent to server. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  const d = digitsOnly(value).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const d = digitsOnly(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function luhnCheck(num: string): boolean {
  const d = digitsOnly(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = parseInt(d[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(num: string): "visa" | "mastercard" | "arca" | "unknown" {
  const d = digitsOnly(num);
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (/^9/.test(d)) return "arca";
  return "unknown";
}

export type CardFormValues = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
};

export function validateCardForm(values: CardFormValues): string | null {
  const num = digitsOnly(values.cardNumber);
  if (num.length !== 16) return "card_number_invalid";
  if (!luhnCheck(num)) return "card_number_invalid";
  const exp = digitsOnly(values.expiry);
  if (exp.length !== 4) return "expiry_invalid";
  const mm = parseInt(exp.slice(0, 2), 10);
  const yy = parseInt(exp.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return "expiry_invalid";
  const now = new Date();
  const expDate = new Date(2000 + yy, mm, 0);
  if (expDate < now) return "expiry_invalid";
  const cvv = digitsOnly(values.cvv);
  if (cvv.length < 3 || cvv.length > 4) return "cvv_invalid";
  const name = values.cardholderName.trim();
  if (name.length < 2) return "name_required";
  return null;
}
