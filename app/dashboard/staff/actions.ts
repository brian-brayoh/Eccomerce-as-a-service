"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Only ADMIN and SUPER_ADMIN can manage staff — a STAFF member cannot
 * add, edit, or remove other users.
 */
async function requireAdminSession() {
  const { tenant, session } = await requireTenantSession();
  if (session.user.role === "STAFF") {
    return { error: "Only admins can manage staff accounts" } as never;
  }
  return { tenant, session };
}

export async function inviteStaff(formData: FormData) {
  const { tenant, session } = await requireTenantSession();
  if (session.user.role === "STAFF") return { error: "Only admins can add staff" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF") as "ADMIN" | "STAFF";
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !password) return { error: "Name, email, and password are required" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  // Admins can only create STAFF — only SUPER_ADMIN can create another ADMIN
  if (role === "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Only the platform owner can assign Admin role" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { error: "Enter a valid email address" };

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (existing) return { error: "A staff account with this email already exists" };

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function updateStaffRole(userId: string, role: "ADMIN" | "STAFF") {
  const { tenant, session } = await requireTenantSession();
  if (session.user.role === "STAFF") return { error: "Only admins can change roles" };

  // Prevent changing the role of a SUPER_ADMIN — those are managed separately
  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
  });
  if (!target) return { error: "Staff member not found" };
  if (target.role === "SUPER_ADMIN") return { error: "Cannot change a Super Admin's role" };

  // ADMIN can't promote to ADMIN — only SUPER_ADMIN can
  if (role === "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Only the platform owner can assign Admin role" };
  }

  // Prevent demoting yourself
  if (userId === session.user.id) {
    return { error: "You cannot change your own role" };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function resetStaffPassword(userId: string, formData: FormData) {
  const { tenant, session } = await requireTenantSession();
  if (session.user.role === "STAFF") return { error: "Only admins can reset passwords" };

  const newPassword = String(formData.get("newPassword") ?? "").trim();
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters" };

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
  });
  if (!target) return { error: "Staff member not found" };
  if (target.role === "SUPER_ADMIN") return { error: "Cannot reset a Super Admin's password here" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function removeStaff(userId: string) {
  const { tenant, session } = await requireTenantSession();
  if (session.user.role === "STAFF") return { error: "Only admins can remove staff" };
  if (userId === session.user.id) return { error: "You cannot remove your own account" };

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
  });
  if (!target) return { error: "Staff member not found" };
  if (target.role === "SUPER_ADMIN") return { error: "Cannot remove a Super Admin" };

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/staff");
  return { success: true };
}
