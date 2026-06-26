"use client";

import { useState } from "react";
import Link from "next/link";
import StarRating from "./StarRating";
import AddToCartButton from "./AddToCartButton";

type QuickViewProduct = {
  id: string; slug: string; name: string; brand: string | null;
  price: number; salePrice: number | null; stock: number;
  description: string | null; imageUrl: string | null;
  averageRating?: number; reviewCount?: number;
};

function fmt(n: number) { return "KES " + n.toLocaleString("en-KE"); }

export default function QuickViewButton({ product }: { product: QuickViewProduct }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(true); }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-white"
      >
        Quick view
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
              ✕
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="aspect-square bg-gray-50 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-sm">No image</div>
                )}
              </div>

              <div className="p-6 flex flex-col">
                {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{product.brand}</p>}
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h2>

                {product.averageRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <StarRating rating={product.averageRating} size="sm" />
                    <span className="text-xs text-gray-400">({product.reviewCount})</span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-3">
                  {product.salePrice ? (
                    <>
                      <span className="text-xl font-semibold text-danger-500">{fmt(product.salePrice)}</span>
                      <span className="text-sm text-gray-400 line-through">{fmt(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-xl font-semibold text-gray-900">{fmt(product.price)}</span>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{product.description}</p>
                )}

                <div className="mt-auto space-y-2">
                  <AddToCartButton productId={product.id} stock={product.stock} />
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="block text-center text-sm font-medium text-brand-500 hover:underline"
                  >
                    View full details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
