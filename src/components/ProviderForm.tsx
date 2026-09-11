"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MARZES } from "@/lib/locations";
import { JOB_TYPES } from "@/lib/matching";
import { JobTypeIcon } from "@/components/AgIcons";
import { toDateInput } from "@/lib/date-input";

export function ProviderForm({
  defaultMarzId,
  defaultPhone,
  listingId,
  initial,
}: {
  defaultMarzId?: string | null;
  defaultPhone?: string | null;
  listingId?: string;
  initial?: {
    title: string;
    description: string;
    jobTypes: string[];
    hectaresMax: number | null;
    rateAmd: number | null;
    rateUnit: string;
    availableFrom: Date | string | null;
    availableTo: Date | string | null;
    coverageNote: string | null;
    marzId: string;
    phone: string;
    whatsapp: string | null;
  };
}) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = Boolean(listingId);
  const [jobTypes, setJobTypes] = useState<string[]>(
    initial?.jobTypes?.length ? initial.jobTypes : ["HARVEST"],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleType(jt: string) {
    setJobTypes((prev) =>
      prev.includes(jt) ? prev.filter((x) => x !== jt) : [...prev, jt],
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
    const res = await fetch(isEdit ? `/api/providers/${listingId}` : "/api/providers", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t(isEdit ? "listingEdit.error" : "providerForm.error"));
      return;
    }
    const p = await res.json();
    router.push(`/providers/${isEdit ? listingId : p.id}`);
    router.refresh();
  }

  return (
    <form className="stack-form listing-form" onSubmit={onSubmit}>
      <label>
        <span>{t("providerForm.title")}</span>
        <input name="title" required minLength={5} defaultValue={initial?.title || ""} />
      </label>
      <label>
        <span>{t("providerForm.description")}</span>
        <textarea
          name="description"
          required
          minLength={10}
          rows={4}
          defaultValue={initial?.description || ""}
        />
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
          <input
            name="hectaresMax"
            type="number"
            step="0.1"
            min={0}
            defaultValue={initial?.hectaresMax ?? ""}
          />
        </label>
        <label>
          <span>{t("providerForm.rate")}</span>
          <input
            name="rateAmd"
            type="number"
            min={0}
            defaultValue={initial?.rateAmd ?? ""}
          />
        </label>
      </div>
      <label>
        <span>{t("providerForm.rateUnit")}</span>
        <select name="rateUnit" defaultValue={initial?.rateUnit || "ha"}>
          <option value="ha">{t("providerForm.perHa")}</option>
          <option value="day">{t("providerForm.perDay")}</option>
          <option value="job">{t("providerForm.perJob")}</option>
        </select>
      </label>
      <div className="form-row">
        <label>
          <span>{t("providerForm.from")}</span>
          <input
            name="availableFrom"
            type="date"
            defaultValue={toDateInput(initial?.availableFrom)}
          />
        </label>
        <label>
          <span>{t("providerForm.to")}</span>
          <input
            name="availableTo"
            type="date"
            defaultValue={toDateInput(initial?.availableTo)}
          />
        </label>
      </div>
      <label>
        <span>{t("providerForm.coverage")}</span>
        <input name="coverageNote" defaultValue={initial?.coverageNote || ""} />
      </label>
      <label>
        <span>{t("jobsForm.marz")}</span>
        <select name="marzId" required defaultValue={initial?.marzId || defaultMarzId || ""}>
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
          <input name="phone" required defaultValue={initial?.phone || defaultPhone || ""} />
        </label>
        <label>
          <span>WhatsApp</span>
          <input name="whatsapp" defaultValue={initial?.whatsapp || defaultPhone || ""} />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={saving}>
        {saving
          ? t(isEdit ? "listingEdit.saving" : "providerForm.saving")
          : t(isEdit ? "listingEdit.submit" : "providerForm.submit")}
      </button>
    </form>
  );
}
