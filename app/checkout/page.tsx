import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart } from "@/lib/cart";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function CheckoutPage() {
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

  const cartItems = getCart(tenant.id);
  if (cartItems.length === 0) redirect("/cart");

  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((i) => i.productId) }, tenantId: tenant.id },
  });

  const lineItems = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const unitPrice = product.salePrice?.toNumber() ?? product.price.toNumber();
      return { name: product.name, quantity: item.quantity, lineTotal: unitPrice * item.quantity };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
  const cartCount = lineItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} isCustomerLoggedIn={!!customer} cartCount={cartCount} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CheckoutForm
              isLoggedIn={!!customer}
              defaultName={customer?.name}
              defaultPhone={customer?.phone ?? undefined}
              subtotal={subtotal}
              mpesaEnabled={tenant.mpesaEnabled}
            />
          </div>

          <div className="card h-fit">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Order summary</h2>
            <div className="divide-y divide-gray-50 mb-3">
              {lineItems.map((item, i) => (
                <div key={i} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="text-gray-900">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <Link href="/cart" className="mt-3 block text-center text-xs text-gray-400 hover:text-gray-600">
              ← Edit cart
            </Link>
          </div>
        </div>
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
