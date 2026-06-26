"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateCartQuantity, removeFromCart } from "./actions";

type LineItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
};

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default function CartItemRow({ item }: { item: LineItem }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);
  const [removed, setRemoved] = useState(false);

  async function handleQuantityChange(newQty: number) {
    if (newQty < 1 || newQty > item.stock) return;
    setQuantity(newQty);
    setUpdating(true);
    await updateCartQuantity(item.productId, newQty);
    router.refresh();
    setUpdating(false);
  }

  async function handleRemove() {
    setRemoved(true);
    await removeFromCart(item.productId);
    router.refresh();
  }

  if (removed) return null;

  return (
    <div className="card flex items-center gap-4">
      <Link href={`/products/${item.slug}`} className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-50 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-xs">No img</div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-brand-600 line-clamp-1">
          {item.name}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{fmt(item.unitPrice)} each</p>
      </div>

      <div className="flex items-center rounded-lg border border-gray-200 flex-shrink-0">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={updating}
          className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-50"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={updating || quantity >= item.stock}
          className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-50"
        >
          +
        </button>
      </div>

      <span className="w-24 text-right text-sm font-medium text-gray-900 flex-shrink-0">
        {fmt(item.unitPrice * quantity)}
      </span>

      <button onClick={handleRemove} className="text-gray-400 hover:text-danger-500 flex-shrink-0" title="Remove">
        ✕
      </button>
    </div>
  );
}
