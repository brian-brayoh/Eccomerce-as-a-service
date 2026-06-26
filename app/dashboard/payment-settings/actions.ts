"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateMpesaSettings(formData: FormData) {
  const { tenant, session } = await requireTenantSession();

  // Only ADMIN/SUPER_ADMIN can change payment credentials — STAFF
  // shouldn't be able to see or change where money gets routed.
  if (session.user.role === "STAFF") {
    return { error: "You don't have permission to change payment settings" };
  }

  const enabled = formData.get("mpesaEnabled") === "on";
  const shortcode = String(formData.get("mpesaShortcode") ?? "").trim();
  const consumerKey = String(formData.get("mpesaConsumerKey") ?? "").trim();
  const consumerSecret = String(formData.get("mpesaConsumerSecret") ?? "").trim();
  const passkey = String(formData.get("mpesaPasskey") ?? "").trim();
  const environment = String(formData.get("mpesaEnvironment") ?? "sandbox");

  if (enabled && (!shortcode || !consumerKey || !consumerSecret || !passkey)) {
    return { error: "All M-Pesa fields are required to enable payments" };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      mpesaEnabled: enabled,
      mpesaShortcode: shortcode || null,
      mpesaConsumerKey: consumerKey || null,
      // Only overwrite the secret/passkey if a new value was actually
      // typed — otherwise keep the existing one (the form shows a
      // masked placeholder, not the real value, for already-saved secrets).
      ...(consumerSecret ? { mpesaConsumerSecret: consumerSecret } : {}),
      ...(passkey ? { mpesaPasskey: passkey } : {}),
      mpesaEnvironment: environment,
    },
  });

  revalidatePath("/dashboard/payment-settings");
  return { success: true };
}
