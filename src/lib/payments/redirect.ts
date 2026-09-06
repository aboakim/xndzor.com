/** Client-side auto-submit of POST redirect forms (iDram, TelCell). */
export function submitPostRedirect(
  action: string,
  fields: Record<string, string>,
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export type CheckoutRedirectResponse = {
  mode?: string;
  ok?: boolean;
  paymentId?: string;
  url?: string;
  demoCheckoutUrl?: string;
  cardCheckoutUrl?: string;
  bankCheckoutUrl?: string;
  redirect?: { action: string; fields: Record<string, string> };
};

export function handleCheckoutResponse(data: CheckoutRedirectResponse): boolean {
  if (data.mode === "free" && data.ok) {
    const pid = data.paymentId ? `?paymentId=${data.paymentId}` : "";
    const locale =
      typeof window !== "undefined"
        ? window.location.pathname.split("/")[1] || "hy"
        : "hy";
    window.location.href = `/${locale}/checkout/success${pid}`;
    return true;
  }
  if (data.mode === "bank" && data.bankCheckoutUrl) {
    window.location.href = data.bankCheckoutUrl;
    return true;
  }
  if (data.mode === "card" && data.cardCheckoutUrl) {
    window.location.href = data.cardCheckoutUrl;
    return true;
  }
  if (data.mode === "demo" && data.demoCheckoutUrl) {
    window.location.href = data.demoCheckoutUrl;
    return true;
  }
  if (data.redirect?.action && data.redirect.fields) {
    submitPostRedirect(data.redirect.action, data.redirect.fields);
    return true;
  }
  if (data.url) {
    window.location.href = data.url;
    return true;
  }
  return false;
}
