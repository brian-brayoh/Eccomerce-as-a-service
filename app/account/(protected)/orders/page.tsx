import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
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

export default async function OrderHistoryPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Order history</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm text-gray-400 mb-2">You haven't placed any orders yet.</p>
          <Link href="/products" className="text-sm font-medium text-brand-500 hover:underline">Browse products →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
            return (
              <div key={order.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                    {order.status}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 border-t border-gray-50">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                      <span className="text-gray-600">{fmt(item.unitPrice.toNumber() * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{fmt(order.total.toNumber())}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
