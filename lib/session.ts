import { headers, cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getTenantIdentifierFromHost } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Looks up a Tenant by slug or custom domain, based on the given
 * Host header. Cached per-request via React's `cache()` so repeated
 * calls during a single render pass don't hit the database multiple
 * times.
 *
 * IMPORTANT: This file uses Prisma + React's `cache()`, both of which
 * only work in the Node.js runtime (server components, route handlers,
 * server actions) — NOT in Edge middleware. Middleware should only use
 * the pure, I/O-free helpers from lib/tenant.ts.
 */
export const getTenantByHost = cache(async (hostHeader: string | null) => {
  const identifier = getTenantIdentifierFromHost(hostHeader);

  if (identifier.type === "slug") {
    return prisma.tenant.findUnique({ where: { slug: identifier.value } });
  }

  return prisma.tenant.findUnique({ where: { customDomain: identifier.value } });
});

/**
 * Throws-on-missing variant for server components/actions that
 * require a valid tenant to proceed (e.g. storefront pages, admin pages).
 */
export async function requireTenant(hostHeader: string | null) {
  const tenant = await getTenantByHost(hostHeader);
  if (!tenant) {
    throw new Error(
      `No tenant found for host "${hostHeader}". Check ROOT_DOMAIN and Tenant.slug/customDomain.`
    );
  }
  return tenant;
}

/**
 * Resolves the current tenant from the request's Host header.
 * Use this in storefront pages (homepage, product pages, etc.)
 * where a missing tenant should 404, not redirect.
 */
export async function getCurrentTenant() {
  const headersList = headers();
  const host = headersList.get("host");
  return getTenantByHost(host);
}

/**
 * Same as getCurrentTenant() but throws if no tenant is found.
 * Use in storefront layouts — pair with Next.js notFound() in
 * the calling page/layout if you want a 404 instead of an error page.
 */
export async function getCurrentTenantOrThrow() {
  const headersList = headers();
  const host = headersList.get("host");
  return requireTenant(host);
}

/**
 * Cookie name used to store the Super Admin's "viewing as" tenant
 * selection. Only honored for SUPER_ADMIN sessions — see
 * requireTenantSession() below.
 */
export const IMPERSONATION_COOKIE = "pc_view_as_tenant";

/**
 * For /dashboard pages: returns the current session AND the tenant
 * whose data should be shown.
 *
 * Resolution rules:
 *  - SUPER_ADMIN: if the `pc_view_as_tenant` cookie is set to a valid
 *    tenant ID, that tenant's data is shown (the "View as Tenant"
 *    switcher). Otherwise falls back to the tenant resolved from the
 *    current hostname (so visiting printcare.localhost still works).
 *  - ADMIN / STAFF: MUST match session.user.tenantId === tenant
 *    resolved from the current hostname. A user could theoretically
 *    have a valid session cookie for Tenant A but visit Tenant B's
 *    subdomain — this check prevents that cross-tenant data leak.
 *
 * Redirects to /login if no session, or if the tenant can't be resolved.
 */
export async function requireTenantSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const hostTenant = await getCurrentTenant();

  if (session.user.role === "SUPER_ADMIN") {
    const cookieStore = cookies();
    const viewAsId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    if (viewAsId) {
      const viewAsTenant = await prisma.tenant.findUnique({ where: { id: viewAsId } });
      if (viewAsTenant) {
        return { session, tenant: viewAsTenant, isImpersonating: true };
      }
    }

    if (hostTenant) {
      return { session, tenant: hostTenant, isImpersonating: false };
    }

    // Super admin with no cookie and no host-resolved tenant —
    // fall back to the first tenant so /dashboard doesn't crash.
    const fallback = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
    if (!fallback) redirect("/login");
    return { session, tenant: fallback, isImpersonating: false };
  }

  // Regular ADMIN/STAFF — must match the hostname's tenant exactly.
  if (!hostTenant) {
    redirect("/login");
  }
  if (session.user.tenantId !== hostTenant.id) {
    redirect("/login");
  }

  return { session, tenant: hostTenant, isImpersonating: false };
}

/**
 * For /admin (Super Admin) pages: verifies the session belongs
 * to a SUPER_ADMIN user. Tenant is irrelevant here — the Super
 * Admin manages the whole platform.
 */
export async function requireSuperAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  return { session };
}
