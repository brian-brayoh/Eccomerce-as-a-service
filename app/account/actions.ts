"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { createCustomerSession, clearCustomerSession } from "@/lib/customer-session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function customerSignup(formData: FormData) {
  const tenant = await getCurrentTenantOrThrow();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Enter a valid email address" };
  }

  // Email is unique per tenant (a customer of PrintCare and a
  // customer of ABC Electronics can share the same email address)
  const existing = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (existing) {
    return { error: "An account with this email already exists. Try signing in instead." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const customer = await prisma.customer.create({
    data: { tenantId: tenant.id, name, email, phone, password: hashedPassword },
  });

  await createCustomerSession({
    customerId: customer.id,
    tenantId: tenant.id,
    name: customer.name,
    email: customer.email,
  });

  redirect("/account");
}

export async function customerLogin(formData: FormData) {
  const tenant = await getCurrentTenantOrThrow();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const customer = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });

  if (!customer || !customer.password) {
    return { error: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(password, customer.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createCustomerSession({
    customerId: customer.id,
    tenantId: tenant.id,
    name: customer.name,
    email: customer.email,
  });

  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");
  redirect(callbackUrl);
}

export async function customerLogout() {
  await clearCustomerSession();
  redirect("/");
}
