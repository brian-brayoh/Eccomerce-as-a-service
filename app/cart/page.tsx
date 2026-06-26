import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart } from "@/lib/cart";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import Link from "next/link";
import { notFound } from "next/navigation";
import CartItemRow from "./CartItemRow";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function CartPage() {
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

  const products = cartItems.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: cartItems.map((i) => i.productId) }, tenantId: tenant.id },
        include: { images: { take: 1, orderBy: { position: "asc" } } },
      })
    : [];

  const lineItems = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const unitPrice = product.salePrice?.toNumber() ?? product.price.toNumber();
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.images[0]?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        stock: product.stock,
        lineTotal: unitPrice * item.quantity,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
  const cartCount = lineItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} isCustomerLoggedIn={!!customer} cartCount={cartCount} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Your cart</h1>

        {lineItems.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-400 mb-3">Your cart is empty.</p>
            <Link href="/products" className="text-sm font-medium text-brand-500 hover:underline">Browse products →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {lineItems.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>

            <div className="card h-fit">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Order summary</h2>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal ({cartCount} item{cartCount !== 1 ? "s" : ""})</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-3">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mb-4 flex justify-between text-sm font-semibold text-gray-900">
                <span>Total</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <Link href="/checkout" className="btn-primary w-full justify-center">
                Proceed to checkout
              </Link>
            </div>
          </div>
        )}
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
