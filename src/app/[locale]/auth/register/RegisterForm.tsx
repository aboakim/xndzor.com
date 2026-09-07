"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { resolveAuthRedirectUrl } from "@/lib/auth-redirect";
import { useEffect, useMemo, useState } from "react";

type RegisterErrorCode =
  | "INVALID_EMAIL"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "INVALID_NAME"
  | "INVALID_PHONE"
  | "INVALID_MARZ"
  | "MARZ_REQUIRED"
  | "VILLAGE_REQUIRED"
  | "INVALID_VILLAGE"
  | "EMAIL_TAKEN"
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "SERVER_ERROR"
  | "LOGIN_FAILED";

function mapErrorCode(raw: unknown): RegisterErrorCode {
  const code = typeof raw === "string" ? raw : "";
  const known: RegisterErrorCode[] = [
    "INVALID_EMAIL",
    "PASSWORD_TOO_SHORT",
    "PASSWORD_TOO_LONG",
    "INVALID_NAME",
    "INVALID_PHONE",
    "INVALID_MARZ",
    "MARZ_REQUIRED",
    "VILLAGE_REQUIRED",
    "INVALID_VILLAGE",
    "EMAIL_TAKEN",
    "RATE_LIMITED",
    "INVALID_INPUT",
    "SERVER_ERROR",
  ];
  if ((known as string[]).includes(code)) return code as RegisterErrorCode;
  return "INVALID_INPUT";
}

type Props = {
  callbackUrl?: string;
};

export default function RegisterForm({ callbackUrl }: Props) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tEarly = useTranslations("earlyBird");
  const tAll = useTranslations();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [marzId, setMarzId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  /** Yerevan is the city itself — district/village is optional. */
  const villageOptional = marzId === "Yerevan";
  const canSubmit = useMemo(() => {
    if (!marzId || busy) return false;
    if (villageOptional) return true;
    return Boolean(villageId);
  }, [busy, marzId, villageId, villageOptional]);

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      setVillageId("");
      return;
    }
    let cancelled = false;
    setLoadingVillages(true);
    setVillageId("");
    fetch(`/api/villages?marzId=${encodeURIComponent(marzId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setVillages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingVillages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marzId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      marz: marzId,
      villageId: villageId || "",
    };

    if (!body.marz) {
      setError(t("errors.MARZ_REQUIRED"));
      setBusy(false);
      return;
    }
    if (!villageOptional && !body.villageId) {
      setError(t("errors.VILLAGE_REQUIRED"));
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        earlyBird?: {
          qualified?: boolean;
          remaining?: number;
          freeLimit?: number;
          slotsFull?: boolean;
        };
      };

      if (!res.ok) {
        const code = mapErrorCode(data.code || data.error);
        setError(t(`errors.${code}` as "errors.INVALID_INPUT"));
        setBusy(false);
        return;
      }

      const eb = data.earlyBird;
      if (eb && !eb.slotsFull && eb.remaining != null) {
        setSuccess(
          `${tEarly("registerSuccess")} ${tEarly("registerSuccessRemaining", {
            remaining: eb.remaining,
            limit: eb.freeLimit ?? 100,
          })}`,
        );
      } else if (eb?.slotsFull) {
        setSuccess(tEarly("registerNoSlot"));
      } else {
        setSuccess(tEarly("registerSuccess"));
      }

      const login = await signIn("credentials", {
        email: body.email,
        password: body.password,
        redirect: false,
      });
      if (login?.error) {
        setBusy(false);
        setError(t("errors.LOGIN_FAILED"));
        return;
      }

      const qs = new URLSearchParams({ welcome: "1" });
      if (eb && !eb.slotsFull && eb.remaining != null) {
        if (eb.remaining != null) qs.set("remaining", String(eb.remaining));
        if (eb.freeLimit != null) qs.set("limit", String(eb.freeLimit));
      }
      const dest = callbackUrl
        ? resolveAuthRedirectUrl(callbackUrl, locale)
        : `/${locale}/account/profile?${qs.toString()}`;
      window.setTimeout(() => {
        window.location.href = dest;
      }, eb ? 1800 : 0);
      setBusy(false);
    } catch {
      setBusy(false);
      setError(t("errors.SERVER_ERROR"));
    }
  }

  return (
    <div className="section narrow auth-panel">
      <h1>{t("registerTitle")}</h1>
      <form className="stack-form" onSubmit={onSubmit} noValidate>
        <label>
          <span>{t("name")}</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder={t("placeholders.name")}
          />
        </label>
        <label>
          <span>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("placeholders.email")}
          />
        </label>
        <label>
          <span>{t("password")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            placeholder={t("placeholders.password")}
          />
          <small className="field-hint">{t("hints.password")}</small>
        </label>
        <label>
          <span>{t("phone")}</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("placeholders.phone")}
          />
          <small className="field-hint">{t("hints.phone")}</small>
        </label>
        <label>
          <span>{t("marz")}</span>
          <select
            name="marz"
            required
            value={marzId}
            onChange={(e) => setMarzId(e.target.value)}
          >
            <option value="">{t("placeholders.marz")}</option>
            {MARZES.map((m) => (
              <option key={m} value={m}>
                {tAll(`marzes.${m}` as "marzes.Yerevan")}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {t("village")}
            {villageOptional ? (
              <span className="field-optional"> ({t("optional")})</span>
            ) : null}
          </span>
          <select
            name="villageId"
            required={!villageOptional}
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!marzId || loadingVillages}
          >
            <option value="">
              {loadingVillages
                ? "…"
                : villageOptional
                  ? t("placeholders.villageOptional")
                  : t("placeholders.village")}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {localizedPlaceName(v, locale)}
              </option>
            ))}
          </select>
          {villageOptional ? (
            <small className="field-hint">{t("hints.villageYerevan")}</small>
          ) : null}
        </label>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success early-bird-register-success">{success}</p>}
        <button type="submit" className="btn primary" disabled={!canSubmit}>
          {t("registerSubmit")}
        </button>
      </form>
      <p className="auth-switch">
        {t("hasAccount")}{" "}
        <Link href="/auth/login">{tNav("login")}</Link>
      </p>
    </div>
  );
}
