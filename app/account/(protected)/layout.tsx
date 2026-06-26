import { getCurrentCustomer } from "@/lib/customer-session";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import AccountNav from "@/components/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

const customer = await getCurrentCustomer();
// Don't redirect if we're already on the login page
const { headers } = await import("next/headers");
const pathname = headers().get("x-invoke-path") ?? "";
if (!customer && !pathname.includes("/login")) {
  redirect("/account/login?callbackUrl=/account");
}

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} isCustomerLoggedIn={true} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row gap-6">
          <aside className="sm:w-48 flex-shrink-0">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-400">{customer.email}</p>
            </div>
            <AccountNav />
          </aside>

          <div className="flex-1">{children}</div>
        </div>
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
