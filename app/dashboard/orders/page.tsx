import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import Link from "next/link";

const STATUS_TABS = ["ALL", "PENDING", "PAID", "PROCESSING", "DELIVERED", "CANCELLED"] as const;

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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { tenant } = await requireTenantSession();

  const activeStatus = searchParams.status?.toUpperCase() ?? "ALL";

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        ...(activeStatus !== "ALL" ? { status: activeStatus as any } : {}),
      },
      include: {
        customer: { select: { name: true, email: true } },
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { tenantId: tenant.id },
      _count: true,
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const totalCount = counts.reduce((s, c) => s + c._count, 0);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Orders</h1>
      </div>

      <div className="p-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
            const count = tab === "ALL" ? totalCount : countMap[tab] ?? 0;
            const active = activeStatus === tab;
            return (
              <Link
                key={tab}
                href={tab === "ALL" ? "/dashboard/orders" : `/dashboard/orders?status=${tab}`}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab} {count > 0 && <span className="opacity-70">({count})</span>}
              </Link>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-400">No orders {activeStatus !== "ALL" ? `with status "${activeStatus}"` : "yet"}.</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const st = STATUS_STYLES[order.status];
                  const payment = order.payments[0];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-brand-600 hover:underline">
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                        {order.channel === "WHATSAPP" && (
                          <span className="ml-1.5 text-xs text-green-600">WA</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.customer?.name ?? order.guestName ?? "—"}
                        {!order.customer && <span className="ml-1 text-xs text-gray-400">(guest)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {payment ? (
                          <span className={payment.status === "SUCCESS" ? "text-brand-600" : payment.status === "FAILED" ? "text-danger-500" : "text-gray-500"}>
                            {payment.method.replace("_", " ")} · {payment.status}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(order.total.toNumber())}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
