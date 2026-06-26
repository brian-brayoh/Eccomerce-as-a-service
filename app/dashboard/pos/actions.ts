"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { initiateStkPush, normalizeMpesaPhone } from "@/lib/mpesa";

export async function searchProducts(query: string) {
  const { tenant } = await requireTenantSession();

  return prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      stock: { gt: 0 },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    take: 10,
    orderBy: { name: "asc" },
  });
}

export async function placePosOrder(formData: FormData) {
  const { tenant, session } = await requireTenantSession();

  const itemsJson = String(formData.get("items") ?? "[]");
  const customerName = String(formData.get("customerName") ?? "").trim() || "Walk-in customer";
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH_ON_DELIVERY");
  const mpesaPhone = String(formData.get("mpesaPhone") ?? "").trim() || customerPhone;
  const couponCode = String(formData.get("couponCode") ?? "").trim().toUpperCase() || null;

  let items: { productId: string; quantity: number }[] = [];
  try { items = JSON.parse(itemsJson); } catch { return { error: "Invalid cart data" }; }
  if (items.length === 0) return { error: "Cart is empty" };

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, tenantId: tenant.id, status: "ACTIVE" },
  });

  const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number }[] = [];
  let subtotal = 0;

  for (const cartItem of items) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) continue;
    if (product.stock < cartItem.quantity) {
      return { error: `Only ${product.stock} unit(s) of "${product.name}" in stock` };
    }
    const unitPrice = product.salePrice?.toNumber() ?? product.price.toNumber();
    orderItemsData.push({ productId: product.id, productName: product.name, unitPrice, quantity: cartItem.quantity });
    subtotal += unitPrice * cartItem.quantity;
  }

  if (orderItemsData.length === 0) return { error: "No valid items found" };

  // Apply coupon if provided
  let discount = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const now = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: { tenantId: tenant.id, code: couponCode, active: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
    });
    if (coupon) {
      couponId = coupon.id;
      discount = coupon.discountType === "PERCENTAGE"
        ? Math.min((subtotal * coupon.discountValue.toNumber()) / 100, subtotal)
        : Math.min(coupon.discountValue.toNumber(), subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId: tenant.id,
        guestName: customerName,
        guestPhone: customerPhone,
        status: "PENDING",
        channel: "IN_STORE",
        subtotal,
        discount,
        total,
        shippingName: customerName,
        shippingPhone: customerPhone ?? "",
        items: { create: orderItemsData.map((i) => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity })) },
        payments: { create: { method: paymentMethod === "MPESA" ? "MPESA" : "CASH_ON_DELIVERY", amount: total, status: "PENDING" } },
      },
      include: { payments: true },
    });

    for (const item of orderItemsData) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
    }

    return created;
  });

  if (couponId) {
    await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  }

  // Cash — mark order as PAID immediately
  if (paymentMethod !== "MPESA") {
    await prisma.$transaction([
      prisma.payment.updateMany({ where: { orderId: order.id }, data: { status: "SUCCESS" } }),
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    ]);
    return { success: true, orderId: order.id, mpesaPending: false };
  }

  // M-Pesa — trigger STK Push directly here (POS staff stays on the
  // screen waiting, so we can do it synchronously, unlike web checkout
  // where we don't want the customer's browser to hang)
  const tenantData = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  if (!tenantData?.mpesaEnabled || !tenantData.mpesaConsumerKey) {
    return { error: "M-Pesa is not set up. Use Cash instead." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";
  const stkResult = await initiateStkPush({
    config: {
      mpesaShortcode: tenantData.mpesaShortcode!,
      mpesaConsumerKey: tenantData.mpesaConsumerKey!,
      mpesaConsumerSecret: tenantData.mpesaConsumerSecret!,
      mpesaPasskey: tenantData.mpesaPasskey!,
      mpesaEnvironment: tenantData.mpesaEnvironment,
    },
    phone: mpesaPhone!,
    amount: total,
    accountReference: order.id.slice(-10),
    description: `Order ${order.id.slice(-6)}`,
    callbackUrl: `${appUrl}/api/mpesa/callback`,
  });

  if (!stkResult.success) {
    return { error: `M-Pesa failed: ${stkResult.error}. Try cash payment.` };
  }

  const payment = order.payments[0];
  if (payment && stkResult.checkoutRequestId) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { provider: "mpesa", providerRef: stkResult.checkoutRequestId },
    });
  }

  return { success: true, orderId: order.id, mpesaPending: true, checkoutRequestId: stkResult.checkoutRequestId };
}
