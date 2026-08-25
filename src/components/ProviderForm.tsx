"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { JOB_TYPES } from "@/lib/matching";
import { JobTypeIcon } from "@/components/AgIcons";

export function ProviderForm({
  defaultMarzId,
  defaultPhone,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [jobTypes, setJobTypes] = useState<string[]>(["HARVEST"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleType(jt: string) {
    setJobTypes((prev) =>
      prev.includes(jt) ? prev.filter((x) => x !== jt) : [...prev, jt]
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (jobTypes.length === 0) {
      setError(t("providerForm.needType"));
      return;
    }
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(fd.entries()),
      jobTypes,
    };
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("providerForm.error"));
      return;
    }
    const p = await res.json();
    router.push(`/providers/${p.id}`);
    router.refresh();
  }

  return (
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("providerForm.title")}</span>
        <input name="title" required minLength={5} />
      </label>
      <label>
        <span>{t("providerForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} />
      </label>
      <fieldset className="chip-fieldset">
        <legend>{t("providerForm.jobTypes")}</legend>
        <div className="chip-row">
          {JOB_TYPES.map((jt) => (
            <label key={jt} className={`chip ${jobTypes.includes(jt) ? "on" : ""}`}>
              <input
                type="checkbox"
                checked={jobTypes.includes(jt)}
                onChange={() => toggleType(jt)}
              />
              <JobTypeIcon type={jt} size={14} />
              {t(`jobTypes.${jt}` as "jobTypes.HARVEST")}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-row">
        <label>
          <span>{t("providerForm.hectaresMax")}</span>
          <input name="hectaresMax" type="number" step="0.1" min={0} />
        </label>
        <label>
          <span>{t("providerForm.rate")}</span>
          <input name="rateAmd" type="number" min={0} />
        </label>
      </div>
      <label>
        <span>{t("providerForm.rateUnit")}</span>
        <select name="rateUnit" defaultValue="ha">
          <option value="ha">{t("providerForm.perHa")}</option>
          <option value="day">{t("providerForm.perDay")}</option>
          <option value="job">{t("providerForm.perJob")}</option>
        </select>
      </label>
      <div className="form-row">
        <label>
          <span>{t("providerForm.from")}</span>
          <input name="availableFrom" type="date" />
        </label>
        <label>
          <span>{t("providerForm.to")}</span>
          <input name="availableTo" type="date" />
        </label>
      </div>
      <label>
        <span>{t("providerForm.coverage")}</span>
        <input name="coverageNote" />
      </label>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={defaultMarzId || ""}>
          <option value="" disabled>
            —
          </option>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.phone")}</span>
          <input name="phone" required defaultValue={defaultPhone || ""} />
        </label>
        <label>
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={defaultPhone || ""} />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("providerForm.saving") : t("providerForm.submit")}
      </button>
    </form>
  );
}
