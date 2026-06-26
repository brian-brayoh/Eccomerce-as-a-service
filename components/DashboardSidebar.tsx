"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/dashboard/actions";
import { setViewAsTenant, clearViewAsTenant } from "@/app/dashboard/tenant-actions";
import { useState } from "react";

// adminOnly: true = hidden from STAFF role
const NAV = [
  { href: "/dashboard",                  label: "Overview",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/pos",              label: "POS",        icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/dashboard/orders",           label: "Orders",     icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/dashboard/products",         label: "Products",   icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/dashboard/categories",       label: "Categories", icon: "M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" },
  { href: "/dashboard/customers",        label: "Customers",  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/dashboard/coupons",          label: "Coupons",    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", adminOnly: true },
  { href: "/dashboard/marketing/banners",label: "Marketing",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z", adminOnly: true },
  { href: "/dashboard/staff",            label: "Staff",      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", adminOnly: true },
  { href: "/dashboard/settings",         label: "Settings",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/dashboard/analytics",        label: "Analytics",  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", adminOnly: true },
];

const SUPER_ADMIN_NAV = [
  { href: "/admin",               label: "Tenants",       icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
];

type TenantOption = { id: string; name: string; slug: string };

type Props = {
  tenantName: string;
  userName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  allTenants: TenantOption[];
  currentTenantId: string;
  isImpersonating: boolean;
};

export default function DashboardSidebar({ tenantName, userName, role, allTenants, currentTenantId, isImpersonating }: Props) {
  const pathname = usePathname();
  const [switching, setSwitching] = useState(false);

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const visibleNav = role === "SUPER_ADMIN"
    ? [...NAV, ...SUPER_ADMIN_NAV]
    : NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin);

  async function handleTenantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (id === currentTenantId) return;
    setSwitching(true);
    await setViewAsTenant(id);
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white">
            {tenantName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{tenantName}</p>
            <p className="truncate text-xs text-gray-400">{userName}</p>
          </div>
        </div>

        {role === "SUPER_ADMIN" && currentTenantId && allTenants.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">Viewing tenant</label>
            <select value={currentTenantId} onChange={handleTenantChange} disabled={switching} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-brand-500">
              {allTenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {isImpersonating && (
              <form action={clearViewAsTenant} className="mt-1.5">
                <button type="submit" className="text-[11px] text-amber-600 hover:underline">← Back to platform admin</button>
              </form>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleNav.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-2">
        <form action={signOutAction}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
