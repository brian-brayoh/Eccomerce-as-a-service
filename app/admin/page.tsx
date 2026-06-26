import { prisma } from "@/lib/prisma";
import { setViewAsTenant } from "@/app/dashboard/tenant-actions";
import Link from "next/link";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "yourplatform.com";

function daysUntil(date: Date | null) {
  if (!date) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true, customers: true } },
    },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Tenants</h1>
        <Link href="/admin/tenants/new" className="btn-primary text-xs py-1.5 px-3">
          + Add tenant
        </Link>
      </div>

      <div className="p-6">
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Domain</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Expiry</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Products</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => {
                const domain = (t as any).customDomain ?? `${t.slug}.${ROOT_DOMAIN}`;
                const expiryDate = (t as any).subscriptionEndsAt ?? (t as any).trialEndsAt ?? null;
                const daysLeft = daysUntil(expiryDate);
                const isExpired = daysLeft !== null && daysLeft <= 0;
                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">{domain}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{t.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        t.planStatus === "ACTIVE" ? "bg-green-50 text-green-700" :
                        t.planStatus === "TRIALING" ? "bg-blue-50 text-blue-700" :
                        t.planStatus === "PAST_DUE" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {t.planStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {expiryDate ? (
                        <span className={isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : "text-gray-400"}>
                          {isExpired ? "Expired" : `${daysLeft}d left`}
                          <span className="block text-gray-400 font-normal">
                            {new Date(expiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{t._count.products}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{t._count.orders}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/tenants/${t.id}`} className="text-xs text-gray-400 hover:text-gray-700">
                          Edit
                        </Link>
                        <form action={setViewAsTenant.bind(null, t.id)}>
                          <button type="submit" className="text-xs font-medium text-brand-500 hover:underline">
                            Manage →
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}