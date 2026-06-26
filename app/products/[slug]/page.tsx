import { prisma } from "@/lib/prisma";
import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getCart } from "@/lib/cart";
import StorefrontHeader from "@/components/StorefrontHeader";
import StorefrontFooter from "@/components/StorefrontFooter";
import ProductCard from "@/components/ProductCard";
import WishlistButton from "@/components/WishlistButton";
import AddToCartButton from "@/components/AddToCartButton";
import StarRating from "@/components/StarRating";
import ReviewSection from "@/components/ReviewSection";
import Link from "next/link";
import { notFound } from "next/navigation";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const allCategories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: params.slug } },
    include: {
      images: { orderBy: { position: "asc" } },
      category: { select: { name: true, slug: true } },
    },
  });

  if (!product || product.status === "ARCHIVED") notFound();

  const customer = await getCurrentCustomer();
  const cartCount = getCart(tenant.id).reduce((s, i) => s + i.quantity, 0);

  const [isWishlisted, reviews] = await Promise.all([
    customer
      ? prisma.wishlistItem.findUnique({
          where: { customerId_productId: { customerId: customer.id, productId: product.id } },
        }).then(Boolean)
      : Promise.resolve(false),
    prisma.review.findMany({
      where: { productId: product.id },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const averageRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // Related products: same category, excluding this product
  const related = product.categoryId
    ? await prisma.product.findMany({
        where: {
          tenantId: tenant.id,
          categoryId: product.categoryId,
          status: "ACTIVE",
          id: { not: product.id },
        },
        include: { images: { take: 1, orderBy: { position: "asc" } } },
        take: 4,
      })
    : [];

  const price = product.price.toNumber();
  const salePrice = product.salePrice?.toNumber() ?? null;
  const discountPercent = salePrice ? Math.round(((price - salePrice) / price) * 100) : null;

  const whatsappMessage = encodeURIComponent(
    `Hello ${tenant.name}, I'd like to inquire about: ${product.name} (${fmt(salePrice ?? price)})`
  );
  const whatsappPhone = (tenant.phone ?? "").replace(/\D/g, "") || "254700000000";

  const specs = (product.specs as Record<string, string> | null) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={allCategories} isCustomerLoggedIn={!!customer} cartCount={cartCount} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex-1">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-600">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-600">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image gallery */}
          <div>
            <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-3 relative">
              {product.images[0] ? (
                <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">No image</div>
              )}
              {discountPercent && (
                <span className="absolute top-3 left-3 rounded-full bg-danger-500 px-2.5 py-1 text-xs font-medium text-white">
                  -{discountPercent}% off
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img) => (
                  <div key={img.id} className="aspect-square rounded-lg bg-gray-50 overflow-hidden">
                    <img src={img.url} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{product.brand}</p>
            )}
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{product.name}</h1>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating rating={averageRating} size="sm" />
                <span className="text-sm text-gray-500">
                  {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              {salePrice ? (
                <>
                  <span className="text-2xl font-semibold text-danger-500">{fmt(salePrice)}</span>
                  <span className="text-base text-gray-400 line-through">{fmt(price)}</span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-gray-900">{fmt(price)}</span>
              )}
            </div>

            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600">
                  ● In Stock {product.stock <= 5 ? `(only ${product.stock} left)` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-3 py-1 text-sm font-medium text-danger-600">
                  ● Out of Stock
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="mb-4">
              <AddToCartButton productId={product.id} stock={product.stock} />
            </div>

            <div className="flex items-center gap-3 mb-2">
            <a
              href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white hover:bg-green-600 transition w-full sm:w-auto"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.15.34-.394.51-.59.171-.198.227-.339.341-.566.114-.226.057-.423-.041-.572-.099-.149-.872-2.105-1.196-2.879-.317-.758-.64-.655-.881-.667-.227-.012-.487-.014-.747-.014-.26 0-.682.098-.929.46-.247.36-.943 1.232-.943 2.605 0 1.373.964 2.7 1.099 2.886.135.187 1.857 2.834 4.502 3.97 2.645 1.135 2.645.756 3.107.71.46-.046 1.857-.756 2.123-1.481.266-.726.266-1.346.187-1.481-.077-.135-.297-.21-.594-.359z" />
                <path d="M12.04 0C5.39 0 0 5.39 0 12.04c0 2.122.55 4.116 1.516 5.85L0 24l6.21-1.49a11.95 11.95 0 005.83 1.49c6.65 0 12.04-5.39 12.04-12.04S18.69 0 12.04 0zm0 21.83a9.78 9.78 0 01-4.98-1.36l-.357-.21-3.69.886.985-3.594-.232-.369A9.78 9.78 0 012.21 12.04c0-5.42 4.41-9.83 9.83-9.83s9.83 4.41 9.83 9.83-4.41 9.83-9.83 9.83z" />
              </svg>
              Order via WhatsApp
            </a>
            <WishlistButton productId={product.id} initialWishlisted={isWishlisted} isLoggedIn={!!customer} />
            </div>

            {/* Specifications */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h2>
                <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between px-4 py-2.5 text-sm odd:bg-gray-50">
                      <dt className="text-gray-500">{key}</dt>
                      <dd className="text-gray-900 font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection
          productId={product.id}
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            customer: { name: r.customer.name },
            isOwn: customer?.id === r.customerId,
          }))}
          isLoggedIn={!!customer}
          averageRating={averageRating}
          totalReviews={reviews.length}
        />

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Related products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
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
          </div>
        )}
      </div>

      <StorefrontFooter tenantName={tenant.name} phone={tenant.phone} email={tenant.email} />
    </div>
  );
}
