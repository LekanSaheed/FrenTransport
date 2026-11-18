import { API_BASE_URL } from "./config";
import type { PublicConfig } from "./api";

/**
 * The operator's current settings (refund rules, baggage, cut-offs) for server-rendered
 * pages such as the Refund and Baggage policies. Cached for an hour; null if the API is
 * unreachable, so pages fall back to general wording instead of guessing numbers.
 */
export async function getPublicConfig(): Promise<PublicConfig | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/config`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return ((await res.json())?.data as PublicConfig) ?? null;
  } catch {
    return null;
  }
}
