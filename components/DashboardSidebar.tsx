"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/dashboard/actions";
import { setViewAsTenant, clearViewAsTenant } from "@/app/dashboard/tenant-actions";
import { useState } from "react";

const NAV = [
  { href: "/dashboard",            label: "Overview",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/products",   label: "Products",   icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/dashboard/categories", label: "Categories",  icon: "M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" },
  { href: "/dashboard/orders",     label: "Orders",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/dashboard/customers",  label: "Customers",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/dashboard/settings",   label: "Settings",    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const SUPER_ADMIN_NAV = [
  { href: "/admin",          label: "Tenants",       icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" },
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

export default function DashboardSidebar({
  tenantName,
  userName,
  role,
  allTenants,
  currentTenantId,
  isImpersonating,
}: Props) {
  const pathname = usePathname();
  const nav = role === "SUPER_ADMIN" ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;
  const [switching, setSwitching] = useState(false);

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

        {/* Tenant switcher — Super Admin only, and only within /dashboard */}
        {role === "SUPER_ADMIN" && currentTenantId && allTenants.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Viewing tenant
            </label>
            <select
              value={currentTenantId}
              onChange={handleTenantChange}
              disabled={switching}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-brand-500"
            >
              {allTenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {isImpersonating && (
              <form action={clearViewAsTenant} className="mt-1.5">
                <button type="submit" className="text-[11px] text-amber-600 hover:underline">
                  ← Back to platform admin
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
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
