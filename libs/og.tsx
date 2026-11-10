import { ImageResponse } from "next/og";

/** Share-preview card (WhatsApp, X, Facebook, LinkedIn...), 1200×630, in the site's colours. */
export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: "#0f1d4d", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "#f26b1d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900 }}>O</div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>
            OBERE <span style={{ color: "#f26b1d", marginLeft: 10 }}>TRANSPORT</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f26b1d", textTransform: "uppercase", letterSpacing: 4 }}>{eyebrow}</div>
          <div style={{ fontSize: 78, fontWeight: 900, lineHeight: 1.05, marginTop: 18, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 32, marginTop: 24, color: "rgba(255,255,255,0.78)", maxWidth: 960 }}>{subtitle}</div>
        </div>
        {/* Lane line, as on the site */}
        <div style={{ display: "flex", gap: 32 }}>
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} style={{ width: 48, height: 8, borderRadius: 4, background: "#f26b1d" }} />
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
