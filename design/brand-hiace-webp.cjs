// Brands the Hiace van photo (design/hiace-webp-original.webp -> public/fleet/hiace.webp):
//  1. turns the fake "transparent" checkerboard baked into the photo into plain white;
//  2. puts the Obere logo on the sliding door (the middle of the van).
// The photo already has silver alloy rims, so they are left as they are.
// Usage (from Frontend/): node design/brand-hiace-webp.cjs
const sharp = require("sharp");

const SRC = "design/hiace-webp-original.webp";
const OUT = "public/fleet/hiace.webp";
const SQUARE = 15; // checkerboard square size (px), aligned to the top-left corner
const LIGHT = 255; // white squares
const DARK = 231; // grey squares

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const at = (x, y) => (y * W + x) * 3;
  const expected = (x, y) => ((Math.floor(x / SQUARE) + Math.floor(y / SQUARE)) % 2 ? DARK : LIGHT);
  // A background pixel is neutral grey/white and matches the checker colour expected at its spot.
  const isBackground = (x, y) => {
    const i = at(x, y);
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    return Math.abs(r - g) < 7 && Math.abs(g - b) < 7 && Math.abs(r - expected(x, y)) <= 6;
  };

  // Flood fill from the edges, so only background connected to the border is whitened
  // (white parts of the van already are white; grey shading inside it is left alone).
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
  let whitened = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue;
    seen[y * W + x] = 1;
    if (!isBackground(x, y)) continue;
    const i = at(x, y);
    data[i] = data[i + 1] = data[i + 2] = 255;
    whitened++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // The logo: trimmed, sized for the door, narrowed slightly for the angle of the van's side.
  const logoH = 54;
  const logo = await sharp("design/logo-original.png").trim().resize({ height: logoH }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  const logoW = Math.round(lm.width * 0.86);
  const logoPng = await sharp(logo).resize({ width: logoW, height: logoH, fit: "fill" }).png().toBuffer();

  await sharp(data, { raw: { width: W, height: H, channels: 3 } })
    .composite([{ input: logoPng, left: Math.round(262 - logoW / 2), top: 84, blend: "multiply" }])
    .webp({ quality: 92 })
    .toFile(OUT);
  console.log(`background pixels whitened: ${whitened}; logo ${logoW}x${logoH} -> ${OUT}`);
})();
