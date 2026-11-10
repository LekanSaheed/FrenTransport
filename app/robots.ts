import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/libs/seo";

/** /robots.txt. Private areas stay out of search; test deployments are not indexed at all. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Seat checkout (/book/<trip>), payment results and accounts are personal; admin is
      // staff-only. /book (the search page), /manage and /booking-status stay findable.
      disallow: ["/admin", "/account", "/payment", "/book/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
