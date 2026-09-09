/**
 * Generates favicon + PWA PNG icons from public/logo-xndzor.png (sharp).
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");
const logoPath = join(root, "public", "logo-xndzor.png");
const faviconSvgPath = join(root, "public", "favicon.svg");
const appFaviconIcoPath = join(root, "src", "app", "favicon.ico");
const BG = { r: 0x0a, g: 0x33, b: 0x29, alpha: 1 };

mkdirSync(outDir, { recursive: true });
mkdirSync(join(root, "tmp"), { recursive: true });

const pngSizes = [
  { name: "icon-192.png", size: 192, pad: 0.14 },
  { name: "icon-512.png", size: 512, pad: 0.14 },
  { name: "apple-touch-icon.png", size: 180, pad: 0.12 },
];

async function renderMark(sharp, size, padRatio) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const mark = await sharp(logoPath)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Pack PNG buffers into a multi-size .ico (PNG-compressed ICO entries). */
function pngBuffersToIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const parts = [header, dir];

  for (let i = 0; i < count; i++) {
    const { dim, png } = entries[i];
    const o = 16 * i;
    dir.writeUInt8(dim >= 256 ? 0 : dim, o);
    dir.writeUInt8(dim >= 256 ? 0 : dim, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    parts.push(png);
    offset += png.length;
  }

  return Buffer.concat(parts);
}

async function withSharp() {
  const sharp = (await import("sharp")).default;
  if (!existsSync(logoPath)) {
    throw new Error(`Missing logo: ${logoPath}`);
  }

  for (const { name, size, pad } of pngSizes) {
    const buf = await renderMark(sharp, size, pad);
    writeFileSync(join(outDir, name), buf);
    console.log("wrote", name);
  }

  // favicon.ico — 16 / 32 / 48 (Chrome shortcuts often prefer .ico)
  const icoEntries = [];
  for (const dim of [16, 32, 48]) {
    const png = await renderMark(sharp, dim, dim <= 16 ? 0.08 : 0.12);
    icoEntries.push({ dim, png });
  }
  const ico = pngBuffersToIco(icoEntries);
  writeFileSync(appFaviconIcoPath, ico);
  writeFileSync(join(root, "public", "favicon.ico"), ico);
  console.log("wrote favicon.ico (app + public)");

  // Next.js app/ file-based metadata icons
  const iconApp = await renderMark(sharp, 192, 0.14);
  const appleApp = await renderMark(sharp, 180, 0.12);
  writeFileSync(join(root, "src", "app", "icon.png"), iconApp);
  writeFileSync(join(root, "src", "app", "apple-icon.png"), appleApp);
  console.log("wrote src/app/icon.png + apple-icon.png");

  // Square PNG also useful for some browsers / Next icon convention
  const favicon32 = await renderMark(sharp, 32, 0.12);
  writeFileSync(join(root, "public", "favicon-32.png"), favicon32);

  // SVG favicon: embed the rendered mark so it matches the PNG logo exactly
  const svgMark = await renderMark(sharp, 64, 0.12);
  const b64 = svgMark.toString("base64");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Խնձոր / Xndzor">
  <image href="data:image/png;base64,${b64}" width="64" height="64" />
</svg>
`;
  writeFileSync(faviconSvgPath, svg);
  writeFileSync(join(outDir, "icon.svg"), svg);
  console.log("wrote favicon.svg + icons/icon.svg");
}

/** Minimal solid pine-green PNG (CRC-correct) if sharp is unavailable. */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function solidPng(size, r, g, b) {
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x++) {
    const i = 1 + x * 3;
    row[i] = r;
    row[i + 1] = g;
    row[i + 2] = b;
  }
  const rows = [];
  for (let y = 0; y < size; y++) rows.push(Buffer.from(row));
  const raw = Buffer.concat(rows);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  try {
    await withSharp();
  } catch (err) {
    console.warn("sharp path failed — writing geometric fallback PNGs", err?.message || err);
    for (const { name, size } of pngSizes) {
      writeFileSync(join(outDir, name), solidPng(size, 0x0a, 0x33, 0x29));
      console.log("wrote fallback", name);
    }
  }
}

main();
