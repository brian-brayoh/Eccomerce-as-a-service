"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // terminal
  CANCELLED: [], // terminal
};

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { tenant } = await requireTenantSession();

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.id },
  });
  if (!order) return { error: "Order not found" };

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot move from ${order.status} to ${newStatus}` };
  }

  // If cancelling an order that was never delivered, restock the items
  if (newStatus === "CANCELLED" && order.status !== "DELIVERED") {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    await prisma.$transaction([
      ...items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      ),
      prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
    ]);
  } else {
    await prisma.order.update({ where: { id: orderId }, data: { status: newStatus as any } });
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { success: true };
}

export async function updatePaymentStatus(paymentId: string, status: "SUCCESS" | "FAILED") {
  const { tenant } = await requireTenantSession();

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, order: { tenantId: tenant.id } },
    include: { order: true },
  });
  if (!payment) return { error: "Payment not found" };

  await prisma.payment.update({ where: { id: paymentId }, data: { status } });

  // Marking a payment as successful while the order is still PENDING
  // automatically advances the order to PAID.
  if (status === "SUCCESS" && payment.order.status === "PENDING") {
    await prisma.order.update({ where: { id: payment.order.id }, data: { status: "PAID" } });
  }

  revalidatePath(`/dashboard/orders/${payment.order.id}`);
  return { success: true };
}
