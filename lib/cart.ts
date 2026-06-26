import { cookies } from "next/headers";

/**
 * Cart storage strategy: a single JSON-encoded cookie holding
 * { productId, quantity } pairs, scoped per-tenant (since the same
 * browser could theoretically visit two different tenant storefronts).
 *
 * This works for BOTH guests and logged-in customers — the cart
 * itself doesn't require an account. An account is only needed at
 * checkout if the customer wants order history (guest checkout is
 * also supported, matching the schema's `guestName`/`guestPhone`
 * fields on Order).
 *
 * Why a cookie instead of a database Cart table: simpler, no cleanup
 * job needed for abandoned carts, and it matches how small Kenyan
 * e-commerce sites typically work — no schema migration required
 * either, since `Cart` isn't part of the current Prisma schema.
 */

export type CartItem = { productId: string; quantity: number };

function cartCookieName(tenantId: string) {
  return `pc_cart_${tenantId}`;
}

export function getCart(tenantId: string): CartItem[] {
  const raw = cookies().get(cartCookieName(tenantId))?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem => typeof i.productId === "string" && typeof i.quantity === "number" && i.quantity > 0
    );
  } catch {
    return [];
  }
}

export function setCart(tenantId: string, items: CartItem[]) {
  cookies().set(cartCookieName(tenantId), JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
  });
}

export function clearCart(tenantId: string) {
  cookies().delete(cartCookieName(tenantId));
}
