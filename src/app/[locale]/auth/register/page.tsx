"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { MARZES } from "@/lib/utils";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tAll = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: fd.get("email"),
      password: fd.get("password"),
      name: fd.get("name"),
      phone: fd.get("phone"),
      marz: fd.get("marz"),
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setBusy(false);
      setError(t("registerError"));
      return;
    }
    const login = await signIn("credentials", {
      email: String(body.email),
      password: String(body.password),
      redirect: false,
    });
    setBusy(false);
    if (login?.error) {
      router.push("/auth/login");
      return;
    }
    router.push("/plots/new");
    router.refresh();
  }

  return (
    <div className="section narrow auth-panel">
      <h1>{t("registerTitle")}</h1>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          <span>{t("name")}</span>
          <input name="name" required minLength={2} />
        </label>
        <label>
          <span>{t("email")}</span>
          <input name="email" type="email" required />
        </label>
        <label>
          <span>{t("password")}</span>
          <input name="password" type="password" required minLength={10} maxLength={128} />
        </label>
        <label>
          <span>{t("phone")}</span>
          <input name="phone" />
        </label>
        <label>
          <span>{t("marz")}</span>
          <select name="marz" defaultValue="">
            <option value="">—</option>
            {MARZES.map((m) => (
              <option key={m} value={m}>
                {tAll(`marzes.${m}` as "marzes.Yerevan")}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
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
