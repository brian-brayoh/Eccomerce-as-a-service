import { prisma } from "@/lib/prisma";
import { setViewAsTenant } from "@/app/dashboard/tenant-actions";

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true, customers: true } },
    },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Tenants</h1>
      </div>

      <div className="p-6">
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Products</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Customers</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.customDomain ?? `${t.slug}.yourplatform.com`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{t.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.planStatus === "ACTIVE" ? "bg-green-50 text-green-700" :
                      t.planStatus === "TRIALING" ? "bg-blue-50 text-blue-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {t.planStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{t._count.products}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{t._count.orders}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{t._count.customers}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={setViewAsTenant.bind(null, t.id)}>
                      <button type="submit" className="text-xs font-medium text-brand-500 hover:underline">
                        Manage →
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
