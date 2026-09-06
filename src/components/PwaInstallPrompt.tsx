"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "xndzor-pwa-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobileish(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 900px)").matches || isIos();
}

export function PwaInstallPrompt() {
  const t = useTranslations("pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobileish()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    if (isIos()) {
      setVisible(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // Fallback: show soft tip even if BIP hasn't fired yet (Chrome may delay it).
    const timer = window.setTimeout(() => {
      if (!isStandalone()) setVisible(true);
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  async function onInstall() {
    if (deferred) {
      await deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        /* ignore */
      }
      setDeferred(null);
      setVisible(false);
      return;
    }
    if (isIos()) {
      setShowIosHelp((v) => !v);
      return;
    }
    setShowIosHelp(true);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    setShowIosHelp(false);
  }

  const ios = isIos();

  return (
    <div className="pwa-install" role="region" aria-label={t("install")}>
      <div className="pwa-install-inner">
        <div className="pwa-install-copy">
          <strong className="pwa-install-title">{t("install")}</strong>
          <p className="pwa-install-desc">
            {ios ? t("iosHint") : deferred ? t("androidHint") : t("genericHint")}
          </p>
          {showIosHelp ? (
            <ol className="pwa-install-steps">
              <li>{t("iosStep1")}</li>
              <li>{t("iosStep2")}</li>
              <li>{t("iosStep3")}</li>
            </ol>
          ) : null}
        </div>
        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-btn" onClick={onInstall}>
            {ios ? (showIosHelp ? t("gotIt") : t("howTo")) : deferred ? t("install") : t("howTo")}
          </button>
          <button type="button" className="pwa-install-dismiss" onClick={dismiss} aria-label={t("dismiss")}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
