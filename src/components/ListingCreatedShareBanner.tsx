"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  NEW_LISTING_QUERY_PARAM,
  listingSharePayload,
  listingShareUrlFromLocation,
} from "@/lib/listing-share";

export type ListingCreatedShareBannerProps = {
  title: string;
  priceSnippet?: string | null;
};

function IconFacebook({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function IconWhatsApp({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.96.52 3.87 1.5 5.56L2 22l4.76-1.55a10 10 0 0 0 5.28 1.44h.01c5.46 0 9.89-4.4 9.89-9.85C21.94 6.4 17.5 2 12.04 2zm5.75 13.95c-.24.67-1.4 1.23-1.94 1.31-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.78-4.2-4.93-4.4-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.59.82 2.01.89 2.15.07.14.12.31.02.5-.1.2-.15.31-.3.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.56.16.27.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.19-.28.37-.23.63-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.69-.17 1.36z" />
    </svg>
  );
}

function IconTelegram({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M21.9 4.3 2.7 11.7c-1.3.5-1.3 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.7.4.9 1 .9.6 0 .9-.3 1.2-.6l2.9-2.8 5.5 4c1 .6 1.8.3 2-.9l3.6-17c.4-1.5-.5-2.1-1.6-1.6zM9.3 14.8l-.3 3.9-1.4-4.7 12.2-7.5-10.5 8.3z" />
    </svg>
  );
}

function IconLink({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13.1 19" />
    </svg>
  );
}

/** Dismissible share prompt shown once after publishing (?new=1). */
export function ListingCreatedShareBanner({
  title,
  priceSnippet,
}: ListingCreatedShareBannerProps) {
  const t = useTranslations("share");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const show =
    !dismissed && searchParams.get(NEW_LISTING_QUERY_PARAM) === "1";

  const openShare = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  const onDismiss = useCallback(() => {
    setDismissed(true);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const onFacebook = useCallback(() => {
    const url = listingShareUrlFromLocation(window.location.href);
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }, [openShare]);

  const onWhatsApp = useCallback(() => {
    const url = listingShareUrlFromLocation(window.location.href);
    const { text } = listingSharePayload(title, url, priceSnippet);
    openShare(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }, [openShare, priceSnippet, title]);

  const onTelegram = useCallback(() => {
    const url = listingShareUrlFromLocation(window.location.href);
    const { headline } = listingSharePayload(title, url, priceSnippet);
    openShare(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(headline)}`,
    );
  }, [openShare, priceSnippet, title]);

  const onCopy = useCallback(async () => {
    const url = listingShareUrlFromLocation(window.location.href);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }, []);

  if (!show) return null;

  return (
    <aside
      className="listing-created-share"
      role="region"
      aria-labelledby="listing-created-share-title"
    >
      <div className="listing-created-share-inner">
        <div className="listing-created-share-copy">
          <p id="listing-created-share-title" className="listing-created-share-title">
            {t("createdPrompt.title")}
          </p>
          <p className="listing-created-share-message">{t("createdPrompt.message")}</p>
        </div>
        <div className="listing-created-share-actions">
          <div className="share-buttons-row" role="group" aria-label={t("title")}>
            <button
              type="button"
              className="share-btn"
              onClick={onWhatsApp}
              title={t("whatsapp")}
              aria-label={t("whatsapp")}
            >
              <IconWhatsApp />
            </button>
            <button
              type="button"
              className="share-btn"
              onClick={onTelegram}
              title={t("telegram")}
              aria-label={t("telegram")}
            >
              <IconTelegram />
            </button>
            <button
              type="button"
              className="share-btn"
              onClick={onFacebook}
              title={t("facebook")}
              aria-label={t("facebook")}
            >
              <IconFacebook />
            </button>
            <button
              type="button"
              className="share-btn"
              onClick={onCopy}
              title={t("copy")}
              aria-label={t("copy")}
            >
              <IconLink />
            </button>
          </div>
          {copied ? (
            <p className="share-copied" role="status">
              {t("copied")}
            </p>
          ) : null}
          <button
            type="button"
            className="listing-created-share-dismiss"
            onClick={onDismiss}
            aria-label={t("createdPrompt.dismiss")}
          >
            {t("createdPrompt.dismiss")}
          </button>
        </div>
      </div>
    </aside>
  );
}
