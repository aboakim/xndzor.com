"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { JOB_TYPES } from "@/lib/matching";
import { JobTypeIcon } from "@/components/AgIcons";

export function JobRequestForm({
  defaultMarzId,
  defaultPhone,
  defaultJobType,
  defaultTitle,
  defaultHectares,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
  defaultJobType?: string | null;
  defaultTitle?: string | null;
  defaultHectares?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [jobType, setJobType] = useState(defaultJobType || "HARVEST");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), jobType };
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("jobsForm.error"));
      return;
    }
    const job = await res.json();
    router.push(`/jobs/${job.id}`);
    router.refresh();
  }

  return (
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <fieldset className="chip-fieldset">
        <legend>{t("jobsForm.jobType")}</legend>
        <div className="chip-row">
          {JOB_TYPES.map((jt) => (
            <label key={jt} className={`chip ${jobType === jt ? "on" : ""}`}>
              <input
                type="radio"
                name="jobTypeRadio"
                checked={jobType === jt}
                onChange={() => setJobType(jt)}
              />
              <JobTypeIcon type={jt} size={14} />
              {t(`jobTypes.${jt}` as "jobTypes.HARVEST")}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span>{t("jobsForm.title")}</span>
        <input
          name="title"
          required
          minLength={5}
          placeholder={t("jobsForm.titleHint")}
          defaultValue={defaultTitle || ""}
        />
      </label>
      <label>
        <span>{t("jobsForm.description")}</span>
        <textarea name="description" required minLength={10} rows={4} />
      </label>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.hectares")}</span>
          <input
            name="hectares"
            type="number"
            step="0.1"
            min={0}
            defaultValue={defaultHectares || ""}
          />
        </label>
        <label>
          <span>{t("jobsForm.areaNote")}</span>
          <input name="areaNote" placeholder="6 հա ցորեն" />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.workDate")}</span>
          <input name="workDate" type="date" />
        </label>
        <label>
          <span>{t("jobsForm.budget")}</span>
          <input name="budgetAmd" type="number" min={0} />
        </label>
      </div>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={defaultMarzId || ""}>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("jobsForm.phone")}</span>
        <input name="phone" required defaultValue={defaultPhone || ""} />
      </label>
      <label>
        <span>WhatsApp ({t("common.optional")})</span>
        <input name="whatsapp" defaultValue={defaultPhone || ""} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving}>
        {saving ? t("jobsForm.saving") : t("jobsForm.submit")}
      </button>
    </form>
  );
}
