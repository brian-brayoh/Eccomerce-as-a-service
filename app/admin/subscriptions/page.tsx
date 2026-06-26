import { prisma } from "@/lib/prisma";
import PlanControl from "./PlanControl";

const PLAN_PRICES: Record<string, string> = {
  STARTER: "Free",
  BUSINESS: "KES 2,500/mo",
  ENTERPRISE: "KES 8,000/mo",
};

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function SubscriptionsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptionEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const mrr = tenants.reduce((sum, t) => {
    const price = t.plan === "BUSINESS" ? 2500 : t.plan === "ENTERPRISE" ? 8000 : 0;
    return t.planStatus === "ACTIVE" ? sum + price : sum;
  }, 0);

  const planCounts = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Subscriptions</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">MRR</p>
            <p className="mt-1.5 text-xl font-semibold text-brand-600">{fmt(mrr)}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total tenants</p>
            <p className="mt-1.5 text-xl font-semibold text-gray-900">{tenants.length}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">On Business</p>
            <p className="mt-1.5 text-xl font-semibold text-gray-900">{planCounts.BUSINESS ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">On Enterprise</p>
            <p className="mt-1.5 text-xl font-semibold text-gray-900">{planCounts.ENTERPRISE ?? 0}</p>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Last billing event</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => {
                const lastEvent = t.subscriptionEvents[0];
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
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
                    <td className="px-4 py-3 text-gray-600">{PLAN_PRICES[t.plan]}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lastEvent
                        ? `${fmt(lastEvent.amount.toNumber())} · ${lastEvent.createdAt.toLocaleDateString("en-KE")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PlanControl tenantId={t.id} currentPlan={t.plan} currentStatus={t.planStatus} />
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
