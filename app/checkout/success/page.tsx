import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import Link from "next/link";
import { notFound } from "next/navigation";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const [customer, categories] = await Promise.all([
    getCurrentCustomer(),
    prisma.category.findMany({ where: { tenantId: tenant.id }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);

  const order = searchParams.order
    ? await prisma.order.findFirst({
        where: { id: searchParams.order, tenantId: tenant.id },
        include: { items: true },
      })
    : null;

  if (!order) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} isCustomerLoggedIn={!!customer} />

      <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 flex-1 w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Order placed!</h1>
        <p className="text-sm text-gray-500 mb-8">
          Thank you{order.guestName ? `, ${order.guestName}` : ""}. Your order #{order.id.slice(-6).toUpperCase()} has been received.
        </p>

        <div className="card text-left mb-6">
          <div className="divide-y divide-gray-50 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="py-2 flex justify-between text-sm">
                <span className="text-gray-600">{item.productName} × {item.quantity}</span>
                <span className="text-gray-900">{fmt(item.unitPrice.toNumber() * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{fmt(order.total.toNumber())}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/products" className="btn-primary">Continue shopping</Link>
          {customer && (
            <Link href="/account/orders" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              View order history
            </Link>
          )}
        </div>
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
