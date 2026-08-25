"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError(true);
      return;
    }
    router.push("/matches");
    router.refresh();
  }

  return (
    <div className="section narrow auth-panel">
      <h1>{t("loginTitle")}</h1>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          <span>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          <span>{t("password")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="form-error">{t("error")}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
          {t("loginSubmit")}
        </button>
      </form>
      <p className="auth-switch">
        {t("noAccount")}{" "}
        <Link href="/auth/register">{tNav("register")}</Link>
      </p>
    </div>
  );
}
