import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderStatusControl from "./OrderStatusControl";
import PaymentStatusControl from "./PaymentStatusControl";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { tenant } = await requireTenantSession();

  const order = await prisma.order.findFirst({
    where: { id: params.id, tenantId: tenant.id },
    include: {
      customer: true,
      items: { include: { product: { select: { slug: true, images: { take: 1, orderBy: { position: "asc" } } } } } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const isGuest = !order.customer;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <div>
          <Link href="/dashboard/orders" className="text-xs text-gray-400 hover:text-gray-600">← All orders</Link>
          <h1 className="text-sm font-semibold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h1>
        </div>
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Items ({order.items.length})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-50 overflow-hidden">
                    {item.product?.images[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    {item.product ? (
                      <Link href={`/products/${item.product.slug}`} target="_blank" className="text-sm font-medium text-gray-900 hover:text-brand-600">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{item.productName} <span className="text-xs text-gray-400">(deleted)</span></p>
                    )}
                    <p className="text-xs text-gray-400">{fmt(item.unitPrice.toNumber())} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{fmt(item.unitPrice.toNumber() * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(order.subtotal.toNumber())}</span>
              </div>
              {order.discount.toNumber() > 0 && (
                <div className="flex justify-between text-sm text-danger-500">
                  <span>Discount</span>
                  <span>-{fmt(order.discount.toNumber())}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-50">
                <span>Total</span>
                <span>{fmt(order.total.toNumber())}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Payment</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payment record.</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.method.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{fmt(p.amount.toNumber())} · {p.createdAt.toLocaleDateString()}</p>
                    </div>
                    <PaymentStatusControl paymentId={p.id} currentStatus={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Customer info */}
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
              {isGuest ? "Guest customer" : "Customer"}
            </h2>
            <p className="text-sm font-medium text-gray-900">{order.customer?.name ?? order.guestName}</p>
            {(order.customer?.email ?? order.guestEmail) && (
              <p className="text-xs text-gray-500 mt-0.5">{order.customer?.email ?? order.guestEmail}</p>
            )}
            <p className="text-xs text-gray-500">{order.customer?.phone ?? order.guestPhone}</p>
          </div>

          {/* Shipping */}
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Delivery to</h2>
            <p className="text-sm text-gray-800">{order.shippingName}</p>
            <p className="text-sm text-gray-500">{order.shippingPhone}</p>
            <p className="text-sm text-gray-500 mt-1">
              {[order.shippingStreet, order.shippingTown, order.shippingCounty].filter(Boolean).join(", ") || "No address provided"}
            </p>
          </div>

          {/* Meta */}
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Order info</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Channel</span><span className="text-gray-800">{order.channel}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Placed</span><span className="text-gray-800">{order.createdAt.toLocaleString("en-KE")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Updated</span><span className="text-gray-800">{order.updatedAt.toLocaleString("en-KE")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
