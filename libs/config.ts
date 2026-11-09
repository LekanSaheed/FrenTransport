/**
 * The API's base URL: the one place it is set (like RTK Query's `fetchBaseQuery({ baseUrl })`).
 * Every endpoint passes only its path (e.g. "/trips/search"); `request()` in libs/api.ts puts
 * this in front, so calls go straight to the API: https://api.obere.ng/api/v1/trips/search.
 *
 * NEXT_PUBLIC_API_URL is just the API's address (e.g. https://api.obere.ng or
 * https://obere-api.onrender.com); the /api/v1 prefix is added here. A value that already ends
 * in /api/v1 works too. It is compiled in at build time (a production build fails without it;
 * see next.config.ts). Local development falls back to the API on port 4000.
 */
const API_PREFIX = "/api/v1";
const origin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "").replace(/\/api\/v1$/, "");

export const API_BASE_URL = origin + API_PREFIX;

/** Absolute URL for an API path: apiUrl("/trips/search") → `${API_BASE_URL}/trips/search`. */
export function apiUrl(path: string): URL {
  return new URL(API_BASE_URL + (path.startsWith("/") ? path : `/${path}`));
}
