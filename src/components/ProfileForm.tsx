"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MARZES, localizedPlaceName, type LocationVillage } from "@/lib/places";
import { AvatarUploadField } from "@/components/AvatarUploadField";

type ProfileData = {
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  earlyBirdFree?: boolean;
  profileVisibility: string;
  showPhonePublic: boolean;
  showAvatarPublic: boolean;
  showMarzPublic: boolean;
  showVillagePublic: boolean;
  marzId: string | null;
  villageId: string | null;
};

type Props = {
  welcome?: boolean;
  earlyBird?: boolean;
  earlyBirdRemaining?: number;
  earlyBirdLimit?: number;
};

export function ProfileForm({ welcome, earlyBird, earlyBirdRemaining, earlyBirdLimit }: Props) {
  const t = useTranslations("profile");
  const tEarly = useTranslations("earlyBird");
  const tAll = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [marzId, setMarzId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [villages, setVillages] = useState<LocationVillage[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("PUBLIC");
  const [showPhonePublic, setShowPhonePublic] = useState(false);
  const [showAvatarPublic, setShowAvatarPublic] = useState(true);
  const [showMarzPublic, setShowMarzPublic] = useState(true);
  const [showVillagePublic, setShowVillagePublic] = useState(false);
  const [earlyBirdFree, setEarlyBirdFree] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error("load");
        return r.json();
      })
      .then((data: ProfileData) => {
        if (cancelled) return;
        setEmail(data.email);
        setName(data.name);
        setPhone(data.phone || "");
        setAvatarUrl(data.avatarUrl);
        setMarzId(data.marzId || "");
        setVillageId(data.villageId || "");
        setProfileVisibility(data.profileVisibility || "PUBLIC");
        setShowPhonePublic(data.showPhonePublic);
        setShowAvatarPublic(data.showAvatarPublic);
        setShowMarzPublic(data.showMarzPublic);
        setShowVillagePublic(data.showVillagePublic);
        setEarlyBirdFree(Boolean(data.earlyBirdFree));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("errors.load"));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!marzId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    setLoadingVillages(true);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          avatarUrl: avatarUrl || "",
          marzId: marzId || "",
          villageId: villageId || "",
          profileVisibility,
          showPhonePublic,
          showAvatarPublic,
          showMarzPublic,
          showVillagePublic,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        const code = data.code || data.error;
        setError(code ? t(`errors.${code}` as "errors.load") : t("errors.save"));
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
    } catch {
      setError(t("errors.save"));
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="muted">{t("loading")}</p>;
  }

  return (
    <form className="profile-form stack-form" onSubmit={onSubmit}>
      {welcome ? (
        <div className="profile-welcome-stack">
          <p className="profile-welcome-banner">{t("welcomeBanner")}</p>
          {earlyBird ? (
            <p className="early-bird-user-banner-note">
              {earlyBirdRemaining != null && earlyBirdLimit != null
                ? tEarly("profileWelcomeRemaining", {
                    remaining: earlyBirdRemaining,
                    limit: earlyBirdLimit,
                  })
                : tEarly("profileWelcome")}
            </p>
          ) : null}
        </div>
      ) : null}

      {earlyBirdFree && !welcome ? (
        <p className="early-bird-user-banner-note profile-early-bird-badge">
          {tEarly("profileWelcome")}
        </p>
      ) : null}

      <section className="profile-section">
        <h2>{t("sections.photo")}</h2>
        <AvatarUploadField value={avatarUrl} onChange={setAvatarUrl} disabled={saving} />
      </section>

      <section className="profile-section">
        <h2>{t("sections.contact")}</h2>
        <label>
          <span>{t("fields.name")}</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <label>
          <span>{t("fields.email")}</span>
          <input name="email" type="email" value={email} readOnly disabled className="readonly" />
          <small className="field-hint">{t("hints.emailReadonly")}</small>
        </label>
        <label>
          <span>{t("fields.phone")}</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder={t("placeholders.phone")}
          />
        </label>
      </section>

      <section className="profile-section">
        <h2>{t("sections.location")}</h2>
        <label>
          <span>{t("fields.marz")}</span>
          <select value={marzId} onChange={(e) => setMarzId(e.target.value)}>
            <option value="">{t("placeholders.marz")}</option>
            {MARZES.map((m) => (
              <option key={m} value={m}>
                {tAll(`marzes.${m}` as "marzes.Yerevan")}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("fields.village")}</span>
          <select
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
      </section>

      <section className="profile-section">
        <h2>{t("sections.privacy")}</h2>
        <p className="lede small">{t("privacy.lede")}</p>
        <label>
          <span>{t("privacy.visibility")}</span>
          <select
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
          >
            <option value="PUBLIC">{t("privacy.visibilityPublic")}</option>
            <option value="REGISTERED">{t("privacy.visibilityRegistered")}</option>
            <option value="HIDDEN">{t("privacy.visibilityHidden")}</option>
          </select>
        </label>
        <fieldset className="privacy-toggles">
          <legend className="sr-only">{t("privacy.fieldToggles")}</legend>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showAvatarPublic}
              onChange={(e) => setShowAvatarPublic(e.target.checked)}
              disabled={profileVisibility === "HIDDEN"}
            />
            <span>{t("privacy.showAvatar")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showPhonePublic}
              onChange={(e) => setShowPhonePublic(e.target.checked)}
              disabled={profileVisibility === "HIDDEN"}
            />
            <span>{t("privacy.showPhone")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showMarzPublic}
              onChange={(e) => setShowMarzPublic(e.target.checked)}
              disabled={profileVisibility === "HIDDEN"}
            />
            <span>{t("privacy.showMarz")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showVillagePublic}
              onChange={(e) => setShowVillagePublic(e.target.checked)}
              disabled={profileVisibility === "HIDDEN"}
            />
            <span>{t("privacy.showVillage")}</span>
          </label>
        </fieldset>
        <p className="field-hint">{t("privacy.hiddenNote")}</p>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="form-success">{t("saved")}</p> : null}

      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </button>
    </form>
  );
}
