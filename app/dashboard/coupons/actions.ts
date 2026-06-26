"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function validateCoupon(code: string, subtotal: number) {
  const tenant = await getCurrentTenantOrThrow();
  const now = new Date();

  const coupon = await prisma.coupon.findFirst({
    where: {
      tenantId: tenant.id,
      code: code.trim().toUpperCase(),
      active: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
  });

  if (!coupon) return { error: "Invalid or expired coupon code" };

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { error: "This coupon has reached its usage limit" };
  }

  const discountValue = coupon.discountValue.toNumber();
  const discount =
    coupon.discountType === "PERCENTAGE"
      ? Math.min((subtotal * discountValue) / 100, subtotal)
      : Math.min(discountValue, subtotal);

  return {
    success: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue,
    discount: Math.round(discount * 100) / 100,
  };
}

// Admin: create a coupon
export async function createCoupon(formData: FormData) {
  const { tenant } = await requireTenantSession();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") ?? "PERCENTAGE");
  const discountValue = parseFloat(String(formData.get("discountValue") ?? "0"));
  const maxUses = parseInt(String(formData.get("maxUses") ?? ""), 10) || null;
  const startDate = String(formData.get("startDate") ?? "") || null;
  const endDate = String(formData.get("endDate") ?? "") || null;

  if (!code) return { error: "Coupon code is required" };
  if (!discountValue || discountValue <= 0) return { error: "Discount value must be greater than 0" };
  if (discountType === "PERCENTAGE" && discountValue > 100) return { error: "Percentage discount cannot exceed 100%" };

  const existing = await prisma.coupon.findFirst({ where: { tenantId: tenant.id, code } });
  if (existing) return { error: "A coupon with this code already exists" };

  await prisma.coupon.create({
    data: {
      tenantId: tenant.id,
      code,
      discountType: discountType as any,
      discountValue,
      maxUses,
      active: true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/dashboard/coupons");
  return { success: true };
}

export async function toggleCoupon(id: string, active: boolean) {
  const { tenant } = await requireTenantSession();
  await prisma.coupon.updateMany({ where: { id, tenantId: tenant.id }, data: { active } });
  revalidatePath("/dashboard/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const { tenant } = await requireTenantSession();
  await prisma.coupon.deleteMany({ where: { id, tenantId: tenant.id } });
  revalidatePath("/dashboard/coupons");
  return { success: true };
}
