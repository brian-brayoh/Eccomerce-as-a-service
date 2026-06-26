import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AccountOverviewPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null; // layout already redirects, this satisfies TS

  const [orderCount, wishlistCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.wishlistItem.count({ where: { customerId: customer.id } }),
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">My account</h1>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/account/orders" className="card hover:border-brand-200 transition">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Orders</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{orderCount}</p>
        </Link>
        <Link href="/account/wishlist" className="card hover:border-brand-200 transition">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Wishlist</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{wishlistCount}</p>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400">
            No orders yet. <Link href="/products" className="text-brand-500 hover:underline">Start shopping →</Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""} · {order.createdAt.toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-medium text-gray-900">KES {order.total.toNumber().toLocaleString("en-KE")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
