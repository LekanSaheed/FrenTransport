import type { Metadata } from "next";

/**
 * Search and social-sharing settings, in one place.
 *
 * SITE_URL is the public address search engines should index (the one the site ends on,
 * e.g. https://www.obere.ng when obere.ng redirects there). Canonical links, the sitemap
 * and share previews are built from it. Set NEXT_PUBLIC_SITE_URL per deployment.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.obere.ng").replace(/\/+$/, "");
export const SITE_NAME = "Obere Transport";
export const DEFAULT_DESCRIPTION =
  "Book intercity bus seats across Nigeria with Obere Transport, or hire a car or bus. Pick your seat, pay online and manage your booking anytime.";

/**
 * Only the production site is indexed; Vercel preview deployments and other test copies tell
 * search engines to stay away (robots.txt), so they don't compete with the real site.
 * Vercel sets VERCEL_ENV; on another host set ALLOW_INDEXING=1 for production (server-side only).
 */
export const INDEXABLE = process.env.ALLOW_INDEXING === "1" || process.env.VERCEL_ENV === "production";

/**
 * Metadata for a public page: title, description, canonical URL and share previews.
 * `noindex` keeps private or one-off pages (checkout, Manage Booking) out of search results.
 */
export function pageMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
  /** The page has its own opengraph-image file (e.g. route pages): don't set the site-wide one. */
  ownImage?: boolean;
}): Metadata {
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  return {
    title: opts.title,
    description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_NG",
      url: opts.path,
      title: opts.title,
      description,
      // The site-wide card (app/opengraph-image.tsx), unless the page brings its own.
      ...(!opts.ownImage && { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }] }),
    },
    twitter: { card: "summary_large_image", title: opts.title, description },
    ...(opts.noindex && { robots: { index: false, follow: true } }),
  };
}

/** Renders schema.org structured data (JSON-LD) for search engines. */
export function jsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  // `<` is escaped so text in the data can never close the script tag.
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};
