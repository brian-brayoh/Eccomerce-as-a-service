"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateMpesaSettings(formData: FormData) {
  const { tenant, session } = await requireTenantSession();

  // Only ADMIN or SUPER_ADMIN can change payment credentials —
  // not STAFF. This matters because these credentials control
  // where the tenant's money actually goes.
  if (session.user.role === "STAFF") {
    return { error: "Only an admin can update payment settings" };
  }

  const mpesaShortcode = String(formData.get("mpesaShortcode") ?? "").trim();
  const mpesaConsumerKey = String(formData.get("mpesaConsumerKey") ?? "").trim();
  const mpesaConsumerSecret = String(formData.get("mpesaConsumerSecret") ?? "").trim();
  const mpesaPasskey = String(formData.get("mpesaPasskey") ?? "").trim();
  const mpesaEnvironment = String(formData.get("mpesaEnvironment") ?? "sandbox");
  const mpesaEnabled = formData.get("mpesaEnabled") === "on";

  if (mpesaEnabled && (!mpesaShortcode || !mpesaConsumerKey || !mpesaConsumerSecret || !mpesaPasskey)) {
    return { error: "All four credential fields are required to enable M-Pesa" };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      mpesaShortcode: mpesaShortcode || null,
      mpesaConsumerKey: mpesaConsumerKey || null,
      mpesaConsumerSecret: mpesaConsumerSecret || null,
      mpesaPasskey: mpesaPasskey || null,
      mpesaEnvironment,
      mpesaEnabled,
    },
  });

  revalidatePath("/dashboard/settings/mpesa");
  return { success: true };
}
