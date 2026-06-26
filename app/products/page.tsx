import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart } from "@/lib/cart";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const allCategories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" },
  });

  const activeCategory = searchParams.category
    ? allCategories.find((c) => c.slug === searchParams.category)
    : null;

  const customer = await getCurrentCustomer();
  const cartCount = getCart(tenant.id).reduce((s, i) => s + i.quantity, 0);

  // If a parent category is selected, include products from its children too
  const categoryIds = activeCategory
    ? [activeCategory.id, ...allCategories.filter((c) => c.parentId === activeCategory.id).map((c) => c.id)]
    : undefined;

  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(searchParams.q ? { name: { contains: searchParams.q, mode: "insensitive" } } : {}),
    },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const topLevelCategories = allCategories.filter((c) => !c.parentId);

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={allCategories} isCustomerLoggedIn={!!customer} cartCount={cartCount} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="sm:w-48 flex-shrink-0">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Categories</h2>
            <nav className="space-y-1">
              <Link
                href="/products"
                className={`block rounded-lg px-3 py-1.5 text-sm ${!activeCategory ? "bg-brand-50 text-brand-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                All products
              </Link>
              {topLevelCategories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`block rounded-lg px-3 py-1.5 text-sm ${activeCategory?.id === cat.id ? "bg-brand-50 text-brand-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {cat.name}
                  </Link>
                  {allCategories.filter((c) => c.parentId === cat.id).map((child) => (
                    <Link
                      key={child.id}
                      href={`/products?category=${child.slug}`}
                      className={`block rounded-lg px-3 py-1.5 pl-6 text-sm ${activeCategory?.id === child.id ? "bg-brand-50 text-brand-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-lg font-semibold text-gray-900">
                {activeCategory ? activeCategory.name : "All products"}
              </h1>
              <p className="text-sm text-gray-400">{products.length} item{products.length !== 1 ? "s" : ""}</p>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
                No products found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      slug: p.slug,
                      name: p.name,
                      price: p.price.toNumber(),
                      salePrice: p.salePrice?.toNumber() ?? null,
                      brand: p.brand,
                      imageUrl: p.images[0]?.url ?? null,
                      stock: p.stock,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
