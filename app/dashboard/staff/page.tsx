import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import InviteForm from "./InviteForm";
import StaffRow from "./StaffRow";

const ROLE_INFO = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-purple-50 text-purple-700" },
  ADMIN: { label: "Admin", color: "bg-brand-50 text-brand-700" },
  STAFF: { label: "Staff", color: "bg-gray-100 text-gray-600" },
};

export default async function StaffPage() {
  const { tenant, session } = await requireTenantSession();

  const staff = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Staff & permissions</h1>
      </div>

      <div className="p-6 space-y-5">
        {/* Role explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs font-semibold text-brand-700 mb-1">Admin</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Full access — products, categories, orders, customers, coupons, banners, popups, M-Pesa settings, and can manage staff accounts.
            </p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold text-gray-600 mb-1">Staff</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Day-to-day access — POS, orders, products, and categories. Cannot manage staff accounts, settings, or payment credentials.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="card">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Add staff member</h2>
            <InviteForm canCreateAdmin={session.user.role === "SUPER_ADMIN"} />
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Joined</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((member) => (
                <StaffRow
                  key={member.id}
                  member={{
                    id: member.id,
                    name: member.name ?? "",
                    email: member.email,
                    role: member.role,
                    joinedAt: member.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
                  }}
                  currentUserId={session.user.id}
                  currentUserRole={session.user.role}
                  roleInfo={ROLE_INFO}
                  canManage={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
