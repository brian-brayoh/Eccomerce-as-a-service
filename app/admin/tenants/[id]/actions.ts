"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/session";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Super Admin can edit any tenant's profile.
 * Tenant Admin can also edit their own store profile via
 * /dashboard/settings/store (same action, different auth check).
 */
export async function updateTenantProfile(tenantId: string, formData: FormData) {
  // Allow both Super Admin and the tenant's own admin
  const session_data = await (async () => {
    try {
      const { session, tenant } = await requireTenantSession();
      if (tenant.id === tenantId || session.user.role === "SUPER_ADMIN") {
        return { ok: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  })();

  if (!session_data.ok) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const whatsappPhone = String(formData.get("whatsappPhone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!name) return { error: "Business name is required" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name, tagline, description, whatsappPhone, email, phone, address } as any,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/dashboard/settings/store`);
  return { success: true };
}
