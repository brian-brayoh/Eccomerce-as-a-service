import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import { notFound } from "next/navigation";
import MpesaPendingClient from "./MpesaPendingClient";

export default async function MpesaPendingPage({
  searchParams,
}: {
  searchParams: { order?: string; phone?: string };
}) {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  if (!searchParams.order) notFound();

  const [customer, categories, order] = await Promise.all([
    getCurrentCustomer(),
    prisma.category.findMany({ where: { tenantId: tenant.id }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.order.findFirst({ where: { id: searchParams.order, tenantId: tenant.id } }),
  ]);

  if (!order) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} isCustomerLoggedIn={!!customer} />

      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 flex-1 w-full">
        <MpesaPendingClient
          orderId={order.id}
          phone={searchParams.phone ?? order.shippingPhone ?? ""}
          amount={order.total.toNumber()}
        />
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
