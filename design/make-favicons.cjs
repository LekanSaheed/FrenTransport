// Builds the site's favicons from design/logo-original.png (the pin-and-road mark above the wordmark).
// Usage (from Frontend/): node design/make-favicons.cjs
const sharp = require("sharp");
const fs = require("node:fs");

(async () => {
  const top = await sharp("design/logo-original.png").extract({ left: 0, top: 0, width: 1096, height: 900 }).png().toBuffer();
  const mark = await sharp(top).trim({ threshold: 10 }).png().toBuffer();

  /** The mark centred on a white tile; `rounded` cuts the corners for browser tabs. */
  async function tile(size, { rounded = true, pad = 0.12 } = {}) {
    const inner = Math.round(size * (1 - pad * 2));
    const fitted = await sharp(mark).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const r = rounded ? Math.round(size * 0.22) : 0;
    const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/></svg>`);
    return sharp(bg).composite([{ input: fitted, gravity: "centre" }]).png().toBuffer();
  }

  // favicon.ico: 16, 32 and 48 px PNGs in one ICO (supported by every current browser).
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => tile(s, { pad: s <= 16 ? 0.06 : 0.1 })));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0); // width
    e.writeUInt8(s, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return e;
  });
  fs.writeFileSync("app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));

  // Next.js file conventions: <link rel="icon"> and <link rel="apple-touch-icon"> are added automatically.
  fs.writeFileSync("app/icon.png", await tile(512));
  // iOS rounds the corners itself, so the Apple icon is a full white square.
  fs.writeFileSync("app/apple-icon.png", await tile(180, { rounded: false, pad: 0.14 }));
  // Home-screen icons for the web app manifest.
  fs.writeFileSync("public/icon-192.png", await tile(192));
  fs.writeFileSync("public/icon-512.png", await tile(512));
  console.log("favicons written");
})();
