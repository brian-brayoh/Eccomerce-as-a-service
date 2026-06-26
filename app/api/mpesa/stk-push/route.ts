import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { initiateStkPush } from "@/lib/mpesa";

/**
 * Initiates an STK Push for a given pending order.
 *
 * Called from the checkout flow after the Order + Payment rows
 * already exist (created with status PENDING and method MPESA).
 * This route just triggers the actual push to the customer's phone
 * and stores the CheckoutRequestID on the Payment row so the
 * callback (app/api/mpesa/callback/route.ts) can match it later.
 */
export async function POST(request: Request) {
  const tenant = await getCurrentTenantOrThrow();
  const { orderId, phone } = await request.json();

  if (!orderId || !phone) {
    return NextResponse.json({ error: "orderId and phone are required" }, { status: 400 });
  }

  if (!tenant.mpesaEnabled || !tenant.mpesaShortcode || !tenant.mpesaConsumerKey || !tenant.mpesaConsumerSecret || !tenant.mpesaPasskey) {
    return NextResponse.json({ error: "M-Pesa is not configured for this store" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payment = order.payments[0];
  if (!payment || payment.method !== "MPESA") {
    return NextResponse.json({ error: "No M-Pesa payment record on this order" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get("host")}`;
  const callbackUrl = `${appUrl}/api/mpesa/callback`;

  const result = await initiateStkPush({
    config: {
      mpesaShortcode: tenant.mpesaShortcode,
      mpesaConsumerKey: tenant.mpesaConsumerKey,
      mpesaConsumerSecret: tenant.mpesaConsumerSecret,
      mpesaPasskey: tenant.mpesaPasskey,
      mpesaEnvironment: tenant.mpesaEnvironment,
    },
    phone,
    amount: order.total.toNumber(),
    accountReference: order.id.slice(-8).toUpperCase(),
    description: `Order ${order.id.slice(-6).toUpperCase()}`,
    callbackUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Failed to initiate payment" }, { status: 502 });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerRef: result.checkoutRequestId, provider: "mpesa" },
  });

  return NextResponse.json({
    success: true,
    checkoutRequestId: result.checkoutRequestId,
  });
}
