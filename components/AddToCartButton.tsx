"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart/actions";

export default function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setLoading(true);
    setError("");
    const result = await addToCart(productId, quantity);
    if (result?.error) {
      setError(result.error);
    } else {
      setAdded(true);
      router.refresh(); // updates cart count badge in header
      setTimeout(() => setAdded(false), 2000);
    }
    setLoading(false);
  }

  if (stock < 1) {
    return (
      <button disabled className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-400 w-full sm:w-auto">
        Out of stock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-gray-500 hover:text-gray-900"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          className="px-3 py-2 text-gray-500 hover:text-gray-900"
        >
          +
        </button>
      </div>

      <button onClick={handleAdd} disabled={loading} className="btn-primary flex-1 sm:flex-none px-6">
        {loading ? "Adding…" : added ? "✓ Added" : "Add to cart"}
      </button>

      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
