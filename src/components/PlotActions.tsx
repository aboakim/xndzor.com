"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ImageUploadField, uploadImages } from "@/components/ImageUploadField";

export function PlotActions({
  plotId,
  defaultTitle,
  defaultQtyTons,
}: {
  plotId: string;
  defaultTitle: string;
  defaultQtyTons: number;
}) {
  const t = useTranslations("plots");
  const router = useRouter();
  const [override, setOverride] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState("");

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/plots/${plotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  }

  async function saveOverride(e: FormEvent) {
    e.preventDefault();
    setBusy("yield");
    setMsg("");
    const res = await patch({
      action: "yieldOverride",
      farmerOverrideTons: Number(override),
    });
    setBusy("");
    if (!res.ok) {
      setMsg(t("error"));
      return;
    }
    setMsg(t("yieldSaved"));
    router.refresh();
  }

  async function publish(e: FormEvent) {
    e.preventDefault();
    setBusy("publish");
    setMsg("");
    const res = await patch({
      action: "publishHarvest",
      title: defaultTitle,
      unit: "ton",
      priceAmd: price || "",
    });
    setBusy("");
    if (!res.ok) {
      setMsg(t("error"));
      return;
    }
    const listing = await res.json();
    router.push(`/forward/${listing.id}`);
    router.refresh();
  }

  async function uploadPhoto(e: FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setBusy("photo");
    setMsg("");
    try {
      const urls = await uploadImages(files);
      const res = await patch({ action: "photo", imageUrl: urls[0] });
      setBusy("");
      if (!res.ok) {
        setMsg(t("error"));
        return;
      }
      setFiles([]);
      setMsg(t("photoSaved"));
      router.refresh();
    } catch {
      setBusy("");
      setMsg(t("error"));
    }
  }

  return (
    <div className="plot-actions stack-form">
      <form onSubmit={saveOverride} className="inline-action">
        <h3>{t("editYield")}</h3>
        <p className="muted small">{t("yieldHint", { tons: defaultQtyTons })}</p>
        <label>
          <span>{t("fields.override")}</span>
          <input
            type="number"
            step="0.1"
            min={0.1}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn secondary dark" disabled={busy === "yield"}>
          {busy === "yield" ? t("saving") : t("saveYield")}
        </button>
      </form>

      <form onSubmit={publish} className="inline-action">
        <h3>{t("publishHarvest")}</h3>
        <p className="muted small">{t("publishHint")}</p>
        <label>
          <span>{t("priceOptional")}</span>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <button type="submit" className="btn primary" disabled={busy === "publish"}>
          {busy === "publish" ? t("saving") : t("publishCta")}
        </button>
      </form>

      <form onSubmit={uploadPhoto} className="inline-action">
        <h3>{t("photoTitle")}</h3>
        <p className="muted small disclaimer">{t("photoDisclaimer")}</p>
        <ImageUploadField
          files={files}
          onChange={(next) => setFiles(next.slice(0, 1))}
        />
        <button type="submit" className="btn secondary dark" disabled={busy === "photo" || !files.length}>
          {busy === "photo" ? t("saving") : t("photoUpload")}
        </button>
      </form>

      {msg ? <p className="muted">{msg}</p> : null}
    </div>
  );
}

export function TaskDoneButton({ plotId, taskId }: { plotId: string; taskId: string }) {
  const t = useTranslations("plots");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function done() {
    setBusy(true);
    await fetch(`/api/plots/${plotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "taskStatus", taskId, status: "DONE" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className="btn secondary dark" onClick={done} disabled={busy}>
      {t("taskDone")}
    </button>
  );
}
