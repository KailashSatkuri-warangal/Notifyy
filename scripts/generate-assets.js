const fs = require('fs');
const zlib = require('zlib');

function makePNG(width, height, iMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  defaultCh = 0;
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  let crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    }
    return (c ^ (-1)) >>> 0;
  }

  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (iMaskable ? 0.48 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const squircle = Math.pow(Math.abs(dx / radius), 4) + Math.pow(Math.abs(dy / radius), 4);

      if (iMaskable || squircle <= 1.0) {
        const t = (x + y) / (width + height);
        let r = Math.round(99 + (55 - 99) * t);
        let g = Math.round(102 + (48 - 102) * t);
        let b = Math.round(241 + (163 - 241) * t);
        let a = 255;

        const nx = dx / (width * 0.35);
        const ny = dy / (height * 0.35);
        const dot = Math.hypot(dx - width * 0.22, dy + height * 0.22);

        if (dot <= width * 0.08) {
          if (dot <= width * 0.065) { r = 244; g = 63; b = 94; }
          else { r = 255; g = 255; b = 255; }
        } else if (
          (nx >= -0.7 && nx <= -0.3 && ny >= -0.6 && ny <= 0.6) ||
          (nx >= 0.3 && nx <= 0.7 && ny >= -0.6 && ny <= 0.6) ||
          (ny >= nx * 1.5 - 0.25 && ny <= nx * 1.5 + 0.25 && nx >= -0.5 && nx <= 0.5)
        ) { r = 255; g = 255; b = 255; }

        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

fs.writeFileSync('public/icons/icon-192.png', makePNG(192, 192, false));
fs.writeFileSync('public/icons/icon-512.png', makePNG(512, 512, false));
fs.writeFileSync('public/icons/maskable-192.png', makePNG(192, 192, true));
fs.writeFileSync('public/icons/maskable-512.png', makePNG(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', makePNG(180, 180, false));
fs.writeFileSync('public/icons/apple-touch-icon.png', makePNG(180, 180, false));
fs.writeFileSync('public/favicon.ico', makePNG(64, 64, false));
console.log('Polished icons generated!');
