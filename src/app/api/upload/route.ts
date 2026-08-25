import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import { MAX_IMAGE_BYTES } from "@/lib/validations";
import { detectImageKind, KIND_TO_EXT } from "@/lib/image-magic";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const limited = rateLimit(`upload:${session.user.id}:${ip}`, {
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }
  if (files.length > 8) {
    return NextResponse.json({ error: "Max 8 images" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  // Resolve and ensure we never write outside uploads/
  const resolvedUpload = path.resolve(uploadDir);
  await mkdir(resolvedUpload, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Each image must be under 5 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = detectImageKind(buffer);
    if (!kind) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed" },
        { status: 400 }
      );
    }

    // Ignore client-claimed MIME; use magic bytes only
    const ext = KIND_TO_EXT[kind];
    const name = `${randomBytes(16).toString("hex")}.${ext}`;
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const dest = path.resolve(resolvedUpload, name);
    if (!dest.startsWith(resolvedUpload + path.sep)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await writeFile(dest, buffer);
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
