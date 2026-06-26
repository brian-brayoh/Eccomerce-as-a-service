"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createTenant(formData: FormData) {
  await requireSuperAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") ?? "").trim();
  const customDomain = String(formData.get("customDomain") ?? "").trim().toLowerCase() || null;
  const plan = String(formData.get("plan") ?? "STARTER");
  const trialDays = parseInt(String(formData.get("trialDays") ?? "14"), 10) || 14;

  if (!name || !adminName || !adminEmail || !adminPassword) {
    return { error: "All fields are required" };
  }
  if (adminPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Auto-generate slug from business name
  let slug = slugify(name);
  // Ensure slug is unique
  let counter = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${slugify(name)}-${counter}`;
    counter++;
  }

  // Validate custom domain if provided
  if (customDomain) {
    const existing = await prisma.tenant.findUnique({ where: { customDomain } });
    if (existing) return { error: "This domain is already in use" };
  }

  // Set trial expiry
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      customDomain,
      plan: plan as any,
      planStatus: "TRIALING",
      trialEndsAt,
    },
  });

  // Create the tenant admin user
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Log as a subscription event
  await prisma.subscriptionEvent.create({
    data: {
      tenantId: tenant.id,
      plan: plan as any,
      amount: 0,
      status: "pending",
      periodStart: new Date(),
      periodEnd: trialEndsAt,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");
  redirect("/admin");
}
