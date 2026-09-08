"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { compressImageForUpload } from "@/lib/compress-image";
import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PICK_BYTES,
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
  /** Shown while client compresses newly picked photos. */
  preparing?: boolean;
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
  preparing = false,
  disabled = false,
}: ImageUploadFieldProps) {
  const t = useTranslations("images");
  const inputId = useId();
  const cameraInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreparing, setLocalPreparing] = useState(false);

  const totalCount = existingUrls.length + files.length;
  const atLimit = totalCount >= maxImages;
  const isPreparing = preparing || localPreparing;
  const busy = uploading || disabled || isPreparing;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);
      const valid: File[] = [];
      for (const file of incoming) {
        if (!isAllowedClientFile(file)) {
          setError(t("invalidType"));
          continue;
        }
        if (file.size <= 0 || file.size > MAX_IMAGE_PICK_BYTES) {
          setError(t("tooLarge", { maxMb: MAX_IMAGE_PICK_BYTES / (1024 * 1024) }));
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
      if (valid.length > slotsLeft) {
        setError(t("maxReached", { max: maxImages }));
      }

      setLocalPreparing(true);
      try {
        const compressed = await Promise.all(
          accepted.map((file) => compressImageForUpload(file, MAX_IMAGE_BYTES)),
        );
        onChange([...files, ...compressed]);
      } catch {
        // Fall back to originals if encode fails mid-batch.
        onChange([...files, ...accepted]);
      } finally {
        setLocalPreparing(false);
      }
    },
    [existingUrls.length, files, maxImages, onChange, t],
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    void addFiles(Array.from(e.target.files || []));
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
    void addFiles(Array.from(e.dataTransfer.files || []));
  }

  function openPicker() {
    if (!busy && !atLimit) inputRef.current?.click();
  }

  return (
    <fieldset className="image-upload" aria-describedby={`${inputId}-hint ${error ? `${inputId}-err` : ""}`}>
      <legend>{t("label")}</legend>
      <p id={`${inputId}-hint`} className="muted small">
        {t("hint", { max: maxImages, maxMb: Math.round(MAX_IMAGE_PICK_BYTES / (1024 * 1024)) })}
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

      {(uploading || isPreparing) && (
        <div className="image-upload-progress" role="status" aria-live="polite">
          <div
            className="image-upload-progress-bar"
            style={{ width: `${uploading ? (uploadProgress ?? 8) : 35}%` }}
          />
          <span className="muted small">
            {isPreparing && !uploading
              ? t("preparing")
              : uploadProgress != null
                ? t("uploadingProgress", { pct: uploadProgress })
                : t("uploading")}
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

function uploadOneImage(
  file: File,
  opts?: { onProgress?: (pct: number) => void },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("files", file);

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
            xhr.status === 413 ? "IMAGE_TOO_LARGE" : "UPLOAD_FAILED",
          ),
        );
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            xhr.status === 401
              ? "Unauthorized"
              : xhr.status === 413
                ? "IMAGE_TOO_LARGE"
                : data.error || "UPLOAD_FAILED",
          ),
        );
        return;
      }
      if (!Array.isArray(data.urls) || data.urls.length === 0) {
        reject(new Error("UPLOAD_FAILED"));
        return;
      }
      resolve(data.urls[0]);
    });
    xhr.addEventListener("error", () => reject(new Error("NETWORK_ERROR")));
    xhr.open("POST", "/api/upload");
    xhr.withCredentials = true;
    xhr.send(fd);
  });
}

export type UploadImagesResult = {
  urls: string[];
  failedFiles: File[];
  errors: string[];
};

/**
 * Compress then upload one file per request so payloads stay under Vercel's
 * ~4.5 MB serverless body limit. Continues after individual failures so the
 * caller can keep successes and retry only the failed files.
 */
export async function uploadImagesDetailed(
  files: File[],
  opts?: { onProgress?: (pct: number) => void },
): Promise<UploadImagesResult> {
  if (files.length === 0) {
    return { urls: [], failedFiles: [], errors: [] };
  }

  const urls: string[] = [];
  const failedFiles: File[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const compressed = await compressImageForUpload(file, MAX_IMAGE_BYTES);
      if (compressed.size > MAX_IMAGE_BYTES) {
        failedFiles.push(file);
        errors.push("IMAGE_TOO_LARGE");
        opts?.onProgress?.(Math.round(((i + 1) / files.length) * 100));
        continue;
      }
      const base = Math.round((i / files.length) * 100);
      const span = Math.round(100 / files.length);
      const url = await uploadOneImage(compressed, {
        onProgress: (pct) =>
          opts?.onProgress?.(Math.min(99, base + Math.round((pct * span) / 100))),
      });
      urls.push(url);
    } catch (err) {
      failedFiles.push(file);
      errors.push(err instanceof Error ? err.message : "UPLOAD_FAILED");
    }
    opts?.onProgress?.(Math.round(((i + 1) / files.length) * 100));
  }

  return { urls, failedFiles, errors };
}

/**
 * Compress then upload one file per request. Throws if any file fails
 * (legacy callers). Prefer `uploadImagesDetailed` for soft-fail + retry.
 */
export async function uploadImages(
  files: File[],
  opts?: { onProgress?: (pct: number) => void },
): Promise<string[]> {
  const result = await uploadImagesDetailed(files, opts);
  if (result.failedFiles.length > 0) {
    throw new Error(result.errors[0] || "UPLOAD_FAILED");
  }
  return result.urls;
}
