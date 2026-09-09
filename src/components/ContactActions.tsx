"use client";

import { useTranslations } from "next-intl";
import { telUrl, whatsappUrl } from "@/lib/utils";

export function ContactActions({
  phone,
  whatsapp,
  waText,
  hideContact = false,
}: {
  phone: string;
  whatsapp?: string | null;
  waText?: string;
  /** When true (platform-admin owner), hide Call / WhatsApp / phone links. */
  hideContact?: boolean;
}) {
  const t = useTranslations("common");
  const wa = whatsapp || phone;

  if (hideContact) {
    return (
      <p className="muted contact-unavailable">{t("contactUnavailable")}</p>
    );
  }

  return (
    <div className="contact-actions">
      <a className="btn whatsapp" href={whatsappUrl(wa, waText)} target="_blank" rel="noreferrer">
        {t("whatsapp")}
      </a>
      <a className="btn primary" href={telUrl(phone)}>
        {t("call")}
      </a>
    </div>
  );
}
