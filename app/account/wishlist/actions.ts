"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Please sign in to save items", requiresLogin: true };

  const tenant = await getCurrentTenantOrThrow();

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
  });
  if (!product) return { error: "Product not found" };

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { success: true, added: false };
  } else {
    await prisma.wishlistItem.create({
      data: { tenantId: tenant.id, customerId: customer.id, productId },
    });
    revalidatePath("/account/wishlist");
    return { success: true, added: true };
  }
}

export async function removeFromWishlist(wishlistItemId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not signed in" };

  const item = await prisma.wishlistItem.findFirst({
    where: { id: wishlistItemId, customerId: customer.id },
  });
  if (!item) return { error: "Item not found" };

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  revalidatePath("/account/wishlist");
  return { success: true };
}