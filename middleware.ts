import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { getTenantIdentifierFromHost, ROOT_DOMAIN } from "@/lib/tenant";

/**
 * Runs on every request. Two responsibilities:
 *
 * 1. TENANT RESOLUTION
 *    Reads the Host header, figures out which tenant the request belongs
 *    to (subdomain / custom domain / local dev), and writes that
 *    identifier into a request header (`x-tenant-slug` or
 *    `x-tenant-domain`) so server components and API routes can pick it
 *    up without re-parsing the Host header themselves.
 *
 * 2. ROUTE PROTECTION
 *    `/dashboard/**` requires a logged-in session.
 *    `/admin/**`     requires a SUPER_ADMIN session (platform owner only).
 *    Everything else (storefront, /login) is public.
 *
 * NOTE: Uses `authConfig` (lib/auth.config.ts), NOT the full `auth`
 * export from lib/auth.ts. The full config imports Prisma/bcrypt,
 * which don't work in the Edge Runtime that middleware runs in.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host");
  const identifier = getTenantIdentifierFromHost(host);

  // Clone request headers and attach tenant info for downstream use
  const requestHeaders = new Headers(req.headers);
  if (identifier.type === "slug") {
    requestHeaders.set("x-tenant-slug", identifier.value);
  } else {
    requestHeaders.set("x-tenant-domain", identifier.value);
  }

  const session = req.auth;
  const { pathname } = nextUrl;

  // ── Super Admin area — platform owner only ──────────────
  if (pathname.startsWith("/admin")) {
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      const url = nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Tenant dashboard — any logged-in staff user ─────────
  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      const url = nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Logged-in users shouldn't see the login page again ──
  if (pathname.startsWith("/login") && session?.user) {
    const url = nextUrl.clone();
    url.pathname = session.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (NextAuth's own routes)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico and other static assets
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// Re-export so other modules can read the same constant if needed
export { ROOT_DOMAIN };
