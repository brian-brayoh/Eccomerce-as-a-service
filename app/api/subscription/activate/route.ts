import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, plan } = await request.json();

  // Verify the user belongs to this tenant or is SUPER_ADMIN
  if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId !== tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const subscriptionEndsAt = new Date(now);
  subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan: plan as any,
      planStatus: "ACTIVE",
      subscriptionEndsAt,
    } as any,
  });

  await prisma.subscriptionEvent.create({
    data: {
      tenantId,
      plan: plan as any,
      amount: 0,
      status: "paid",
      periodStart: now,
      periodEnd: subscriptionEndsAt,
    },
  });

  return NextResponse.json({ success: true });
}
