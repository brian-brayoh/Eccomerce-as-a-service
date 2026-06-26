"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCart, setCart } from "@/lib/cart";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: string, quantity: number = 1) {
  const tenant = await getCurrentTenantOrThrow();

  // Verify the product belongs to this tenant and is purchasable
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id, status: "ACTIVE" },
  });
  if (!product) return { error: "Product not available" };
  if (product.stock < 1) return { error: "Out of stock" };

  const cart = getCart(tenant.id);
  const existing = cart.find((i) => i.productId === productId);

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    existing.quantity = newQty;
  } else {
    cart.push({ productId, quantity: Math.min(quantity, product.stock) });
  }

  setCart(tenant.id, cart);
  revalidatePath("/cart");
  return { success: true, cartCount: cart.reduce((s, i) => s + i.quantity, 0) };
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const tenant = await getCurrentTenantOrThrow();

  if (quantity < 1) {
    return removeFromCart(productId);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
  });

  const cart = getCart(tenant.id);
  const item = cart.find((i) => i.productId === productId);
  if (!item) return { error: "Item not in cart" };

  item.quantity = product ? Math.min(quantity, product.stock) : quantity;
  setCart(tenant.id, cart);
  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCart(productId: string) {
  const tenant = await getCurrentTenantOrThrow();
  const cart = getCart(tenant.id).filter((i) => i.productId !== productId);
  setCart(tenant.id, cart);
  revalidatePath("/cart");
  return { success: true };
}

export async function getCartCount(): Promise<number> {
  try {
    const tenant = await getCurrentTenantOrThrow();
    const cart = getCart(tenant.id);
    return cart.reduce((s, i) => s + i.quantity, 0);
  } catch {
    return 0;
  }
}
