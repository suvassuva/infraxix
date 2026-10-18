const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', idatData);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Distance to rounded rectangle
function distToRoundedRect(x, y, rx, ry, rw, rh, rad) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const hw = rw / 2 - rad;
  const hh = rh / 2 - rad;
  const dx = Math.max(0, Math.abs(x - cx) - hw);
  const dy = Math.max(0, Math.abs(y - cy) - hh);
  return Math.sqrt(dx * dx + dy * dy) - rad;
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Render icon at resolution
function renderIcon(size, isMaskable) {
  const bgRadius = isMaskable ? 0 : size * 0.22;
  const pad = isMaskable ? 0 : size * 0.04;
  const bgSize = size - pad * 2;

  // Icon geometry scaled to size
  const scale = (size * (isMaskable ? 0.52 : 0.62)) / 24;
  const tx = size / 2 - 12 * scale;
  const ty = size / 2 - 12 * scale;
  const strokeW = 1.9 * scale;

  // Segments for Building2
  const segments = [
    // Main building outline: M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18
    [6, 22, 6, 5],
    [8, 2, 16, 2],
    [18, 5, 18, 22],
    [6, 22, 18, 22],
    // Left wing: M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2
    [2, 14, 2, 20],
    [4, 12, 6, 12],
    [4, 22, 6, 22],
    // Right wing: M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2
    [18, 10, 20, 10],
    [22, 12, 22, 20],
    [18, 22, 20, 22],
    // Windows
    [10, 6, 14, 6],
    [10, 10, 14, 10],
    [10, 14, 14, 14],
    // Arched door
    [10, 22, 10, 19],
    [14, 22, 14, 19],
    [10, 19, 14, 19],
  ];

  return createPng(size, size, (x, y) => {
    // Check background rounded rect
    let inBg = false;
    let bgAlpha = 1.0;
    if (isMaskable) {
      inBg = true;
    } else {
      const d = distToRoundedRect(x, y, pad, pad, bgSize, bgSize, bgRadius);
      if (d <= 0) {
        inBg = true;
      } else if (d < 1.0) {
        inBg = true;
        bgAlpha = 1.0 - d;
      }
    }

    if (!inBg) return [0, 0, 0, 0];

    // Check stroke distance
    let minDist = 999999;
    for (const [x1, y1, x2, y2] of segments) {
      const sx1 = tx + x1 * scale;
      const sy1 = ty + y1 * scale;
      const sx2 = tx + x2 * scale;
      const sy2 = ty + y2 * scale;
      const d = distToSegment(x, y, sx1, sy1, sx2, sy2);
      if (d < minDist) minDist = d;
    }

    const halfW = strokeW / 2;
    if (minDist <= halfW - 0.5) {
      // Solid white stroke
      return [255, 255, 255, Math.round(255 * bgAlpha)];
    } else if (minDist <= halfW + 0.8) {
      // Anti-aliased stroke edge
      const t = (minDist - (halfW - 0.5)) / 1.3;
      const r = Math.round(255 * (1 - t) + 37 * t);
      const g = Math.round(255 * (1 - t) + 99 * t);
      const b = Math.round(255 * (1 - t) + 235 * t);
      return [r, g, b, Math.round(255 * bgAlpha)];
    }

    // Background blue #2563eb
    return [37, 99, 235, Math.round(255 * bgAlpha)];
  });
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

console.log('Generating 192x192 icon...');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), renderIcon(192, false));

console.log('Generating 512x512 icon...');
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), renderIcon(512, false));

console.log('Generating 512x512 maskable icon...');
fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512.png'), renderIcon(512, true));

console.log('Done generating all PWA icons!');
