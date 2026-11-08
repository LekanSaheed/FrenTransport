import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every matched request.
 *
 * 1. /api/* is forwarded to the backend (next.config.ts rewrites). The rewrite
 *    doesn't pass the customer's IP, so we add it — signed with a secret the
 *    backend shares — and strip any copy the browser tried to send.
 * 2. /admin/* and /account/* redirect to their sign-in pages when there's no
 *    session cookie. This is only for convenience: the backend checks the
 *    session and role on every API call, and pages handle 401/403 themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const headers = new Headers(request.headers);
    headers.delete("x-obere-client-ip");
    headers.delete("x-obere-proxy-secret");
    const secret = process.env.API_PROXY_SECRET;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim();
    if (secret && ip) {
      headers.set("x-obere-client-ip", ip);
      headers.set("x-obere-proxy-secret", secret);
    }
    return NextResponse.next({ request: { headers } });
  }

  const next = encodeURIComponent(pathname + search);
  // Sign-in and invitation pages are open; the rest of /admin needs a staff session cookie.
  const publicAdmin = pathname.startsWith("/admin/login") || pathname.startsWith("/admin/accept-invite");
  if (pathname.startsWith("/admin") && !publicAdmin && !request.cookies.has("obere_admin_session")) {
    return NextResponse.redirect(new URL(`/admin/login?next=${next}`, request.url));
  }
  if (pathname.startsWith("/account") && !request.cookies.has("obere_session")) {
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/account/:path*"],
};
