/**
 * Client-side resize/compress so listing uploads stay under Vercel's ~4.5 MB
 * serverless request body limit (phone JPEGs are often 3–12 MB each).
 */

const MAX_DIMENSION = 1920;
const TARGET_BYTES = 1.8 * 1024 * 1024;
const MIN_QUALITY = 0.55;

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

  // Skip work for already-small files.
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
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // White fill so transparent PNGs don't become black JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outType =
      file.type === "image/webp" ? "image/webp" : "image/jpeg";
    let quality = 0.82;
    let blob = await canvasToBlob(canvas, outType, quality);

    while (blob.size > maxBytes && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.1);
      blob = await canvasToBlob(canvas, outType, quality);
    }

    if (blob.size >= file.size && scale === 1) {
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
