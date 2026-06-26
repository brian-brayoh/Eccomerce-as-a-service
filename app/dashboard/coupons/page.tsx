import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import CouponForm from "./CouponForm";
import CouponRow from "./CouponRow";

export default async function CouponsPage() {
  const { tenant } = await requireTenantSession();

  const coupons = await prisma.coupon.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Coupons</h1>
      </div>

      <div className="p-6 space-y-5">
        <div className="card">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Create coupon</h2>
          <CouponForm />
        </div>

        {coupons.length === 0 ? (
          <p className="text-sm text-gray-400 pl-1">No coupons yet.</p>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Validity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <CouponRow
                    key={c.id}
                    coupon={{
                      id: c.id,
                      code: c.code,
                      discountType: c.discountType,
                      discountValue: c.discountValue.toNumber(),
                      maxUses: c.maxUses,
                      usedCount: c.usedCount,
                      active: c.active,
                      startDate: c.startDate?.toISOString().slice(0, 10) ?? null,
                      endDate: c.endDate?.toISOString().slice(0, 10) ?? null,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
