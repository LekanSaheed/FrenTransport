import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * The browser calls the API directly at NEXT_PUBLIC_API_URL (no proxy through this
 * app, so API traffic doesn't count against the frontend host's bandwidth).
 */
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
      // The ticket scanner needs the camera (this page only; overrides the rule above).
      { source: "/admin/scan", headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" }] },
    ];
  },
};

// A production build without the API address would ship a site that calls localhost.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set. Set it to the API's base URL, e.g. https://api.obere.ng, and build again.");
  }
  return nextConfig;
}
