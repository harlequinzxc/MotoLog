import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "..");
const BLACK = [9, 9, 11, 255];
const CRIMSON = [239, 68, 68, 255];
const WHITE = [250, 250, 250, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}

function setPixel(pixels, size, x, y, color) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= size || iy >= size) return;
  const offset = (iy * size + ix) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function circle(pixels, size, cx, cy, radius, color) {
  const min = Math.floor(-radius);
  const max = Math.ceil(radius);
  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      if (x * x + y * y <= radius * radius) {
        setPixel(pixels, size, cx + x, cy + y, color);
      }
    }
  }
}

function line(pixels, size, x1, y1, x2, y2, width, color) {
  const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let step = 0; step <= length; step += 0.4) {
    const ratio = step / length;
    circle(pixels, size, x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio, width / 2, color);
  }
}

function renderPng(size, maskable = false) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(pixels, size, x, y, BLACK);
  }

  const scale = size * (maskable ? 0.62 : 0.76);
  const left = (size - scale) / 2;
  const top = (size - scale) / 2;
  const point = (x, y) => [left + x * scale, top + y * scale];
  const stroke = scale * 0.075;

  const arcStart = point(0.2, 0.31);
  const arcEnd = point(0.8, 0.31);
  for (let degree = 205; degree <= 335; degree += 1) {
    const radian = (degree * Math.PI) / 180;
    const x = left + scale * 0.5 + Math.cos(radian) * scale * 0.32;
    const y = top + scale * 0.52 + Math.sin(radian) * scale * 0.32;
    circle(pixels, size, x, y, stroke * 0.34, CRIMSON);
  }

  const [a1x, a1y] = point(0.18, 0.73);
  const [a2x, a2y] = point(0.18, 0.4);
  const [mx, my] = point(0.5, 0.63);
  const [b2x, b2y] = point(0.82, 0.4);
  const [b1x, b1y] = point(0.82, 0.73);
  line(pixels, size, a1x, a1y, a2x, a2y, stroke, CRIMSON);
  line(pixels, size, a2x, a2y, mx, my, stroke, CRIMSON);
  line(pixels, size, mx, my, b2x, b2y, stroke, CRIMSON);
  line(pixels, size, b2x, b2y, b1x, b1y, stroke, CRIMSON);

  const [needleX, needleY] = point(0.63, 0.35);
  const [hubX, hubY] = point(0.5, 0.52);
  line(pixels, size, hubX, hubY, needleX, needleY, stroke * 0.27, WHITE);
  circle(pixels, size, hubX, hubY, stroke * 0.32, WHITE);
  circle(pixels, size, hubX, hubY, stroke * 0.14, BLACK);

  const scanlines = [];
  for (let y = 0; y < size; y += 1) {
    scanlines.push(Buffer.from([0]));
    scanlines.push(Buffer.from(pixels.slice(y * size * 4, (y + 1) * size * 4)));
  }
  const raw = Buffer.concat(scanlines);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from("\x89PNG\r\n\x1a\n", "binary"),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
  return png;
}

function svgMark() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="MotoLog emblem">
  <rect width="512" height="512" fill="#09090b"/>
  <path d="M146 268a126 126 0 0 1 220 0" fill="none" stroke="#ef4444" stroke-width="32" stroke-linecap="round"/>
  <path d="M156 372V218l100 92 100-92v154" fill="none" stroke="#ef4444" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M256 264l55-78" fill="none" stroke="#fafafa" stroke-width="18" stroke-linecap="round"/>
  <circle cx="256" cy="264" r="20" fill="#fafafa"/>
  <circle cx="256" cy="264" r="8" fill="#09090b"/>
</svg>`;
}

async function write(path, contents) {
  const absolutePath = resolve(ROOT, path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents);
}

await write("public/favicon.svg", svgMark());
await write("public/favicon-32x32.png", renderPng(32));
await write("public/apple-touch-icon.png", renderPng(180));
await write("public/icons/icon-192.png", renderPng(192));
await write("public/icons/icon-512.png", renderPng(512));
await write("public/icons/icon-maskable-512.png", renderPng(512, true));
console.log("Generated MotoLog icon suite.");
