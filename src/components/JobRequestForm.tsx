"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { JOB_TYPES } from "@/lib/matching";
import { JobTypeIcon } from "@/components/AgIcons";
import { toDateInput } from "@/lib/date-input";

export function JobRequestForm({
  defaultMarzId,
  defaultPhone,
  defaultJobType,
  defaultTitle,
  defaultHectares,
  listingId,
  initial,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
  defaultJobType?: string | null;
  defaultTitle?: string | null;
  defaultHectares?: string | null;
  listingId?: string;
  initial?: {
    jobType: string;
    title: string;
    description: string;
    hectares: number | null;
    areaNote: string | null;
    workDate: Date | string | null;
    budgetAmd: number | null;
    marzId: string;
    phone: string;
    whatsapp: string | null;
  };
}) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = Boolean(listingId);
  const [jobType, setJobType] = useState(initial?.jobType || defaultJobType || "HARVEST");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), jobType };
    const res = await fetch(isEdit ? `/api/jobs/${listingId}` : "/api/jobs", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t(isEdit ? "listingEdit.error" : "jobsForm.error"));
      return;
    }
    const job = await res.json();
    router.push(`/jobs/${isEdit ? listingId : job.id}`);
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
          defaultValue={initial?.title || defaultTitle || ""}
        />
      </label>
      <label>
        <span>{t("jobsForm.description")}</span>
        <textarea
          name="description"
          required
          minLength={10}
          rows={4}
          defaultValue={initial?.description || ""}
        />
      </label>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.hectares")}</span>
          <input
            name="hectares"
            type="number"
            step="0.1"
            min={0}
            defaultValue={initial?.hectares ?? defaultHectares ?? ""}
          />
        </label>
        <label>
          <span>{t("jobsForm.areaNote")}</span>
          <input
            name="areaNote"
            placeholder="6 հա ցորեն"
            defaultValue={initial?.areaNote || ""}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>{t("jobsForm.workDate")}</span>
          <input
            name="workDate"
            type="date"
            defaultValue={toDateInput(initial?.workDate)}
          />
        </label>
        <label>
          <span>{t("jobsForm.budget")}</span>
          <input
            name="budgetAmd"
            type="number"
            min={0}
            defaultValue={initial?.budgetAmd ?? ""}
          />
        </label>
      </div>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={initial?.marzId || defaultMarzId || ""}>
          {MARZES.map((m) => (
            <option key={m} value={m}>
              {t(`marzes.${m}` as "marzes.Yerevan")}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("jobsForm.phone")}</span>
        <input name="phone" required defaultValue={initial?.phone || defaultPhone || ""} />
      </label>
      <label>
        <span>WhatsApp ({t("common.optional")})</span>
        <input name="whatsapp" defaultValue={initial?.whatsapp || defaultPhone || ""} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving}>
        {saving
          ? t(isEdit ? "listingEdit.saving" : "jobsForm.saving")
          : t(isEdit ? "listingEdit.submit" : "jobsForm.submit")}
      </button>
    </form>
  );
}
