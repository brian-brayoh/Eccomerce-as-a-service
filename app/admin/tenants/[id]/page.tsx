import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";
import TenantProfileForm from "./TenantProfileForm";
import Link from "next/link";

export default async function EditTenantPage({ params }: { params: { id: string } }) {
  await requireSuperAdminSession();

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } });
  if (!tenant) notFound();

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-6 py-3.5">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">← Tenants</Link>
        <h1 className="text-sm font-semibold text-gray-900">Edit — {tenant.name}</h1>
      </div>

      <div className="p-6 max-w-xl">
        <div className="card">
          <TenantProfileForm
            tenantId={tenant.id}
            initialValues={{
              name: tenant.name,
              tagline: (tenant as any).tagline ?? "",
              description: (tenant as any).description ?? "",
              whatsappPhone: (tenant as any).whatsappPhone ?? "",
              email: (tenant as any).email ?? "",
              phone: (tenant as any).phone ?? "",
              address: (tenant as any).address ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
