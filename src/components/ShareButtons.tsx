"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type ShareButtonsProps = {
  title: string;
  /** Optional price / budget line included in share text */
  priceSnippet?: string | null;
};

function sharePayload(title: string, url: string, priceSnippet?: string | null) {
  const headline = priceSnippet ? `${title} — ${priceSnippet}` : title;
  return { url, headline, text: `${headline}\n${url}` };
}

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

function IconViber({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M11.4 2C6.7 2.1 3.1 5.4 2.6 9.9c-.3 2.7.4 5.1 1.9 7l-.7 3.4 3.5-.9c1.6.8 3.4 1.2 5.3 1.1 4.8-.2 8.7-4.1 8.8-8.9.1-5-4.1-9.1-9.9-9.6zm4.7 13.1c-.2.5-.9.9-1.5 1-.4.1-1 .2-2.9-.6-2.3-1-3.8-3.4-3.9-3.6-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .4l-.4.5c-.1.1-.3.3-.1.5.1.3.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.7c.1-.2.3-.1.5-.1l1.6.8c.2.1.4.1.4.3 0 .2 0 .8-.4 1.3z" />
    </svg>
  );
}

function IconX({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.2l7.3-8.3L1 2h6.4l4.4 5.8L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
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

function IconShare({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

/** Reusable social share row for listing detail pages. */
export function ShareButtons({ title, priceSnippet }: ShareButtonsProps) {
  const t = useTranslations("share");
  const [canNative, setCanNative] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const openShare = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  const onFacebook = useCallback(() => {
    const { url } = sharePayload(title, window.location.href, priceSnippet);
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }, [openShare, priceSnippet, title]);

  const onWhatsApp = useCallback(() => {
    const { text } = sharePayload(title, window.location.href, priceSnippet);
    openShare(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }, [openShare, priceSnippet, title]);

  const onTelegram = useCallback(() => {
    const { url, headline } = sharePayload(title, window.location.href, priceSnippet);
    openShare(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(headline)}`,
    );
  }, [openShare, priceSnippet, title]);

  const onViber = useCallback(() => {
    const { text } = sharePayload(title, window.location.href, priceSnippet);
    window.location.href = `viber://forward?text=${encodeURIComponent(text)}`;
  }, [priceSnippet, title]);

  const onX = useCallback(() => {
    const { url, headline } = sharePayload(title, window.location.href, priceSnippet);
    openShare(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(headline)}`,
    );
  }, [openShare, priceSnippet, title]);

  const onCopy = useCallback(async () => {
    const url = window.location.href;
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

  const onNative = useCallback(async () => {
    const { url, headline, text } = sharePayload(title, window.location.href, priceSnippet);
    try {
      await navigator.share({ title: headline, text, url });
    } catch {
      /* user cancelled */
    }
  }, [priceSnippet, title]);

  return (
    <div className="share-buttons">
      <p className="share-buttons-label">{t("title")}</p>
      <div className="share-buttons-row" role="group" aria-label={t("title")}>
        {canNative ? (
          <button type="button" className="share-btn share-btn-native" onClick={onNative} title={t("native")} aria-label={t("native")}>
            <IconShare />
          </button>
        ) : null}
        <button type="button" className="share-btn" onClick={onFacebook} title={t("facebook")} aria-label={t("facebook")}>
          <IconFacebook />
        </button>
        <button type="button" className="share-btn" onClick={onWhatsApp} title={t("whatsapp")} aria-label={t("whatsapp")}>
          <IconWhatsApp />
        </button>
        <button type="button" className="share-btn" onClick={onTelegram} title={t("telegram")} aria-label={t("telegram")}>
          <IconTelegram />
        </button>
        <button type="button" className="share-btn" onClick={onViber} title={t("viber")} aria-label={t("viber")}>
          <IconViber />
        </button>
        <button type="button" className="share-btn" onClick={onX} title={t("x")} aria-label={t("x")}>
          <IconX />
        </button>
        <button type="button" className="share-btn" onClick={onCopy} title={t("copy")} aria-label={t("copy")}>
          <IconLink />
        </button>
      </div>
      {copied ? <p className="share-copied" role="status">{t("copied")}</p> : null}
      <p className="share-tip">{t("tip")}</p>
    </div>
  );
}

/** Alias for listing detail pages */
export const ListingShare = ShareButtons;
