import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const { tenant } = await requireTenantSession();

  const range = searchParams.range ?? "30";
  const days = parseInt(range, 10) || 30;

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);

  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - days);

  // ── Core metrics ────────────────────────────────────────
  const [
    allOrders,
    prevOrders,
    orderItems,
    allCustomers,
    newCustomers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: from },
        status: { in: ["PAID", "PROCESSING", "DELIVERED"] },
      },
      select: { id: true, total: true, createdAt: true, status: true, channel: true },
    }),
    prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: prevFrom, lt: from },
        status: { in: ["PAID", "PROCESSING", "DELIVERED"] },
      },
      select: { total: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          tenantId: tenant.id,
          createdAt: { gte: from },
          status: { in: ["PAID", "PROCESSING", "DELIVERED"] },
        },
      },
      select: { productId: true, productName: true, quantity: true, unitPrice: true },
    }),
    prisma.customer.count({ where: { tenantId: tenant.id } }),
    prisma.customer.count({ where: { tenantId: tenant.id, createdAt: { gte: from } } }),
  ]);

  // ── Revenue over time (daily buckets) ───────────────────
  const revenueByDay: Record<string, number> = {};
  const ordersCountByDay: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    revenueByDay[key] = 0;
    ordersCountByDay[key] = 0;
  }

  for (const order of allOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (key in revenueByDay) {
      revenueByDay[key] += order.total.toNumber();
      ordersCountByDay[key] = (ordersCountByDay[key] ?? 0) + 1;
    }
  }

  const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue),
    orders: ordersCountByDay[date] ?? 0,
  }));

  // ── Top products ────────────────────────────────────────
  const productMap: Record<string, { name: string; revenue: number; units: number }> = {};
  for (const item of orderItems) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { name: item.productName, revenue: 0, units: 0 };
    }
    productMap[item.productId].revenue += item.unitPrice.toNumber() * item.quantity;
    productMap[item.productId].units += item.quantity;
  }

  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ id, ...data, revenue: Math.round(data.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Peak hours ──────────────────────────────────────────
  const hourCounts: number[] = Array(24).fill(0);
  for (const order of allOrders) {
    const hour = new Date(order.createdAt).getHours();
    hourCounts[hour] += 1;
  }

  const peakHours = hourCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    count,
  }));

  // ── Order status breakdown ───────────────────────────────
  const allOrdersForStatus = await prisma.order.groupBy({
    by: ["status"],
    where: { tenantId: tenant.id, createdAt: { gte: from } },
    _count: true,
  });

  const statusBreakdown = allOrdersForStatus.map((s) => ({
    status: s.status,
    count: s._count,
  }));

  // ── Sales channel breakdown ──────────────────────────────
  const channelData = await prisma.order.groupBy({
    by: ["channel"],
    where: { tenantId: tenant.id, createdAt: { gte: from } },
    _count: true,
  });

  const channels = channelData.map((c) => ({
    channel: c.channel,
    count: c._count,
  }));

  // ── Summary stats ────────────────────────────────────────
  const totalRevenue = allOrders.reduce((s, o) => s + o.total.toNumber(), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total.toNumber(), 0);
  const revenueChange = prevRevenue > 0
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
    : null;

  const totalUnits = orderItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Analytics</h1>
        <div className="flex gap-1.5">
          {["7", "30", "90"].map((d) => (
            <a
              key={d}
              href={`?range=${d}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                range === d ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      <AnalyticsDashboard
        summary={{
          totalRevenue: Math.round(totalRevenue),
          revenueChange,
          totalOrders: allOrders.length,
          prevOrders: prevOrders.length,
          totalUnits,
          totalCustomers: allCustomers,
          newCustomers,
        }}
        dailyRevenue={dailyRevenue}
        topProducts={topProducts}
        peakHours={peakHours}
        statusBreakdown={statusBreakdown}
        channels={channels}
        days={days}
      />
    </div>
  );
}
