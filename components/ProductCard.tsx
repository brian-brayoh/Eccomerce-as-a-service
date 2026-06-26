import Link from "next/link";
import StarRating from "@/components/StarRating";
import QuickViewButton from "@/components/QuickViewButton";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  brand: string | null;
  imageUrl: string | null;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  description?: string | null;
  id?: string;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-2xl border border-gray-100 bg-white p-3 transition hover:border-gray-200 hover:shadow-sm"
    >
      <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-sm">No image</div>
        )}
        {discountPercent && (
          <span className="absolute top-2 left-2 rounded-full bg-danger-500 px-2 py-0.5 text-xs font-medium text-white">
            -{discountPercent}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
        {product.id && (
          <QuickViewButton product={{
            id: product.id, slug: product.slug, name: product.name,
            brand: product.brand, price: product.price, salePrice: product.salePrice,
            stock: product.stock, description: product.description ?? null,
            imageUrl: product.imageUrl, averageRating: product.averageRating,
            reviewCount: product.reviewCount,
          }} />
        )}
      </div>

      {product.brand && (
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-0.5">{product.brand}</p>
      )}
      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5 group-hover:text-brand-600">
        {product.name}
      </h3>

      {product.averageRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
        <div className="flex items-center gap-1 mb-1.5">
          <StarRating rating={product.averageRating} size="sm" />
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>
      )}

      <div className="flex items-baseline gap-2">
        {product.salePrice ? (
          <>
            <span className="text-sm font-semibold text-danger-500">{fmt(product.salePrice)}</span>
            <span className="text-xs text-gray-400 line-through">{fmt(product.price)}</span>
          </>
        ) : (
          <span className="text-sm font-semibold text-gray-900">{fmt(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
