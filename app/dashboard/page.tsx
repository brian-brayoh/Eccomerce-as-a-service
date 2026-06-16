import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const { tenant } = await requireTenantSession();

  // All queries scoped by tenant.id — this is the pattern every
  // dashboard page must follow.
  const [productCount, orderCount, customerCount, lowStockCount] = await Promise.all([
    prisma.product.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({ where: { tenantId: tenant.id } }),
    prisma.customer.count({ where: { tenantId: tenant.id } }),
    prisma.product.count({ where: { tenantId: tenant.id, stock: { lte: 5 } } }),
  ]);

  const revenueResult = await prisma.order.aggregate({
    where: { tenantId: tenant.id, status: { in: ["PAID", "DELIVERED"] } },
    _sum: { total: true },
  });
  const revenue = revenueResult._sum.total?.toNumber() ?? 0;

  const stats = [
    { label: "Total Products", value: productCount, color: "text-gray-900" },
    { label: "Total Orders", value: orderCount, color: "text-gray-900" },
    { label: "Revenue", value: `KES ${revenue.toLocaleString("en-KE")}`, color: "text-brand-600" },
    { label: "Customers", value: customerCount, color: "text-gray-900" },
  ];

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
              <p className={`mt-1.5 text-xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {lowStockCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              ⚠ {lowStockCount} product{lowStockCount > 1 ? "s" : ""} running low on stock (5 or fewer units left)
            </p>
          </div>
        )}

        {productCount === 0 && (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-500 mb-2">No products yet.</p>
            <p className="text-xs text-gray-400">Add your first product to start selling.</p>
          </div>
        )}
      </div>
    </div>
  );
}
