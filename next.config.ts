import type { NextConfig } from "next";

/**
 * The browser talks to the API through this app (same origin): `/api/*` is
 * forwarded to the Express backend. Session cookies are therefore first-party
 * wherever the two are hosted, and no CORS setup is needed. BACKEND_URL is a
 * server-side setting and never reaches the browser.
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    // Gallery images (Admin → Gallery) live on Cloudinary; SmartImage asks Cloudinary for resized copies.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "DENY" }, // no clickjacking (admin and account pages)
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // email-link tokens never leak to other sites
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }, // ignored over plain http (local dev)
    ];
    const privatePages = [
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: privatePages },
      { source: "/account/:path*", headers: privatePages },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
