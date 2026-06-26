import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";

/**
 * Polled by the checkout page's "Waiting for M-Pesa..." screen to
 * find out whether the callback has landed yet. The actual status
 * update happens in app/api/mpesa/callback/route.ts — this endpoint
 * only reads the current state, it never changes anything.
 */
export async function GET(request: Request) {
  const tenant = await getCurrentTenantOrThrow();
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payment = order.payments[0];

  return NextResponse.json({
    orderStatus: order.status,
    paymentStatus: payment?.status ?? "PENDING",
    mpesaReceipt: payment?.mpesaReceipt ?? null,
  });
}
