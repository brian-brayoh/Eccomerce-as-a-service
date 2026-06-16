import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HomePage() {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const [featuredProducts, topCategories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: tenant.id, featured: true, status: "ACTIVE" },
      include: { images: { take: 1, orderBy: { position: "asc" } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId: tenant.id, parentId: null },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const allCategories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={allCategories} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
            Printers & accessories,<br className="hidden sm:block" /> delivered fast
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
            Quality printers, toners, and office equipment from {tenant.name}.
            Order online or chat with us on WhatsApp.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/products" className="btn-primary px-6 py-3">Shop now</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Shop by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 text-center hover:border-brand-200 hover:shadow-sm transition"
              >
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400 mt-1">{cat._count.products} products</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Featured products</h2>
          <Link href="/products" className="text-sm font-medium text-brand-500 hover:underline">View all →</Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            No featured products yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
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
      </section>

      {/* Why choose us */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Why choose {tenant.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Genuine products", desc: "Authentic printers and accessories from trusted brands." },
              { title: "Fast delivery", desc: "Quick turnaround across the country." },
              { title: "Expert support", desc: "Chat with us on WhatsApp for quick advice and inquiries." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
