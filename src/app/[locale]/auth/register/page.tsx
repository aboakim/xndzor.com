"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { useEffect, useState } from "react";

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

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [marzId, setMarzId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

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
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      marz: marzId,
      villageId,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        const code = mapErrorCode(data.code || data.error);
        setError(t(`errors.${code}` as "errors.INVALID_INPUT"));
        setBusy(false);
        return;
      }

      const login = await signIn("credentials", {
        email: body.email,
        password: body.password,
        redirect: false,
      });
      setBusy(false);
      if (login?.error) {
        setError(t("errors.LOGIN_FAILED"));
        return;
      }
      router.push("/plots/new");
      router.refresh();
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
          <span>{t("village")}</span>
          <select
            name="villageId"
            required
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!marzId || loadingVillages}
          >
            <option value="">
              {loadingVillages ? "…" : t("placeholders.village")}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {localizedPlaceName(v, locale)}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="btn primary"
          disabled={busy || !marzId || !villageId}
        >
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
