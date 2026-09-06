"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ALLOWED_IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/lib/validations";

const CLIENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/pjpeg",
]);

function isAllowedClientFile(file: File): boolean {
  if (file.type && (CLIENT_TYPES.has(file.type) || file.type.startsWith("image/"))) {
    return true;
  }
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

type AvatarUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function AvatarUploadField({ value, onChange, disabled = false }: AvatarUploadFieldProps) {
  const t = useTranslations("profile");
  const tImg = useTranslations("images");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAllowedClientFile(file)) {
        setError(tImg("invalidType"));
        return;
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        setError(tImg("tooLarge", { maxMb: MAX_IMAGE_BYTES / (1024 * 1024) }));
        return;
      }

      setUploading(true);
      setProgress(0);
      try {
        const url = await uploadAvatar(file, {
          onProgress: (pct) => setProgress(pct),
        });
        onChange(url);
        setPreview(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : tImg("uploadError"));
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onChange, tImg]
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadFile(file);
  }

  function remove() {
    onChange(null);
    setPreview(null);
    setError(null);
  }

  const busy = uploading || disabled;
  const initial = preview ? null : "?";

  return (
    <div className="avatar-upload">
      <div className="avatar-upload-preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="avatar-upload-img" />
        ) : (
          <span className="avatar-upload-placeholder" aria-hidden>
            {initial}
          </span>
        )}
      </div>
      <div className="avatar-upload-actions">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          capture="user"
          className="sr-only"
          disabled={busy}
          onChange={onPick}
        />
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("photo.uploading", { pct: progress }) : t("photo.change")}
        </button>
        {preview ? (
          <button type="button" className="btn ghost" disabled={busy} onClick={remove}>
            {t("photo.remove")}
          </button>
        ) : null}
        <p className="field-hint">{t("photo.hint")}</p>
        {error ? (
          <p className="form-error small" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export async function uploadAvatar(
  file: File,
  opts?: { onProgress?: (pct: number) => void }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("files", file);
    fd.append("kind", "avatar");

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && opts?.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      let data: { urls?: string[]; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Upload failed"));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data.error || "Upload failed"));
        return;
      }
      const url = data.urls?.[0];
      if (!url) {
        reject(new Error("Upload failed"));
        return;
      }
      resolve(url);
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  });
}
