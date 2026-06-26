"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function submitReview(productId: string, formData: FormData) {
  const tenant = await getCurrentTenantOrThrow();
  const customer = await getCurrentCustomer();

  if (!customer) return { error: "Please sign in to leave a review" };

  const rating = parseInt(String(formData.get("rating") ?? "0"), 10);
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (rating < 1 || rating > 5) return { error: "Please select a rating" };

  // Verify product belongs to this tenant
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
  });
  if (!product) return { error: "Product not found" };

  // Only allow one review per customer per product
  const existing = await prisma.review.findFirst({
    where: { productId, customerId: customer.id },
  });
  if (existing) {
    // Update existing review instead
    await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment },
    });
  } else {
    await prisma.review.create({
      data: {
        tenantId: tenant.id,
        productId,
        customerId: customer.id,
        rating,
        comment,
      },
    });
  }

  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function deleteReview(reviewId: string) {
  const tenant = await getCurrentTenantOrThrow();
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not signed in" };

  await prisma.review.deleteMany({
    where: { id: reviewId, customerId: customer.id, tenantId: tenant.id },
  });

  revalidatePath("/products");
  return { success: true };
}
