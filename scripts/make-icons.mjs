// Writes the placeholder PWA icons (public/icon-192.png, public/icon-512.png) without extra dependencies:
// dark rounded tile, two mountains, a yellow sun. Replaced by real art in milestone 5.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x1d, 0x2b, 0x3a];
const MOUNTAIN_A = [0x6c, 0x7d, 0x93];
const MOUNTAIN_B = [0x7d, 0x8e, 0xa3];
const SNOW = [0xf4, 0xf7, 0xfb];
const SUN = [0xff, 0xd8, 0x4d];

function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const d = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const s = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / d;
  const t = ((x - ax) * (cy - ay) - (y - ay) * (cx - ax)) / d;
  return s >= 0 && t >= 0 && s + t <= 1;
}

function pixel(u, v) {
  const r = 0.19;
  const cx = Math.min(Math.max(u, r), 1 - r);
  const cy = Math.min(Math.max(v, r), 1 - r);
  if ((u - cx) ** 2 + (v - cy) ** 2 > r * r) return [0, 0, 0, 0];
  if ((u - 0.5) ** 2 + (v - 0.36) ** 2 < 0.13 ** 2) return [...SUN, 255];
  if (inTriangle(u, v, [0.59, 0.39], [0.645, 0.27], [0.7, 0.39])) return [...SNOW, 255];
  if (inTriangle(u, v, [0.39, 0.78], [0.645, 0.27], [0.9, 0.78])) return [...MOUNTAIN_B, 255];
  if (inTriangle(u, v, [0.12, 0.78], [0.43, 0.33], [0.74, 0.78])) return [...MOUNTAIN_A, 255];
  return [...BG, 255];
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const px = pixel((x + 0.5) / size, (y + 0.5) / size);
      px.forEach((val, i) => (raw[y * (size * 4 + 1) + 1 + x * 4 + i] = val));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png(size));
console.log('icons written');
