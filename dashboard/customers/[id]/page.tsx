import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: "#FEF3C7", text: "#92400E" },
  PAID:       { bg: "#E1F5EE", text: "#0F6E56" },
  PROCESSING: { bg: "#E6F1FB", text: "#185FA5" },
  DELIVERED:  { bg: "#E1F5EE", text: "#0F6E56" },
  CANCELLED:  { bg: "#FAECE7", text: "#993C1D" },
};

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { tenant } = await requireTenantSession();

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId: tenant.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: { take: 1 } },
      },
      wishlist: {
        include: { product: { select: { name: true, slug: true } } },
        take: 5,
      },
      _count: { select: { orders: true, wishlist: true } },
    },
  });

  if (!customer) notFound();

  const totalSpend = customer.orders
    .filter((o) => ["PAID", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + o.total.toNumber(), 0);

  const avgOrderValue = customer._count.orders > 0
    ? totalSpend / customer.orders.filter((o) => ["PAID", "DELIVERED"].includes(o.status)).length || 0
    : 0;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-3.5">
        <Link href="/dashboard/customers" className="text-xs text-gray-400 hover:text-gray-600">← Customers</Link>
        <h1 className="text-sm font-semibold text-gray-900">{customer.name}</h1>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Order history */}
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Order history ({customer._count.orders})
              </span>
            </div>
            {customer.orders.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center text-gray-400">No orders yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {customer.orders.map((order) => {
                  const st = STATUS_STYLES[order.status];
                  const payment = order.payments[0];
                  return (
                    <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/dashboard/orders/${order.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                            #{order.id.slice(-6).toUpperCase()}
                          </Link>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: st.bg, color: st.text }}>
                            {order.status}
                          </span>
                          {payment && (
                            <span className="text-[10px] text-gray-400">{payment.method.replace("_", " ")}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                          {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                        {fmt(order.total.toNumber())}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wishlist */}
          {customer.wishlist.length > 0 && (
            <div className="card">
              <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
                Wishlist ({customer._count.wishlist})
              </h2>
              <div className="space-y-1.5">
                {customer.wishlist.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{w.product.name}</span>
                    <Link href={`/products/${w.product.slug}`} target="_blank" className="text-xs text-brand-500 hover:underline">
                      View →
                    </Link>
                  </div>
                ))}
                {customer._count.wishlist > 5 && (
                  <p className="text-xs text-gray-400">+{customer._count.wishlist - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — customer info + stats */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Customer info</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-lg font-bold text-brand-600">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-400">
                  Customer since {customer.createdAt.toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.phone}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Lifetime value</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total orders</span>
                <span className="font-medium text-gray-900">{customer._count.orders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total spend</span>
                <span className="font-semibold text-brand-600">{fmt(totalSpend)}</span>
              </div>
              {avgOrderValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg. order value</span>
                  <span className="font-medium text-gray-900">{fmt(avgOrderValue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
