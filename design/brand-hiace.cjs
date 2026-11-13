// Adds the Obere logo to the van's side panel and silver alloy rims to both wheels.
// Usage (from Frontend/): node design/brand-hiace.cjs design/hiace-original.png public/logo.png public/fleet/hiace.png
const sharp = require("sharp");
const [, , input, logoPath, output] = process.argv;

/** An alloy rim seen at an angle: lip ellipse (cx, cy, rx, ry), hub pushed in perspective (hx, hy). */
function rim({ cx, cy, rx, ry, hx, hy, id }) {
  const k = ry / rx; // vertical squash of the wheel face
  const E = (x0, y0, a, r) => [x0 + Math.cos(a) * r, y0 + Math.sin(a) * r * k];
  const L = (a, f) => [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]; // point on the lip ellipse
  const hubR = rx * 0.27;
  const f = (n) => n.toFixed(1);
  // 5 split spokes (10 thin arms): wide at the hub, narrow at the lip; shaded side for depth.
  let spokes = "";
  for (let i = 0; i < 5; i++) {
    const base = (i / 5) * Math.PI * 2 - Math.PI / 2;
    for (const off of [-0.17, 0.17]) {
      const a = base + off;
      const [o1x, o1y] = L(a - 0.075, 0.84);
      const [o2x, o2y] = L(a + 0.075, 0.84);
      const [i1x, i1y] = E(hx, hy, base + off * 0.6 - 0.22, hubR * 0.95);
      const [i2x, i2y] = E(hx, hy, base + off * 0.6 + 0.22, hubR * 0.95);
      const lit = Math.cos(a + 2.2) > 0; // faces the light (upper left)
      spokes += `<path d="M${f(i1x)},${f(i1y)} L${f(o1x)},${f(o1y)} L${f(o2x)},${f(o2y)} L${f(i2x)},${f(i2y)} Z" fill="url(#spoke-${id})"/>`;
      // dark bevel along one edge
      spokes += `<path d="M${f(i2x)},${f(i2y)} L${f(o2x)},${f(o2y)}" stroke="${lit ? "#7b828c" : "#565c66"}" stroke-width="${f(rx * 0.035)}" stroke-linecap="round"/>`;
    }
  }
  const nuts = Array.from({ length: 5 }, (_, i) => {
    const [x, y] = E(hx, hy, (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5, hubR * 0.62);
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(hubR * 0.12)}" ry="${f(hubR * 0.12 * k)}" fill="#c9ced5" stroke="#3f444c" stroke-width="0.5"/>`;
  }).join("");
  return `
    <defs>
      <radialGradient id="lip-${id}" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fbfbfc"/><stop offset="0.5" stop-color="#cfd3d9"/><stop offset="1" stop-color="#6f7680"/>
      </radialGradient>
      <radialGradient id="barrel-${id}" cx="45%" cy="45%" r="60%">
        <stop offset="0" stop-color="#3a3f47"/><stop offset="0.7" stop-color="#1d2026"/><stop offset="1" stop-color="#0c0d10"/>
      </radialGradient>
      <radialGradient id="disc-${id}" cx="40%" cy="40%" r="70%">
        <stop offset="0" stop-color="#8b9099"/><stop offset="1" stop-color="#4a4f57"/>
      </radialGradient>
      <linearGradient id="spoke-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f3f4f6"/><stop offset="0.55" stop-color="#c4c9d0"/><stop offset="1" stop-color="#8d949e"/>
      </linearGradient>
      <radialGradient id="cap-${id}" cx="35%" cy="30%" r="85%">
        <stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#c7ccd3"/><stop offset="1" stop-color="#7f8690"/>
      </radialGradient>
      <radialGradient id="shade-${id}" cx="30%" cy="25%" r="95%">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/>
      </radialGradient>
    </defs>
    <!-- outer lip -->
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#lip-${id})" stroke="#2e3238" stroke-width="1.2"/>
    <!-- lip highlight (upper left) -->
    <path d="M${f(L(Math.PI * 0.95, 0.96)[0])},${f(L(Math.PI * 0.95, 0.96)[1])} A${f(rx * 0.96)},${f(ry * 0.96)} 0 0 1 ${f(L(Math.PI * 1.6, 0.96)[0])},${f(L(Math.PI * 1.6, 0.96)[1])}" fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="${f(rx * 0.04)}" stroke-linecap="round"/>
    <!-- deep barrel and brake disc behind the spokes -->
    <ellipse cx="${cx}" cy="${cy}" rx="${f(rx * 0.86)}" ry="${f(ry * 0.86)}" fill="url(#barrel-${id})"/>
    <ellipse cx="${f((cx + hx) / 2)}" cy="${f((cy + hy) / 2)}" rx="${f(rx * 0.62)}" ry="${f(ry * 0.62)}" fill="url(#disc-${id})" opacity="0.55"/>
    <ellipse cx="${f((cx + hx) / 2)}" cy="${f((cy + hy) / 2)}" rx="${f(rx * 0.62)}" ry="${f(ry * 0.62)}" fill="none" stroke="#2b2f35" stroke-width="0.8" opacity="0.6"/>
    ${spokes}
    <!-- hub -->
    <ellipse cx="${hx}" cy="${hy}" rx="${f(hubR)}" ry="${f(hubR * k)}" fill="url(#cap-${id})" stroke="#3f444c" stroke-width="0.8"/>
    ${nuts}
    <ellipse cx="${hx}" cy="${hy}" rx="${f(hubR * 0.36)}" ry="${f(hubR * 0.36 * k)}" fill="#172a6b" stroke="#f26b1d" stroke-width="${f(hubR * 0.08)}"/>
    <!-- overall shading so it sits in the wheel arch light -->
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shade-${id})"/>`;
}

(async () => {
  const base = sharp(input);
  const { width, height } = await base.metadata();

  // Logo: trim its transparent margin, size it for the side panel.
  const logoH = 176;
  const logo = await sharp(logoPath).trim().resize({ height: logoH }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  // Foreshortened like the panel (the side recedes to the right), centred between door and rear arch.
  const logoW = Math.round(lm.width * 0.9);
  const logoPng = await sharp(logo).resize({ width: logoW, height: logoH, fit: "fill" }).toBuffer();

  const rims = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${rim({ id: "f", cx: 376, cy: 517, rx: 47, ry: 49, hx: 373, hy: 517 })}
    ${rim({ id: "r", cx: 860.5, cy: 477.5, rx: 33, ry: 39.5, hx: 855, hy: 478 })}
  </svg>`;

  await base
    .composite([
      { input: logoPng, left: Math.round(640 - logoW / 2), top: 308, blend: "multiply" },
      { input: await sharp(Buffer.from(rims)).blur(0.45).png().toBuffer(), left: 0, top: 0 },
    ])
    .png()
    .toFile(output);
  console.log("logo", logoW, "x", logoH, "->", output);
})();
