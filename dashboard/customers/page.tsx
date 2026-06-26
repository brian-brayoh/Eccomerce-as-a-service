import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const { tenant } = await requireTenantSession();

  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const perPage = 20;

  const where = {
    tenantId: tenant.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, total: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Customers</h1>
      </div>

      <div className="p-6 space-y-4">
        {/* Search */}
        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or phone…"
            className="flex-1 max-w-sm"
          />
          <button type="submit" className="btn-primary px-4">Search</button>
          {q && (
            <Link href="/dashboard/customers" className="flex items-center text-sm text-gray-400 hover:text-gray-600">
              Clear
            </Link>
          )}
        </form>

        <p className="text-xs text-gray-400">{total} customer{total !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""}</p>

        {customers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-400">{q ? "No customers match your search." : "No customers yet."}</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Phone</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Last order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-2.5 group">
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-brand-600">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email ?? "No email"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{c._count.orders}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {c.orders[0]
                        ? `${c.orders[0].createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short" })} · KES ${c.orders[0].total.toNumber().toLocaleString("en-KE")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/dashboard/customers?page=${page - 1}${q ? `&q=${q}` : ""}`} className="btn-primary py-1.5 px-3 text-xs">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard/customers?page=${page + 1}${q ? `&q=${q}` : ""}`} className="btn-primary py-1.5 px-3 text-xs">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
