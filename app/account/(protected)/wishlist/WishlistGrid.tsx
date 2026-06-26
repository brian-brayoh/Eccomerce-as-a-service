"use client";

import { useState } from "react";
import Link from "next/link";
import { removeFromWishlist } from "./actions";

type WishlistItem = {
  wishlistItemId: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  brand: string | null;
  imageUrl: string | null;
  stock: number;
};

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default function WishlistGrid({ items }: { items: WishlistItem[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  async function handleRemove(id: string) {
    setHidden((prev) => new Set(prev).add(id));
    await removeFromWishlist(id);
  }

  const visible = items.filter((i) => !hidden.has(i.wishlistItemId));

  if (visible.length === 0) {
    return <p className="text-sm text-gray-400">Your wishlist is empty.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {visible.map((item) => (
        <div key={item.wishlistItemId} className="group rounded-2xl border border-gray-100 bg-white p-3 relative">
          <button
            onClick={() => handleRemove(item.wishlistItemId)}
            className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-danger-500"
            title="Remove from wishlist"
          >
            ✕
          </button>
          <Link href={`/products/${item.slug}`}>
            <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300 text-sm">No image</div>
              )}
            </div>
            {item.brand && <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-0.5">{item.brand}</p>}
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5">{item.name}</h3>
            <div className="flex items-baseline gap-2">
              {item.salePrice ? (
                <>
                  <span className="text-sm font-semibold text-danger-500">{fmt(item.salePrice)}</span>
                  <span className="text-xs text-gray-400 line-through">{fmt(item.price)}</span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-900">{fmt(item.price)}</span>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
