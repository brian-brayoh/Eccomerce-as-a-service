"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createBanner(formData: FormData) {
  const { tenant } = await requireTenantSession();

  const title = String(formData.get("title") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const placement = String(formData.get("placement") ?? "HOMEPAGE_HERO");
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  if (!imageUrl) return { error: "An image is required for a banner" };

  const maxPosition = await prisma.banner.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.banner.create({
    data: {
      tenantId: tenant.id,
      title,
      imageUrl,
      linkUrl,
      placement: placement as any,
      position: (maxPosition?.position ?? 0) + 1,
      active: true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/dashboard/marketing/banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleBanner(id: string, active: boolean) {
  const { tenant } = await requireTenantSession();

  await prisma.banner.updateMany({
    where: { id, tenantId: tenant.id },
    data: { active },
  });

  revalidatePath("/dashboard/marketing/banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBanner(id: string) {
  const { tenant } = await requireTenantSession();

  await prisma.banner.deleteMany({ where: { id, tenantId: tenant.id } });

  revalidatePath("/dashboard/marketing/banners");
  revalidatePath("/");
  return { success: true };
}
