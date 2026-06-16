"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseDecimal(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  if (isNaN(num) || num < 0) return null;
  return num;
}

export async function createProduct(formData: FormData) {
  const { tenant } = await requireTenantSession();

  const name = String(formData.get("name") ?? "").trim();
  const price = parseDecimal(formData.get("price"));
  const salePrice = parseDecimal(formData.get("salePrice"));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const description = String(formData.get("description") ?? "").trim() || null;
  const featured = formData.get("featured") === "on";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!name) return { error: "Name is required" };
  if (price === null) return { error: "A valid price is required" };
  if (salePrice !== null && salePrice >= price) {
    return { error: "Sale price must be lower than the regular price" };
  }

  const slug = slugify(name);
  let finalSlug = slug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { tenantId_slug: { tenantId: tenant.id, slug: finalSlug } } })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId,
      name,
      slug: finalSlug,
      description,
      price,
      salePrice,
      brand,
      sku,
      stock,
      featured,
      status: stock > 0 ? "ACTIVE" : "OUT_OF_STOCK",
    },
  });

  if (imageUrl) {
    await prisma.productImage.create({
      data: { productId: product.id, url: imageUrl, position: 0 },
    });
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
  const { tenant } = await requireTenantSession();

  const existing = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
  });
  if (!existing) return { error: "Product not found" };

  const name = String(formData.get("name") ?? "").trim();
  const price = parseDecimal(formData.get("price"));
  const salePrice = parseDecimal(formData.get("salePrice"));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const description = String(formData.get("description") ?? "").trim() || null;
  const featured = formData.get("featured") === "on";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!name) return { error: "Name is required" };
  if (price === null) return { error: "A valid price is required" };
  if (salePrice !== null && salePrice >= price) {
    return { error: "Sale price must be lower than the regular price" };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      categoryId,
      name,
      description,
      price,
      salePrice,
      brand,
      sku,
      stock,
      featured,
      status: stock > 0
        ? (existing.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE")
        : "OUT_OF_STOCK",
    },
  });

  // Replace the primary image if a new one was uploaded (the
  // ImageUpload component writes the hosted Blob URL into this
  // hidden field once the upload completes).
  if (imageUrl) {
    const existingImage = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: "asc" },
    });

    if (existingImage) {
      if (existingImage.url !== imageUrl) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { url: imageUrl },
        });
      }
    } else {
      await prisma.productImage.create({
        data: { productId, url: imageUrl, position: 0 },
      });
    }
  }


  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  revalidatePath(`/products/${existing.slug}`);
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { tenant } = await requireTenantSession();

  const existing = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) return { error: "Product not found" };

  if (existing._count.orderItems > 0) {
    // Don't hard-delete products with order history — archive instead
    await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
    revalidatePath("/dashboard/products");
    revalidatePath("/products");
    return { success: true, archived: true };
  }

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  return { success: true };
}

export async function toggleFeatured(productId: string, featured: boolean) {
  const { tenant } = await requireTenantSession();

  const existing = await prisma.product.findFirst({ where: { id: productId, tenantId: tenant.id } });
  if (!existing) return { error: "Product not found" };

  await prisma.product.update({ where: { id: productId }, data: { featured } });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  return { success: true };
}
