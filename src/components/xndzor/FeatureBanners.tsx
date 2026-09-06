"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { FeatureBanner } from "./FeatureBanner";

function SolveVisual() {
  const t = useTranslations("xndzor.featureBanners.solve");
  const nodes = [
    { key: "workers", emoji: "👷" },
    { key: "equipment", emoji: "🚜" },
    { key: "truck", emoji: "🚛" },
    { key: "buyer", emoji: "🛒" },
  ] as const;

  return (
    <div className="fxb-solve-stage">
      <div className="fxb-solve-need">
        <span className="fxb-solve-need-label">{t("needLabel")}</span>
        <strong>{t("needExample")}</strong>
      </div>

      <div className="fxb-solve-arrow" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="fxb-solve-nodes">
        {nodes.map((n, i) => (
          <span key={n.key} className={`fxb-solve-node fxb-solve-node-${i}`}>
            <span className="fxb-solve-node-emoji">{n.emoji}</span>
            <span className="fxb-solve-node-label">{t(`nodes.${n.key}`)}</span>
          </span>
        ))}
      </div>

      <div className="fxb-solve-bundle">
        <span className="fxb-solve-bundle-ring" />
        <strong>{t("bundleLabel")}</strong>
        <em>{t("bundleMeta")}</em>
      </div>
    </div>
  );
}

function RouteVisual() {
  const t = useTranslations("xndzor.featureBanners.route");
  const stops = [
    { key: "armavir", farms: "3" },
    { key: "artashat", farms: "2" },
    { key: "yerevan", farms: "0" },
  ] as const;

  return (
    <div className="fxb-route-stage">
      <svg className="fxb-route-map" viewBox="0 0 240 140" fill="none">
        <path
          className="fxb-route-path"
          d="M28 108 C58 88, 78 72, 100 62 C130 48, 155 42, 212 28"
        />
        <circle className="fxb-route-pin fxb-route-pin-0" cx="28" cy="108" r="7" />
        <circle className="fxb-route-pin fxb-route-pin-1" cx="100" cy="62" r="7" />
        <circle className="fxb-route-pin fxb-route-pin-2" cx="212" cy="28" r="8" />
        <g className="fxb-route-truck">
          <rect x="118" y="48" width="22" height="12" rx="2.5" />
          <rect x="138" y="52" width="10" height="8" rx="1.5" />
          <circle cx="124" cy="62" r="2.5" />
          <circle cx="142" cy="62" r="2.5" />
        </g>
      </svg>

      <ol className="fxb-route-stops">
        {stops.map((s) => (
          <li key={s.key}>
            <strong>{t(`stops.${s.key}`)}</strong>
            <span>
              {s.farms === "0"
                ? t("destination")
                : t("stopFarms", { n: Number(s.farms) })}
            </span>
          </li>
        ))}
      </ol>

      <p className="fxb-route-split">{t("splitChip")}</p>
    </div>
  );
}

function GrowVisual() {
  const t = useTranslations("xndzor.featureBanners.grow");

  return (
    <div className="fxb-grow-stage">
      <div className="fxb-grow-bars">
        <div className="fxb-grow-col">
          <div className="fxb-grow-bar fxb-grow-bar-demand" style={{ height: "78%" }} />
          <span>{t("demand")}</span>
        </div>
        <div className="fxb-grow-col">
          <div className="fxb-grow-bar fxb-grow-bar-supply" style={{ height: "46%" }} />
          <span>{t("supply")}</span>
        </div>
        <div className="fxb-grow-col">
          <div className="fxb-grow-bar fxb-grow-bar-warn" style={{ height: "92%" }} />
          <span>{t("over")}</span>
        </div>
      </div>

      <div className="fxb-grow-alert">
        <span className="fxb-grow-alert-pulse" />
        <strong>{t("alertTitle")}</strong>
        <em>{t("alertBody")}</em>
      </div>
    </div>
  );
}

function PassportVisual() {
  const t = useTranslations("xndzor.featureBanners.passport");
  const score = 87;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="fxb-pass-stage">
      <div className="fxb-pass-score">
        <svg viewBox="0 0 100 100" className="fxb-pass-ring">
          <circle className="fxb-pass-track" cx="50" cy="50" r="42" />
          <circle
            className="fxb-pass-progress"
            cx="50"
            cy="50"
            r="42"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="fxb-pass-score-core">
          <strong>{score}</strong>
          <span>{t("scoreLabel")}</span>
        </div>
      </div>

      <div className="fxb-pass-side">
        <div className="fxb-pass-qr" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="fxb-pass-trusted">{t("trusted")}</p>
        <p className="fxb-pass-qr-label">{t("qrLabel")}</p>
      </div>
    </div>
  );
}

export function FeatureBanners() {
  const t = useTranslations("xndzor.featureBanners");

  return (
    <section className="fxb-gallery" aria-label={t("sectionLabel")}>
      <Reveal
        className="banner-gallery-slot fxb-gallery-spotlight"
        delayMs={70}
      >
        <FeatureBanner
          variant="solve"
          href="#xndzor-hero"
          aboutHref="/features/solve"
          titleId="fxb-solve-title"
          size="spotlight"
          visual={<SolveVisual />}
        />
      </Reveal>

      <div className="fxb-gallery-pair">
        <Reveal className="banner-gallery-slot" delayMs={100}>
          <FeatureBanner
            variant="route"
            href="#xndzor-route"
            aboutHref="/features/route"
            titleId="fxb-route-title"
            size="compact"
            visual={<RouteVisual />}
          />
        </Reveal>
        <Reveal className="banner-gallery-slot" delayMs={140}>
          <FeatureBanner
            variant="passport"
            href="/farms/me"
            aboutHref="/features/passport"
            titleId="fxb-passport-title"
            size="compact"
            visual={<PassportVisual />}
          />
        </Reveal>
      </div>

      <Reveal className="banner-gallery-slot fxb-gallery-wide" delayMs={160}>
        <FeatureBanner
          variant="grow"
          href="/grow"
          aboutHref="/features/grow"
          titleId="fxb-grow-title"
          size="wide"
          mirror
          visual={<GrowVisual />}
        />
      </Reveal>
    </section>
  );
}
