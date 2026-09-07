"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
} from "@/lib/validations";

const CLIENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/pjpeg",
]);

function isAllowedClientFile(file: File): boolean {
  if (file.type && CLIENT_TYPES.has(file.type)) {
    return true;
  }
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

type ImageUploadFieldProps = {
  files: File[];
  onChange: (files: File[]) => void;
  existingUrls?: string[];
  onExistingChange?: (urls: string[]) => void;
  maxImages?: number;
  uploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
};

export function ImageUploadField({
  files,
  onChange,
  existingUrls = [],
  onExistingChange,
  maxImages = MAX_LISTING_IMAGES,
  uploading = false,
  uploadProgress,
  disabled = false,
}: ImageUploadFieldProps) {
  const t = useTranslations("images");
  const inputId = useId();
  const cameraInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount = existingUrls.length + files.length;
  const atLimit = totalCount >= maxImages;
  const busy = uploading || disabled;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const valid: File[] = [];
      for (const file of incoming) {
        if (!isAllowedClientFile(file)) {
          setError(t("invalidType"));
          continue;
        }
        if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
          setError(t("tooLarge", { maxMb: MAX_IMAGE_BYTES / (1024 * 1024) }));
          continue;
        }
        valid.push(file);
      }
      if (valid.length === 0) return;

      const slotsLeft = maxImages - existingUrls.length - files.length;
      if (slotsLeft <= 0) {
        setError(t("maxReached", { max: maxImages }));
        return;
      }

      const accepted = valid.slice(0, slotsLeft);
      onChange([...files, ...accepted]);
      if (valid.length > slotsLeft) {
        setError(t("maxReached", { max: maxImages }));
      }
    },
    [existingUrls.length, files, maxImages, onChange, t]
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function removeNew(index: number) {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  }

  function removeExisting(index: number) {
    if (!onExistingChange) return;
    onExistingChange(existingUrls.filter((_, i) => i !== index));
    setError(null);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!busy && !atLimit) setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (busy || atLimit) return;
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  function openPicker() {
    if (!busy && !atLimit) inputRef.current?.click();
  }

  return (
    <fieldset className="image-upload" aria-describedby={`${inputId}-hint ${error ? `${inputId}-err` : ""}`}>
      <legend>{t("label")}</legend>
      <p id={`${inputId}-hint`} className="muted small">
        {t("hint", { max: maxImages, maxMb: MAX_IMAGE_BYTES / (1024 * 1024) })}
      </p>
      <p className="image-upload-counter" aria-live="polite">
        {t("counter", { count: totalCount, max: maxImages })}
      </p>

      <div
        className={`image-upload-dropzone${dragOver ? " drag-over" : ""}${busy ? " busy" : ""}${atLimit ? " at-limit" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        role="button"
        tabIndex={busy || atLimit ? -1 : 0}
        aria-label={t("dropzoneLabel")}
        aria-disabled={busy || atLimit}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          multiple
          onChange={onPick}
          disabled={busy || atLimit}
          className="image-upload-input"
          aria-label={t("add")}
        />
        <span className="image-upload-dropzone-icon" aria-hidden>
          📷
        </span>
        <span className="image-upload-dropzone-text">{t("dropzone")}</span>
        <span className="image-upload-dropzone-sub muted small">{t("maxPhotos", { max: maxImages })}</span>
      </div>

      <div
        className="image-upload-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn ghost small"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
          disabled={busy || atLimit}
        >
          {t("add")}
        </button>
        <label htmlFor={cameraInputId} className="btn ghost small image-upload-camera-label">
          {t("camera")}
          <input
            id={cameraInputId}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            capture="environment"
            onChange={onPick}
            disabled={busy || atLimit}
            className="image-upload-input"
            aria-label={t("camera")}
          />
        </label>
      </div>

      {uploading && (
        <div className="image-upload-progress" role="status" aria-live="polite">
          <div
            className="image-upload-progress-bar"
            style={{ width: `${uploadProgress ?? 0}%` }}
          />
          <span className="muted small">
            {uploadProgress != null ? t("uploadingProgress", { pct: uploadProgress }) : t("uploading")}
          </span>
        </div>
      )}

      {(existingUrls.length > 0 || previews.length > 0) && (
        <ul className="image-preview-grid" aria-label={t("previewLabel")}>
          {existingUrls.map((src, i) => (
            <li key={`existing-${src}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={t("previewAlt", { n: i + 1 })} />
              {onExistingChange && (
                <button
                  type="button"
                  className="btn ghost tiny"
                  onClick={() => removeExisting(i)}
                  disabled={busy}
                  aria-label={t("removePhoto", { n: i + 1 })}
                >
                  {t("remove")}
                </button>
              )}
            </li>
          ))}
          {previews.map((src, i) => (
            <li key={`new-${src}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={t("previewAlt", { n: existingUrls.length + i + 1 })} />
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() => removeNew(i)}
                disabled={busy}
                aria-label={t("removePhoto", { n: existingUrls.length + i + 1 })}
              >
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id={`${inputId}-err`} className="form-error small" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export async function uploadImages(
  files: File[],
  opts?: { onProgress?: (pct: number) => void }
): Promise<string[]> {
  if (files.length === 0) return [];

  return new Promise((resolve, reject) => {
    const fd = new FormData();
    for (const file of files) fd.append("files", file);

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
        reject(
          new Error(
            xhr.status === 413
              ? "Image too large for the server"
              : "Upload failed",
          ),
        );
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            data.error ||
              (xhr.status === 401
                ? "Unauthorized — please sign in again"
                : xhr.status === 413
                  ? "Image too large for the server"
                  : "Upload failed"),
          ),
        );
        return;
      }
      if (!Array.isArray(data.urls) || data.urls.length === 0) {
        reject(new Error("Upload failed — no image URL returned"));
        return;
      }
      resolve(data.urls);
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed — network error")),
    );
    xhr.open("POST", "/api/upload");
    xhr.withCredentials = true;
    xhr.send(fd);
  });
}
