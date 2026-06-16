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

export async function createCategory(formData: FormData) {
  const { tenant } = await requireTenantSession();

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;

  if (!name) return { error: "Name is required" };

  const slug = slugify(name);

  // Ensure slug is unique within this tenant — append a suffix if needed
  let finalSlug = slug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { tenantId_slug: { tenantId: tenant.id, slug: finalSlug } } })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name,
      slug: finalSlug,
      parentId: parentId || null,
    },
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const { tenant } = await requireTenantSession();

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;

  if (!name) return { error: "Name is required" };

  // Verify the category belongs to this tenant before updating
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, tenantId: tenant.id },
  });
  if (!existing) return { error: "Category not found" };

  // Prevent a category from being its own parent (or its own descendant)
  if (parentId === categoryId) {
    return { error: "A category cannot be its own parent" };
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, parentId: parentId || null },
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const { tenant } = await requireTenantSession();

  const existing = await prisma.category.findFirst({
    where: { id: categoryId, tenantId: tenant.id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) return { error: "Category not found" };

  if (existing._count.products > 0) {
    return { error: `Cannot delete: ${existing._count.products} product(s) use this category. Reassign them first.` };
  }
  if (existing._count.children > 0) {
    return { error: `Cannot delete: this category has ${existing._count.children} subcategory/ies. Delete or move those first.` };
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/dashboard/categories");
  revalidatePath("/products");
  return { success: true };
}
