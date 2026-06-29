"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperAdminSession, IMPERSONATION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Sets which tenant's data the Super Admin views in /dashboard.
 * Only callable by SUPER_ADMIN sessions.
 */
export async function setViewAsTenant(tenantId: string) {
  await requireSuperAdminSession();

  // Verify the tenant exists before setting the cookie
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return;

  cookies().set(IMPERSONATION_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  redirect("/dashboard");
}

/**
 * Clears the "view as tenant" override, returning Super Admin
 * to the platform-wide /admin area.
 */
export async function clearViewAsTenant() {
  await requireSuperAdminSession();
  cookies().delete(IMPERSONATION_COOKIE);
  redirect("/admin");
}
