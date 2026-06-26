"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart, clearCart } from "@/lib/cart";
import { redirect } from "next/navigation";

export async function placeOrder(formData: FormData) {
  const tenant = await getCurrentTenantOrThrow();
  const customer = await getCurrentCustomer();

  const cartItems = getCart(tenant.id);
  if (cartItems.length === 0) {
    return { error: "Your cart is empty" };
  }

  const shippingName = String(formData.get("shippingName") ?? "").trim();
  const shippingPhone = String(formData.get("shippingPhone") ?? "").trim();
  const shippingCounty = String(formData.get("shippingCounty") ?? "").trim();
  const shippingTown = String(formData.get("shippingTown") ?? "").trim();
  const shippingStreet = String(formData.get("shippingStreet") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH_ON_DELIVERY");
  const mpesaPhone = String(formData.get("mpesaPhone") ?? "").trim() || shippingPhone;

  if (paymentMethod === "MPESA" && !mpesaPhone) {
    return { error: "M-Pesa phone number is required" };
  }

  // Guest checkout fields — only required if not logged in
  const guestName = !customer ? String(formData.get("guestName") ?? "").trim() : null;
  const guestPhone = !customer ? String(formData.get("guestPhone") ?? "").trim() : null;
  const guestEmail = !customer ? String(formData.get("guestEmail") ?? "").trim() || null : null;

  if (!shippingName || !shippingPhone) {
    return { error: "Name and phone number are required for delivery" };
  }
  if (!customer && (!guestName || !guestPhone)) {
    return { error: "Name and phone are required to place an order" };
  }

  if (paymentMethod === "MPESA") {
    const t = await prisma.tenant.findUnique({ where: { id: tenant.id } });
    if (!t?.mpesaEnabled || !t.mpesaShortcode || !t.mpesaConsumerKey || !t.mpesaConsumerSecret || !t.mpesaPasskey) {
      return { error: "M-Pesa is not yet set up for this store. Please choose Cash on Delivery." };
    }
  }

  // Re-fetch products server-side — never trust client-supplied prices.
  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((i) => i.productId) }, tenantId: tenant.id, status: "ACTIVE" },
  });

  const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number }[] = [];
  let subtotal = 0;

  for (const cartItem of cartItems) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) continue;
    if (product.stock < cartItem.quantity) {
      return { error: `Only ${product.stock} unit(s) of "${product.name}" left in stock. Please update your cart.` };
    }

    const unitPrice = product.salePrice?.toNumber() ?? product.price.toNumber();
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: cartItem.quantity,
    });
    subtotal += unitPrice * cartItem.quantity;
  }

  const couponId = String(formData.get("couponId") ?? "").trim() || null;
  const discountAmount = parseFloat(String(formData.get("discountAmount") ?? "0")) || 0;

  if (orderItemsData.length === 0) {
    return { error: "Items in your cart are no longer available" };
  }

  const total = Math.max(0, subtotal - discountAmount);

  // Create the order + decrement stock in a single transaction.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customer?.id ?? null,
        guestName,
        guestPhone,
        guestEmail,
        status: "PENDING",
        channel: "WEBSITE",
        subtotal,
        discount: discountAmount,
        total,
        shippingName,
        shippingPhone,
        shippingCounty: shippingCounty || null,
        shippingTown: shippingTown || null,
        shippingStreet: shippingStreet || null,
        items: {
          create: orderItemsData.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        },
        payments: {
          create: {
            method: paymentMethod === "MPESA" ? "MPESA" : "CASH_ON_DELIVERY",
            amount: subtotal,
            status: "PENDING",
          },
        },
      },
    });

    for (const item of orderItemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  // Increment coupon usage count if one was applied
  if (couponId) {
    await prisma.coupon.updateMany({
      where: { id: couponId, tenantId: tenant.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  clearCart(tenant.id);

  if (paymentMethod === "MPESA") {
    // Don't trigger STK Push here — redirect to the pending-payment
    // screen, which calls /api/mpesa/stk-push client-side and polls
    // /api/mpesa/status. Keeping this out of the server action means
    // the customer sees an immediate loading screen instead of the
    // whole checkout request hanging while waiting on Safaricom.
    redirect(`/checkout/mpesa-pending?order=${order.id}&phone=${encodeURIComponent(mpesaPhone)}`);
  }

  redirect(`/checkout/success?order=${order.id}`);
}
