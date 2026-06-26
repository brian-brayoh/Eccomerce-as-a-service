import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TenantProfileForm from "@/app/admin/tenants/[id]/TenantProfileForm";
import Link from "next/link";

export default async function StoreSettingsPage() {
  const { tenant } = await requireTenantSession();

  const freshTenant = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  if (!freshTenant) return null;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-3.5">
        <Link href="/dashboard/settings" className="text-xs text-gray-400 hover:text-gray-600">← Settings</Link>
        <h1 className="text-sm font-semibold text-gray-900">Store profile</h1>
      </div>

      <div className="p-6 max-w-lg">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 mb-5 leading-relaxed">
          These details appear on your storefront — the hero section, footer, and WhatsApp button.
          Keep your tagline short and specific to what your business sells.
        </div>

        <div className="card">
          <TenantProfileForm
            tenantId={freshTenant.id}
            initialValues={{
              name: freshTenant.name,
              tagline: (freshTenant as any).tagline ?? "",
              description: (freshTenant as any).description ?? "",
              whatsappPhone: (freshTenant as any).whatsappPhone ?? "",
              email: (freshTenant as any).email ?? "",
              phone: (freshTenant as any).phone ?? "",
              address: (freshTenant as any).address ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
