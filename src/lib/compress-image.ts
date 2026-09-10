/**
 * Client-side resize/compress so listing uploads stay under Vercel's ~4.5 MB
 * serverless request body limit (phone JPEGs are often 3–12 MB each).
 */

const MAX_DIMENSION = 1920;
/** Stay well under Vercel’s ~4.5 MB request body once multipart framing is added. */
export const UPLOAD_TARGET_BYTES = 1.8 * 1024 * 1024;
const TARGET_BYTES = UPLOAD_TARGET_BYTES;
const MIN_QUALITY = 0.52;
const MIN_DIMENSION = 1024;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image encode failed"))),
      type,
      quality,
    );
  });
}

function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unsupported");
  }
  // White fill so transparent PNGs don't become black JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

/**
 * Returns a JPEG/WebP File small enough for a single `/api/upload` request.
 * Falls back to the original file when compression is unnecessary or unsupported.
 */
export async function compressImageForUpload(
  file: File,
  maxBytes = TARGET_BYTES,
): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  // Skip work for already-small files (under ~900 KB).
  if (file.size > 0 && file.size <= Math.min(maxBytes, 900 * 1024)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const initialScale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    const outType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    let blob: Blob | null = null;
    let canvas = drawToCanvas(bitmap, width, height);
    bitmap.close();

    for (let pass = 0; pass < 4; pass++) {
      let quality = 0.82;
      blob = await canvasToBlob(canvas, outType, quality);
      while (blob.size > maxBytes && quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.1);
        blob = await canvasToBlob(canvas, outType, quality);
      }
      if (blob.size <= maxBytes) break;

      const nextW = Math.max(MIN_DIMENSION, Math.round(width * 0.75));
      const nextH = Math.max(MIN_DIMENSION, Math.round(height * 0.75));
      if (nextW >= width && nextH >= height) break;
      width = nextW;
      height = nextH;
      canvas = drawToCanvas(canvas, width, height);
    }

    if (!blob) return file;

    // Prefer original only when we did not shrink and encode did not help.
    if (blob.size >= file.size && initialScale === 1 && blob.size <= maxBytes) {
      return file;
    }

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    const ext = outType === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } catch {
    try {
      bitmap.close();
    } catch {
      /* ignore */
    }
    return file;
  }
}
