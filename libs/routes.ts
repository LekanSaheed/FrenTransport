import { API_BASE_URL } from "./config";

/**
 * The route network for server-rendered pages (route pages, homepage, sitemap), so the
 * content is in the HTML search engines read. Cached for an hour (ISR): the API is asked
 * at most once an hour per page, not on every visit. If the API is unreachable the pages
 * still render, just without route details.
 */
export interface PublicRoute {
  id: string;
  origin: { id: string; name: string; city: string; state: string };
  destination: { id: string; name: string; city: string; state: string };
  durationMinutes: number;
  distanceKm: number | null;
  fromPriceKobo: number | null;
  departuresThisWeek: number;
  departureTimes: string[];
}

/** One city pair ("Lagos to Abuja"): every terminal-to-terminal route between the two cities. */
export interface CityRoute {
  slug: string;
  from: string;
  to: string;
  fromState: string;
  toState: string;
  routes: PublicRoute[];
  fromPriceKobo: number | null;
  durationMinutes: number;
  departuresThisWeek: number;
  departureTimes: string[];
}

export const REVALIDATE_SECONDS = 3600;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const cityRouteSlug = (from: string, to: string) => `${slugify(from)}-to-${slugify(to)}`;

export async function getRoutes(): Promise<PublicRoute[]> {
  try {
    // Short timeout: a sleeping API (free hosting) mustn't hold up a build or a page.
    const res = await fetch(`${API_BASE_URL}/routes`, { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function getCityRoutes(): Promise<CityRoute[]> {
  const groups = new Map<string, PublicRoute[]>();
  for (const r of await getRoutes()) {
    if (r.origin.city === r.destination.city) continue;
    const slug = cityRouteSlug(r.origin.city, r.destination.city);
    groups.set(slug, [...(groups.get(slug) ?? []), r]);
  }
  return [...groups.entries()]
    .map(([slug, routes]) => {
      const prices = routes.map((r) => r.fromPriceKobo).filter((p): p is number => p != null);
      return {
        slug,
        from: routes[0]!.origin.city,
        to: routes[0]!.destination.city,
        fromState: routes[0]!.origin.state,
        toState: routes[0]!.destination.state,
        routes,
        fromPriceKobo: prices.length ? Math.min(...prices) : null,
        durationMinutes: Math.min(...routes.map((r) => r.durationMinutes)),
        departuresThisWeek: routes.reduce((n, r) => n + r.departuresThisWeek, 0),
        departureTimes: [...new Set(routes.flatMap((r) => r.departureTimes))].sort(),
      };
    })
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
}

export async function getCityRoute(slug: string): Promise<CityRoute | null> {
  return (await getCityRoutes()).find((r) => r.slug === slug) ?? null;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h} hours`) : `${m} minutes`;
}
