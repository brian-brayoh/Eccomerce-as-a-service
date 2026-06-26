"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function upsertPopup(formData: FormData) {
  const { tenant } = await requireTenantSession();

  const id = String(formData.get("id") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "ANNOUNCEMENT");
  const title = String(formData.get("title") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const buttonText = String(formData.get("buttonText") ?? "").trim() || null;
  const buttonLink = String(formData.get("buttonLink") ?? "").trim() || null;
  const enabled = formData.get("enabled") === "on";
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  if (!title && !message) {
    return { error: "A title or message is required" };
  }

  const data = {
    type: type as any,
    title,
    message,
    imageUrl,
    buttonText,
    buttonLink,
    enabled,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  };

  if (id) {
    await prisma.popup.updateMany({ where: { id, tenantId: tenant.id }, data });
  } else {
    await prisma.popup.create({ data: { tenantId: tenant.id, ...data } });
  }

  revalidatePath("/dashboard/marketing/popups");
  revalidatePath("/");
  return { success: true };
}

export async function togglePopup(id: string, enabled: boolean) {
  const { tenant } = await requireTenantSession();
  await prisma.popup.updateMany({ where: { id, tenantId: tenant.id }, data: { enabled } });
  revalidatePath("/dashboard/marketing/popups");
  revalidatePath("/");
  return { success: true };
}

export async function deletePopup(id: string) {
  const { tenant } = await requireTenantSession();
  await prisma.popup.deleteMany({ where: { id, tenantId: tenant.id } });
  revalidatePath("/dashboard/marketing/popups");
  revalidatePath("/");
  return { success: true };
}
