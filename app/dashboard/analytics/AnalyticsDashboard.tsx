"use client";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  PAID: "#10B981",
  PROCESSING: "#3B82F6",
  DELIVERED: "#059669",
  CANCELLED: "#EF4444",
};

const CHANNEL_COLORS: Record<string, string> = {
  WEBSITE: "#6366F1",
  IN_STORE: "#F59E0B",
  WHATSAPP: "#10B981",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n.toLocaleString("en-KE")}`;
}

function pct(current: number, prev: number) {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

// ── Sparkline / area chart ───────────────────────────────
function AreaChart({ data, color = "#6366F1" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const w = 300; const h = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(" ");
  const area = `M0,${h} L${points.split(" ").map((p, i) => i === 0 ? `0,${p.split(",")[1]}` : p).join(" L")} L${w},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar chart ────────────────────────────────────────────
function BarChart({ data, color = "#6366F1", labelKey, valueKey, formatValue }: {
  data: Record<string, any>[];
  color?: string;
  labelKey: string;
  valueKey: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey])) || 1;
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-16 flex-shrink-0 text-gray-500 truncate text-right">{item[labelKey]}</span>
          <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item[valueKey] / max) * 100}%`, background: color }}
            />
          </div>
          <span className="w-20 flex-shrink-0 font-medium text-gray-700">
            {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ──────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const r = 40; const cx = 60; const cy = 60;

  const paths = slices.map((slice) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += slice.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = slice.value / total > 0.5 ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: slice.color };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-24 h-24 flex-shrink-0">
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={24} fill="white" />
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-medium text-gray-900 ml-auto pl-2">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  summary: {
    totalRevenue: number; revenueChange: number | null;
    totalOrders: number; prevOrders: number;
    totalUnits: number; totalCustomers: number; newCustomers: number;
  };
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; revenue: number; units: number }[];
  peakHours: { hour: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  channels: { channel: string; count: number }[];
  days: number;
};

export default function AnalyticsDashboard({
  summary, dailyRevenue, topProducts, peakHours, statusBreakdown, channels, days,
}: Props) {
  const orderChange = pct(summary.totalOrders, summary.prevOrders);
  const revenueValues = dailyRevenue.map((d) => d.revenue);
  const ordersValues = dailyRevenue.map((d) => d.orders);

  const peakHour = peakHours.reduce((best, h) => h.count > best.count ? h : best, { hour: "—", count: 0 });
  const topProduct = topProducts[0];

  // Status donut slices
  const statusSlices = statusBreakdown.map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#9CA3AF",
  }));

  // Channel donut slices
  const channelSlices = channels.map((c) => ({
    label: c.channel.replace("_", " "),
    value: c.count,
    color: CHANNEL_COLORS[c.channel] ?? "#9CA3AF",
  }));

  return (
    <div className="p-6 space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Revenue",
            value: fmt(summary.totalRevenue),
            change: summary.revenueChange,
            color: "text-brand-600",
            spark: revenueValues,
            sparkColor: "#6366F1",
          },
          {
            label: "Orders",
            value: summary.totalOrders,
            change: orderChange,
            color: "text-gray-900",
            spark: ordersValues,
            sparkColor: "#10B981",
          },
          {
            label: "Units sold",
            value: summary.totalUnits,
            change: null,
            color: "text-gray-900",
            spark: null,
            sparkColor: null,
          },
          {
            label: "New customers",
            value: summary.newCustomers,
            change: null,
            color: "text-gray-900",
            spark: null,
            sparkColor: null,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card overflow-hidden">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            {kpi.change !== null && kpi.change !== undefined && (
              <p className={`text-xs mt-0.5 font-medium ${kpi.change >= 0 ? "text-green-600" : "text-danger-500"}`}>
                {kpi.change >= 0 ? "▲" : "▼"} {Math.abs(kpi.change)}% vs prev {days}d
              </p>
            )}
            {kpi.spark && kpi.spark.length > 1 && (
              <div className="mt-2 -mx-1">
                <AreaChart data={kpi.spark} color={kpi.sparkColor!} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Daily revenue</h2>
          <span className="text-xs text-gray-400">Last {days} days</span>
        </div>
        <div className="h-40">
          {(() => {
            const data = dailyRevenue;
            const max = Math.max(...data.map((d) => d.revenue)) || 1;
            const w = 600; const h = 140;
            const barW = Math.max(2, (w / data.length) - 2);

            return (
              <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((frac) => (
                  <line
                    key={frac}
                    x1="0" y1={h - frac * h}
                    x2={w} y2={h - frac * h}
                    stroke="#F3F4F6" strokeWidth="1"
                  />
                ))}
                {/* Bars */}
                {data.map((d, i) => {
                  const barH = Math.max(2, (d.revenue / max) * h);
                  const x = (i / data.length) * w;
                  return (
                    <g key={d.date}>
                      <rect
                        x={x + 1} y={h - barH}
                        width={barW} height={barH}
                        rx="2"
                        fill={d.revenue > 0 ? "#6366F1" : "#F3F4F6"}
                        opacity="0.85"
                      />
                      <title>{d.date}: {fmt(d.revenue)} ({d.orders} orders)</title>
                    </g>
                  );
                })}
                {/* X-axis labels — show first, middle, last */}
                {[0, Math.floor(data.length / 2), data.length - 1].map((idx) => {
                  if (!data[idx]) return null;
                  const x = (idx / data.length) * w;
                  return (
                    <text key={idx} x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">
                      {data[idx].date.slice(5)}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top products by revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet.</p>
          ) : (
            <BarChart
              data={topProducts}
              color="#6366F1"
              labelKey="name"
              valueKey="revenue"
              formatValue={fmt}
            />
          )}
        </div>

        {/* Peak hours */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Peak selling hours</h2>
            {peakHour.count > 0 && (
              <span className="text-xs text-gray-400">Busiest: <strong className="text-gray-700">{peakHour.hour}</strong></span>
            )}
          </div>
          {(() => {
            const max = Math.max(...peakHours.map((h) => h.count)) || 1;
            // Group into 4-hour blocks for readability
            const blocks = Array.from({ length: 6 }, (_, i) => {
              const start = i * 4;
              const count = peakHours.slice(start, start + 4).reduce((s, h) => s + h.count, 0);
              return { label: `${start.toString().padStart(2,"0")}-${(start+4).toString().padStart(2,"0")}`, count };
            });
            const blockMax = Math.max(...blocks.map((b) => b.count)) || 1;

            return (
              <div className="space-y-2">
                {blocks.map((b) => (
                  <div key={b.label} className="flex items-center gap-3 text-xs">
                    <span className="w-14 flex-shrink-0 text-gray-400">{b.label}</span>
                    <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(b.count / blockMax) * 100}%`,
                          background: b.count === blockMax ? "#F59E0B" : "#E0E7FF",
                        }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-gray-700">{b.count}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Order status breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order status breakdown</h2>
          {statusSlices.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <DonutChart slices={statusSlices} />
          )}
        </div>

        {/* Sales channels */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sales channels</h2>
          {channelSlices.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <DonutChart slices={channelSlices} />
          )}
        </div>
      </div>

      {/* Top products table */}
      {topProducts.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">Product performance</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Units sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Avg. price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProducts.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.units}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-600">{fmt(p.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {p.units > 0 ? fmt(Math.round(p.revenue / p.units)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
