/**
 * The root domain of the platform — used to detect subdomains.
 * e.g. if ROOT_DOMAIN = "yourplatform.com", then:
 *   bmmcreations.yourplatform.com  -> slug = "bmmcreations"
 *   abc-electronics.yourplatform.com -> slug = "abc-electronics"
 *
 * Set this in your .env file.
 */
export const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

/**
 * Extracts the tenant identifier from a request hostname.
 *
 * Resolution order:
 *  1. Custom domain match (e.g. "bmmcreations.com") -> looked up directly
 *  2. Subdomain of ROOT_DOMAIN (e.g. "bmmcreations.yourplatform.com") -> slug = "bmmcreations"
 *  3. Local development (e.g. "localhost:3000" or "bmmcreations.localhost:3000")
 *     -> falls back to DEFAULT_TENANT_SLUG env var, or "bmmcreations"
 *
 * Returns either:
 *  - { type: "slug", value: string }       — look up by Tenant.slug
 *  - { type: "domain", value: string }      — look up by Tenant.customDomain
 *
 * NOTE: This function is pure (no I/O) so it is safe to call from
 * Edge Runtime middleware. Database lookups happen separately in
 * getTenantByHost() (lib/session.ts territory — Node runtime only).
 */
export function getTenantIdentifierFromHost(
  hostHeader: string | null
): { type: "slug" | "domain"; value: string } {
  const host = (hostHeader ?? "").toLowerCase().split(":")[0]; // strip port
  const rootHost = ROOT_DOMAIN.split(":")[0];

  // Local dev: "localhost" or "bmmcreations.localhost"
  if (host === "localhost" || host.endsWith(".localhost")) {
    const parts = host.split(".");
    if (parts.length > 1) {
      // "bmmcreations.localhost" -> "bmmcreations"
      return { type: "slug", value: parts[0] };
    }
    // Plain "localhost" -> use default tenant for local dev
    return { type: "slug", value: process.env.DEFAULT_TENANT_SLUG ?? "bmmcreations" };
  }

  // Subdomain of the platform's root domain
  if (host.endsWith(`.${rootHost}`)) {
    const sub = host.slice(0, -(rootHost.length + 1));
    // "bmmcreations" -> slug. Ignore "www" and the bare root domain itself.
    if (sub && sub !== "www") {
      return { type: "slug", value: sub };
    }
  }

  // Anything else is treated as a potential custom domain
  // (e.g. "bmmcreations.com")
  return { type: "domain", value: host };
}
