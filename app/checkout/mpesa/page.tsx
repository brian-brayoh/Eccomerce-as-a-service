import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { notFound } from "next/navigation";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import MpesaWaiting from "./MpesaWaiting";

export default async function MpesaCheckoutPage({
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

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const order = searchParams.order
    ? await prisma.order.findFirst({ where: { id: searchParams.order, tenantId: tenant.id } })
    : null;

  if (!order || !searchParams.phone) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} />

      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 flex-1 w-full">
        <MpesaWaiting orderId={order.id} phone={searchParams.phone} amount={order.total.toNumber()} />
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
