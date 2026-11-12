import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const BLACK = [9, 9, 11, 255];
const RED = [239, 68, 68, 255];
const WHITE = [250, 250, 250, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function setPixel(pixels, size, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= size || py >= size) return;
  const offset = (py * size + px) * 4;
  pixels.set(color, offset);
}

function drawCircle(pixels, size, cx, cy, radius, color) {
  for (let y = -Math.ceil(radius); y <= Math.ceil(radius); y += 1) {
    for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x += 1) {
      if (x * x + y * y <= radius * radius) setPixel(pixels, size, cx + x, cy + y, color);
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, width, color) {
  const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  for (let step = 0; step <= length; step += 0.4) {
    const ratio = step / length;
    drawCircle(pixels, size, x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio, width / 2, color);
  }
}

function makePng(size, maskable = false) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) setPixel(pixels, size, x, y, BLACK);
  const scale = size * (maskable ? 0.62 : 0.76);
  const left = (size - scale) / 2;
  const top = (size - scale) / 2;
  const p = (x, y) => [left + x * scale, top + y * scale];
  const width = scale * 0.075;

  for (let degree = 205; degree <= 335; degree += 1) {
    const radians = (degree * Math.PI) / 180;
    drawCircle(pixels, size, left + scale * 0.5 + Math.cos(radians) * scale * 0.32, top + scale * 0.52 + Math.sin(radians) * scale * 0.32, width * 0.34, RED);
  }
  const [l1x, l1y] = p(0.18, 0.73);
  const [l2x, l2y] = p(0.18, 0.4);
  const [mx, my] = p(0.5, 0.63);
  const [r2x, r2y] = p(0.82, 0.4);
  const [r1x, r1y] = p(0.82, 0.73);
  drawLine(pixels, size, l1x, l1y, l2x, l2y, width, RED);
  drawLine(pixels, size, l2x, l2y, mx, my, width, RED);
  drawLine(pixels, size, mx, my, r2x, r2y, width, RED);
  drawLine(pixels, size, r2x, r2y, r1x, r1y, width, RED);
  const [hubX, hubY] = p(0.5, 0.52);
  const [needleX, needleY] = p(0.63, 0.35);
  drawLine(pixels, size, hubX, hubY, needleX, needleY, width * 0.27, WHITE);
  drawCircle(pixels, size, hubX, hubY, width * 0.32, WHITE);
  drawCircle(pixels, size, hubX, hubY, width * 0.14, BLACK);

  const scanlines = [];
  for (let y = 0; y < size; y += 1) {
    scanlines.push(Buffer.from([0]), Buffer.from(pixels.slice(y * size * 4, (y + 1) * size * 4)));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from("\x89PNG\r\n\x1a\n", "binary"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(scanlines))),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#09090b"/><path d="M146 268a126 126 0 0 1 220 0" fill="none" stroke="#ef4444" stroke-width="32" stroke-linecap="round"/><path d="M156 372V218l100 92 100-92v154" fill="none" stroke="#ef4444" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/><path d="M256 264l55-78" fill="none" stroke="#fafafa" stroke-width="18" stroke-linecap="round"/><circle cx="256" cy="264" r="20" fill="#fafafa"/><circle cx="256" cy="264" r="8" fill="#09090b"/></svg>`;

async function output(path, contents) {
  const destination = resolve(root, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

await output("public/favicon.svg", svg);
await output("public/apple-touch-icon.png", makePng(180));
await output("public/icons/icon-192.png", makePng(192));
await output("public/icons/icon-512.png", makePng(512));
await output("public/icons/icon-maskable-512.png", makePng(512, true));
console.log("Generated text-free MotoLog PWA icons.");
