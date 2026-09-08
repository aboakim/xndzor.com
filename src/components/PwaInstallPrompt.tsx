"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "other";

const DISMISS_KEY = "xndzor-pwa-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  // iPadOS 13+ may report as Mac; treat touch Macs as iOS for install UX.
  const iPadOsDesktopUa =
    /macintosh/i.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOsDesktopUa) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isMobileish(platform: Platform): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 900px)").matches || platform === "ios" || platform === "android";
}

export function PwaInstallPrompt() {
  const t = useTranslations("pwa");
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);

    if (isStandalone() || !isMobileish(detected)) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    if (detected === "ios") {
      setVisible(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // Soft tip if BIP is delayed/unavailable (common on Android Chrome).
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
    setShowSteps((v) => !v);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    setShowSteps(false);
  }

  const hint =
    platform === "ios"
      ? t("iosHint")
      : deferred
        ? t("androidHint")
        : platform === "android"
          ? t("androidHint")
          : t("genericHint");

  const stepKeys =
    platform === "ios"
      ? (["iosStep1", "iosStep2", "iosStep3"] as const)
      : platform === "android"
        ? (["androidStep1", "androidStep2", "androidStep3"] as const)
        : (["androidStep1", "androidStep2", "androidStep3"] as const);

  const ctaLabel = deferred
    ? t("install")
    : showSteps
      ? t("gotIt")
      : t("howTo");

  return (
    <div className="pwa-install" role="region" aria-label={t("install")}>
      <div className="pwa-install-inner">
        <div className="pwa-install-copy">
          <strong className="pwa-install-title">{t("install")}</strong>
          <p className="pwa-install-desc">{hint}</p>
          {showSteps ? (
            <ol className="pwa-install-steps">
              {stepKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ol>
          ) : null}
        </div>
        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-btn" onClick={onInstall}>
            {ctaLabel}
          </button>
          <button type="button" className="pwa-install-dismiss" onClick={dismiss} aria-label={t("dismiss")}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
