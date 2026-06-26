"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "@/app/account/wishlist/actions";

export default function WishlistButton({
  productId,
  initialWishlisted,
  isLoggedIn,
}: {
  productId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/account/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    const next = !wishlisted;
    setWishlisted(next); // optimistic update

    const result = await toggleWishlist(productId);
    if (result?.error) {
      setWishlisted(!next); // revert on failure
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border transition ${
        wishlisted
          ? "border-danger-200 bg-danger-50 text-danger-500"
          : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
      }`}
      title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
    >
      <svg className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
