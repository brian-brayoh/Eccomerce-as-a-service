import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart } from "@/lib/cart";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import StorefrontPopup from "@/components/StorefrontPopup";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HomePage() {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const now = new Date();

  const [featuredProducts, topCategories, heroBanners, promoBanners, activePopup] = await Promise.all([
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
    prisma.banner.findMany({
      where: {
        tenantId: tenant.id, placement: "HOMEPAGE_HERO", active: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { position: "asc" },
    }),
    prisma.banner.findMany({
      where: {
        tenantId: tenant.id, placement: "HOMEPAGE_PROMO", active: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { position: "asc" },
      take: 1,
    }),
    prisma.popup.findFirst({
      where: {
        tenantId: tenant.id, enabled: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const allCategories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const customer = await getCurrentCustomer();
  const cartCount = getCart(tenant.id).reduce((s, i) => s + i.quantity, 0);

  // Dynamic content from tenant profile
  const tagline = (tenant as any).tagline || `Quality products from ${tenant.name}`;
  const description = (tenant as any).description || `Order online or chat with us on WhatsApp.`;
  const whatsappPhone = (tenant as any).whatsappPhone || "254700000000";

  return (
    <div className="flex min-h-screen flex-col">
      {activePopup && (
        <StorefrontPopup popup={{
          id: activePopup.id, type: activePopup.type, title: activePopup.title,
          message: activePopup.message, imageUrl: activePopup.imageUrl,
          buttonText: activePopup.buttonText, buttonLink: activePopup.buttonLink,
        }} />
      )}

      <StorefrontHeader
        tenantName={tenant.name}
        categories={allCategories}
        isCustomerLoggedIn={!!customer}
        cartCount={cartCount}
      />

      {/* Hero — banner carousel if available, fallback to dynamic text hero */}
      {heroBanners.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
          <BannerCarousel banners={heroBanners.map((b) => ({ id: b.id, title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl }))} />
        </section>
      ) : (
        <section className="bg-gradient-to-br from-brand-50 to-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
              {tagline}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
              {description}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/products" className="btn-primary px-6 py-3">Shop now</Link>
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.137.297-.358.446-.537.149-.179.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12.04 0C5.39 0 0 5.39 0 12.04c0 2.122.55 4.116 1.516 5.85L0 24l6.21-1.49a11.95 11.95 0 005.83 1.49c6.65 0 12.04-5.39 12.04-12.04S18.69 0 12.04 0zm0 21.83a9.78 9.78 0 01-4.98-1.36l-.357-.21-3.69.886.985-3.594-.232-.369A9.78 9.78 0 012.21 12.04c0-5.42 4.41-9.83 9.83-9.83s9.83 4.41 9.83 9.83-4.41 9.83-9.83 9.83z" />
                </svg>
                Chat with us
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Promo strip banner */}
      {promoBanners[0] && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
          {promoBanners[0].linkUrl ? (
            <Link href={promoBanners[0].linkUrl}>
              <div className="w-full overflow-hidden rounded-xl aspect-[6/1] bg-gray-100">
                <img src={promoBanners[0].imageUrl} alt={promoBanners[0].title ?? "Promo"} className="h-full w-full object-cover" />
              </div>
            </Link>
          ) : (
            <div className="w-full overflow-hidden rounded-xl aspect-[6/1] bg-gray-100">
              <img src={promoBanners[0].imageUrl} alt={promoBanners[0].title ?? "Promo"} className="h-full w-full object-cover" />
            </div>
          )}
        </section>
      )}

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
            No featured products yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
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
              { title: "Genuine products", desc: "Authentic items from trusted brands and suppliers." },
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

      <StorefrontFooter tenantName={tenant.name} phone={(tenant as any).phone} email={(tenant as any).email} />
    </div>
  );
}
