"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const MAX_IMAGES = 8;

export function ImageUploadField({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const t = useTranslations("images");
  const [previews, setPreviews] = useState<string[]>([]);

  function sync(next: File[]) {
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    sync([...files, ...selected].slice(0, MAX_IMAGES));
    e.target.value = "";
  }

  function remove(index: number) {
    sync(files.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="image-upload">
      <legend>{t("label")}</legend>
      <p className="muted small">{t("hint")}</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onPick}
        disabled={files.length >= MAX_IMAGES}
      />
      {previews.length > 0 && (
        <ul className="image-preview-grid">
          {previews.map((src, i) => (
            <li key={`${src}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button type="button" className="btn ghost tiny" onClick={() => remove(i)}>
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const fd = new FormData();
  for (const file of files) fd.append("files", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  const data = await res.json();
  return data.urls || [];
}
