import { requireSuperAdminSession } from "@/lib/session";
import DashboardSidebar from "@/components/DashboardSidebar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireSuperAdminSession();

  const allTenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar
        tenantName="Platform Admin"
        userName={session.user.name ?? session.user.email ?? ""}
        role={session.user.role}
        allTenants={allTenants}
        currentTenantId=""
        isImpersonating={false}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
