import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "@/components/DashboardSidebar";
import SubscriptionAlert from "@/components/SubscriptionAlert";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, tenant, isImpersonating } = await requireTenantSession();

  // Re-fetch tenant with subscription fields
  const freshTenant = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  if (!freshTenant) redirect("/login");

  // Check if subscription has expired — redirect to subscribe page
  // (but not for Super Admin impersonating, and not on the subscribe page itself)
  const now = new Date();
  const expiryDate = (freshTenant as any).subscriptionEndsAt ?? (freshTenant as any).trialEndsAt;
  const isExpired = expiryDate && new Date(expiryDate) <= now;
  const isPastDue = freshTenant.planStatus === "PAST_DUE" || freshTenant.planStatus === "CANCELLED";

  if (!isImpersonating && session.user.role !== "SUPER_ADMIN" && (isExpired || isPastDue)) {
    redirect("/dashboard/subscribe");
  }

  const allTenants = session.user.role === "SUPER_ADMIN"
    ? await prisma.tenant.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar
        tenantName={freshTenant.name}
        userName={session.user.name ?? session.user.email ?? ""}
        role={session.user.role}
        allTenants={allTenants}
        currentTenantId={freshTenant.id}
        isImpersonating={isImpersonating}
      />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Subscription expiry alert — shown to tenant admins only */}
        {!isImpersonating && session.user.role !== "SUPER_ADMIN" && (
          <SubscriptionAlert
            planStatus={freshTenant.planStatus}
            trialEndsAt={(freshTenant as any).trialEndsAt ?? null}
            subscriptionEndsAt={(freshTenant as any).subscriptionEndsAt ?? null}
          />
        )}

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between flex-shrink-0">
            <span>👁 Viewing <strong>{freshTenant.name}</strong>'s dashboard as Super Admin</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
