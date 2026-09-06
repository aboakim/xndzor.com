/**
 * Generates PWA PNG icons from public/favicon.svg (sharp) or a solid fallback.
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");
const svgPath = join(root, "public", "favicon.svg");

mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function withSharp() {
  const sharp = (await import("sharp")).default;
  const svg = readFileSync(svgPath);
  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(outDir, name));
    console.log("wrote", name);
  }
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
  // soft center "apple" disc in brand leaf green
  const cx = size / 2;
  const cy = size * 0.55;
  const rad = size * 0.28;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const line = Buffer.from(row);
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rad * rad) {
        const i = 1 + x * 3;
        line[i] = 0x6f;
        line[i + 1] = 0x9b;
        line[i + 2] = 0x7a;
      }
    }
    rows.push(line);
  }
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
  } catch {
    console.warn("sharp unavailable — writing geometric fallback PNGs");
    for (const { name, size } of sizes) {
      writeFileSync(join(outDir, name), solidPng(size, 0x0a, 0x33, 0x29));
      console.log("wrote fallback", name);
    }
  }

  // Copy SVG mark for browsers that accept it
  if (existsSync(svgPath)) {
    writeFileSync(join(outDir, "icon.svg"), readFileSync(svgPath));
  }
}

main();
