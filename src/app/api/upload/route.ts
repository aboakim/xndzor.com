import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import {
  MAX_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
  MAX_UPLOAD_TOTAL_BYTES,
} from "@/lib/validations";
import { detectImageKind, KIND_TO_EXT } from "@/lib/image-magic";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function blobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

async function persistImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  subdir: string,
): Promise<string> {
  const token = blobToken();

  if (token) {
    const { put } = await import("@vercel/blob");
    // Pass body as Uint8Array for consistent Node/serverless behavior.
    const body = new Uint8Array(buffer);
    const blob = await put(`uploads/${subdir}/${filename}`, body, {
      access: "public",
      contentType,
      token,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Local/dev fallback: write under public/uploads (not writable on Vercel).
  if (isVercelRuntime()) {
    throw new Error(
      "Image storage is not configured (set BLOB_READ_WRITE_TOKEN and redeploy).",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  const resolvedUpload = path.resolve(uploadDir);
  await mkdir(resolvedUpload, { recursive: true });
  const dest = path.resolve(resolvedUpload, filename);
  if (!dest.startsWith(resolvedUpload + path.sep)) {
    throw new Error("invalid_path");
  }
  await writeFile(dest, buffer);
  return `/uploads/${subdir}/${filename}`;
}

function persistErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) {
    const msg = e.message.trim();
    // Surface actionable Blob / config errors; keep others generic.
    if (
      /BLOB_READ_WRITE_TOKEN|not configured|Access denied|access|token|store|content.?type|too large|quota|rate.?limit|Unauthorized|Forbidden/i.test(
        msg,
      )
    ) {
      return msg.length > 240 ? `${msg.slice(0, 237)}...` : msg;
    }
  }
  if (isVercelRuntime() && !blobToken()) {
    return "Image storage is not configured (set BLOB_READ_WRITE_TOKEN and redeploy).";
  }
  return "Upload failed. Try again.";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fail fast on Vercel before reading the body when Blob is missing.
  if (isVercelRuntime() && !blobToken()) {
    return NextResponse.json(
      {
        error:
          "Image storage is not configured (set BLOB_READ_WRITE_TOKEN and redeploy).",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  const limited = rateLimit(`upload:${session.user.id}:${ip}`, {
    limit: 45,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid form data (file may be too large; max 5 MB per image).",
      },
      { status: 400 },
    );
  }

  const kind = form.get("kind");
  const isAvatar = kind === "avatar";
  const maxFiles = isAvatar ? 1 : MAX_LISTING_IMAGES;

  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }
  if (files.length > maxFiles) {
    return NextResponse.json(
      { error: `Max ${maxFiles} images` },
      { status: 400 },
    );
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) {
    return NextResponse.json(
      { error: "Total upload size exceeds limit" },
      { status: 400 },
    );
  }

  const subdir = isAvatar ? "avatars" : "listings";
  const urls: string[] = [];

  try {
    for (const file of files) {
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          {
            error: `Each image must be under ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
          },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const detected = detectImageKind(buffer);
      if (!detected) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, or WebP images are allowed" },
          { status: 400 },
        );
      }

      const ext = KIND_TO_EXT[detected];
      const name = `${randomBytes(16).toString("hex")}.${ext}`;
      if (name.includes("..") || name.includes("/") || name.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
      }

      const contentType =
        detected === "jpeg"
          ? "image/jpeg"
          : detected === "png"
            ? "image/png"
            : "image/webp";
      const url = await persistImage(buffer, name, contentType, subdir);
      urls.push(url);
    }
  } catch (e) {
    console.error(
      "[Xndzor] upload persist failed",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json({ error: persistErrorMessage(e) }, { status: 503 });
  }

  return NextResponse.json({ urls });
}
