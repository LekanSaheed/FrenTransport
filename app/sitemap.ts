import type { MetadataRoute } from "next";
import { getCityRoutes } from "@/libs/routes";
import { SITE_URL } from "@/libs/seo";

/** /sitemap.xml: the public pages plus one page per city pair served (refreshed hourly). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  const routes = await getCityRoutes();
  return [
    page("/", 1, "daily"),
    page("/book", 0.9, "daily"),
    page("/routes", 0.9, "daily"),
    ...routes.map((r) => page(`/routes/${r.slug}`, 0.8, "daily")),
    page("/hire/car", 0.7),
    page("/hire/bus", 0.7),
    page("/booking-status", 0.4, "monthly"),
    page("/manage", 0.4, "monthly"),
    page("/about", 0.5, "monthly"),
    page("/contact", 0.5, "monthly"),
  ];
}
