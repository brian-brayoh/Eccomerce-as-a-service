"use server";

import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Updates the current user's password.
 * Requires the current password to be entered correctly first —
 * this prevents someone who briefly accesses an already-open
 * session (e.g. unlocked laptop) from locking the real owner out.
 */
export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const sameAsOld = await bcrypt.compare(newPassword, user.password);
  if (sameAsOld) return { error: "New password must be different from the current one" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return { success: true };
}

/**
 * Updates the current user's email address.
 *
 * Note: emails are unique per-tenant (@@unique([tenantId, email]) in
 * the schema), not globally — so we only need to check for a
 * collision within the same tenant, and the lookup at login time
 * already scopes by tenantId.
 */
export async function updateEmail(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPasswordForEmail") ?? "");

  if (!newEmail || !currentPassword) {
    return { error: "Email and current password are required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return { error: "Enter a valid email address" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  if (newEmail === user.email.toLowerCase()) {
    return { error: "That's already your current email" };
  }

  // Check for a collision within the SAME tenant only
  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: user.tenantId, email: newEmail } },
  });
  if (existing) {
    return { error: "That email is already in use" };
  }

  await prisma.user.update({ where: { id: user.id }, data: { email: newEmail } });

  revalidatePath("/dashboard/settings");

  // The session's email is now stale (it was baked into the JWT at
  // login). Sign out so the next login picks up the new email —
  // simplest and safest way to keep the JWT in sync without a
  // refresh-token dance.
  await signOut({ redirectTo: "/login?emailUpdated=1" });
}
