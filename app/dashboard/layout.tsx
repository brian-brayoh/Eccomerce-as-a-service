import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, tenant, isImpersonating } = await requireTenantSession();

  // Super Admins get the full tenant list for the switcher
  const allTenants = session.user.role === "SUPER_ADMIN"
    ? await prisma.tenant.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar
        tenantName={tenant.name}
        userName={session.user.name ?? session.user.email ?? ""}
        role={session.user.role}
        allTenants={allTenants}
        currentTenantId={tenant.id}
        isImpersonating={isImpersonating}
      />
      <main className="flex-1 overflow-y-auto">
        {isImpersonating && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between">
            <span>👁 Viewing <strong>{tenant.name}</strong>'s dashboard as Super Admin</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
