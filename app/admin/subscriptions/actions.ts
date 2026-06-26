"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const PLAN_PRICES: Record<string, number> = {
  STARTER: 0,
  BUSINESS: 2500,
  ENTERPRISE: 8000,
};

export async function updateTenantPlan(tenantId: string, formData: FormData) {
  await requireSuperAdminSession();

  const plan = String(formData.get("plan") ?? "STARTER");
  const planStatus = String(formData.get("planStatus") ?? "ACTIVE");

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Tenant not found" };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: plan as any, planStatus: planStatus as any },
  });

  // Log the change as a billing event if the plan actually changed —
  // this keeps SubscriptionEvent as an audit trail of plan history,
  // not just payment records.
  if (tenant.plan !== plan) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscriptionEvent.create({
      data: {
        tenantId,
        plan: plan as any,
        amount: PLAN_PRICES[plan] ?? 0,
        status: "paid", // manual admin change — assumed settled outside the system
        periodStart: now,
        periodEnd,
      },
    });
  }

  revalidatePath("/admin/subscriptions");
  return { success: true };
}
