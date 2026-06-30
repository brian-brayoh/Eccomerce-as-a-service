import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/session";

/**
 * Customer sessions are intentionally kept SEPARATE from staff
 * Auth.js sessions (different cookie, different JWT, different
 * secret usage pattern). This is a deliberate isolation boundary:
 *
 *   Staff (User)      -> next-auth.session-token  -> /dashboard, /admin
 *   Customers (Customer) -> pc_customer_session    -> /, /account, /products
 *
 * A customer JWT can NEVER be mistaken for a staff session because
 * they're stored under different cookie names and verified with
 * different code paths. This matches the schema's separation of
 * `User` (staff) and `Customer` (storefront) into two distinct tables.
 */

const CUSTOMER_COOKIE = "pc_customer_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-dev-secret-change-me");

type CustomerSessionPayload = {
  customerId: string;
  tenantId: string;
  name: string;
  email: string | null;
};

export async function createCustomerSession(payload: CustomerSessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCustomerSession() {
  cookies().delete(CUSTOMER_COOKIE);
}

/**
 * Reads and verifies the current customer session cookie.
 * Returns null if missing, expired, or invalid — callers should
 * treat that as "not logged in", not throw.
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomerSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Returns the full Customer record for the current session, but
 * ONLY if it belongs to the tenant resolved from the current
 * hostname. This is the same cross-tenant safety check used for
 * staff sessions in requireTenantSession() — a customer logged
 * into BMM Creations's subdomain should never see ABC Electronics'
 * account data even if their session cookie is somehow still set.
 */
export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;

  const tenant = await getCurrentTenant();
  if (!tenant || session.tenantId !== tenant.id) return null;

  return prisma.customer.findUnique({ where: { id: session.customerId } });
}
