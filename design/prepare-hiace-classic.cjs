// Prepares the Hiace studio photo for the white "Book a seat" card
// (design/hiace-classic-original.jpg -> public/fleet/hiace-classic.webp):
//  1. finds the blue-grey studio backdrop and evens it out to white, keeping the floor
//     shadow as soft neutral grey ("flat-field" correction against the backdrop's own colour);
//  2. crops to the van and saves a 1000 px WebP.
// Usage (from Frontend/): node design/prepare-hiace-classic.cjs
const sharp = require("sharp");

const SRC = "design/hiace-classic-original.jpg";
const OUT = "public/fleet/hiace-classic.webp";

(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const lum = (i) => 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
  const neighbours = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < W && b < H);

  /** Flood fill from the image border through pixels accepted by `ok(k, fromK)`. */
  function fill(ok, start = null) {
    const m = start ? new Uint8Array(start) : new Uint8Array(N);
    const stack = [];
    if (start) for (let k = 0; k < N; k++) m[k] && stack.push(k);
    else {
      for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
      for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
      for (const k of stack) m[k] = 1;
    }
    while (stack.length) {
      const k = stack.pop();
      for (const [nx, ny] of neighbours(k % W, Math.floor(k / W))) {
        const nk = ny * W + nx;
        if (!m[nk] && ok(nk, k)) {
          m[nk] = 1;
          stack.push(nk);
        }
      }
    }
    return m;
  }

  // 1. Certain backdrop: clearly bluish (blue - red >= 10; the van's whites are <= 8) and smooth.
  const sure = fill((k, from) => {
    const i = k * 3, j = from * 3;
    const diff = Math.max(Math.abs(data[i] - data[j]), Math.abs(data[i + 1] - data[j + 1]), Math.abs(data[i + 2] - data[j + 2]));
    return diff <= 6 && data[i + 2] - data[i] >= 10;
  });

  // 2. The backdrop's colour everywhere (also behind the van): average of nearby certain-backdrop
  //    pixels, per channel, i.e. blur(colour x mask) / blur(mask) at reduced size.
  const sw = Math.round(W / 8), sh = Math.round(H / 8);
  const smooth = (buf) =>
    sharp(buf, { raw: { width: W, height: H, channels: 1 } }).resize(sw, sh).blur(10).resize(W, H, { kernel: "cubic" }).raw().toBuffer();
  const mask = Buffer.alloc(N);
  const chans = [Buffer.alloc(N), Buffer.alloc(N), Buffer.alloc(N)];
  for (let k = 0; k < N; k++) {
    mask[k] = sure[k] ? 255 : 0;
    for (let c = 0; c < 3; c++) chans[c][k] = sure[k] ? data[k * 3 + c] : 0;
  }
  const [maskS, ...chanS] = await Promise.all([smooth(mask), ...chans.map(smooth)]);
  const backdrop = (k, c) => (maskS[k] > 3 ? Math.max(60, (chanS[c][k] * 255) / maskS[k]) : 220);

  // 3. All backdrop: reachable from the edges through pixels close to the backdrop colour there,
  //    or darker than it with the same tint (floor shadow). The van's paint is brighter/warmer.
  const isBackdropLike = (k) => {
    const i = k * 3;
    const d = [0, 1, 2].map((c) => data[i + c] - backdrop(k, c));
    const close = d.every((v) => Math.abs(v) <= 12);
    const shadow = d.every((v) => v < 0) && data[i + 2] - data[i] >= 6 && lum(i) > 70;
    return close || shadow;
  };
  const bg = fill((k) => isBackdropLike(k), sure);

  // 3b. A generous outline of the van in this photo (original pixel coordinates). Outside it is
  //     always backdrop: the studio's bright spot behind the windscreen is almost the same
  //     colour as the white paint, so colour alone can't tell them apart there.
  // Traced from the photo: windscreen pillar and front edge on the left, rear pillar on the
  // right (each 2 px outside the van), roof along the top, wheels and shadow at the bottom.
  const HULL = [
    [340, 845], [330, 820], [330, 780], [328, 740], [324, 700], [326, 680], [330, 640], [332, 620], [336, 600], [338, 580], [341, 560], [348, 540], [362, 520], [377, 500], [394, 480],
    [398, 458], [433, 440], [453, 420], [474, 400], [490, 380], [513, 360], [520, 356], [600, 335], [800, 321],
    [1000, 320], [1300, 323], [1500, 328], [1536, 345], [1540, 360], [1550, 390], [1558, 420], [1564, 450],
    [1569, 480], [1573, 510], [1576, 540], [1578, 570], [1578, 660], [1580, 720], [1580, 770], [1562, 888],
    [1300, 895], [950, 922], [740, 922], [470, 900], [380, 870],
  ];
  const svg = (pts, w) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="black"/><polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="white" stroke="white" stroke-width="${w}" stroke-linejoin="round"/></svg>`);
  const [inside, near] = await Promise.all([
    sharp(svg(HULL, 0)).greyscale().raw().toBuffer(),
    // Shadow zone: within ~150 px of the van, fading out smoothly (no visible ring).
    sharp(svg(HULL, 260)).greyscale().blur(45).raw().toBuffer(),
  ]);
  // Inside the outline it's van, except the floor visible under it (below the sills), which
  // keeps the colour-based classification so the shadow between the wheels is evened out too.
  // Just below the bumpers: the front bumper hangs lower than the rear one.
  const underVan = (x) => (x < 760 ? 826 : 780);
  for (let k = 0; k < N; k++) {
    if (inside[k] < 128) bg[k] = 1;
    else if (Math.floor(k / W) < underVan(k % W)) bg[k] = 0;
  }

  // 4. Even the backdrop out: divide by its own colour (white where empty, soft grey in shadow).
  //    The white point comes from the photo: 90% of the backdrop is at least this bright
  //    relative to its estimate, so it all becomes white and only real shadow stays grey.
  const ratioAt = (k) => [0, 1, 2].reduce((s, c) => s + data[k * 3 + c] / backdrop(k, c), 0) / 3;
  const sample = [];
  for (let k = 0; k < N; k += 37) if (bg[k]) sample.push(ratioAt(k));
  sample.sort((a, b) => a - b);
  const white = sample[Math.floor(sample.length * 0.1)] * 0.96; // a little margin for faint banding
  const out = Buffer.from(data);
  for (let k = 0; k < N; k++) {
    const x = k % W, y = Math.floor(k / W);
    const edge = !bg[k] && neighbours(x, y).some(([a, b]) => bg[b * W + a]);
    if (!bg[k] && !edge) continue;
    const i = k * 3;
    // Neutral grey from the average brightness ratio, slightly lifted so faint noise disappears.
    // Far from the van there's no shadow to keep: pure white.
    const shaded = 255 * Math.min(1, ratioAt(k) / white);
    const w = near[k] / 255; // 1 next to the van, 0 far away
    const v = Math.max(0, Math.min(255, Math.round(255 * (1 - w) + shaded * w)));
    if (edge && v > lum(i)) continue; // keep the van's own outline where it's darker
    out[i] = out[i + 1] = out[i + 2] = v;
  }

  // 5. Crop to the van and its shadow, add a margin, size for the web.
  const trimmed = await sharp(out, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toBuffer()
    .then((b) => sharp(b).trim({ background: "#ffffff", threshold: 14 }).toBuffer({ resolveWithObject: true }));
  const pad = Math.round(trimmed.info.width * 0.04);
  const padded = await sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#ffffff" }).toBuffer();
  await sharp(padded).resize({ width: 1000 }).webp({ quality: 88 }).toFile(OUT);
  const m = await sharp(OUT).metadata();
  console.log(`backdrop: ${bg.reduce((a, b) => a + b, 0)} px; white point ${white.toFixed(3)}; output ${m.width}x${m.height} -> ${OUT}`);
})();
