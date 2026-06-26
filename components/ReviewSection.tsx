"use client";

import { useState } from "react";
import { submitReview } from "@/app/products/actions";
import StarRating from "@/components/StarRating";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { name: string };
  isOwn: boolean;
};

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5"
        >
          <svg className="h-7 w-7" viewBox="0 0 20 20">
            <path
              fill={(hovered || value) >= star ? "#F59E0B" : "#E5E7EB"}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({
  productId,
  reviews,
  isLoggedIn,
  averageRating,
  totalReviews,
}: {
  productId: string;
  reviews: Review[];
  isLoggedIn: boolean;
  averageRating: number;
  totalReviews: number;
}) {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (rating === 0) { setError("Please select a star rating"); return; }
    setError(""); setLoading(true);
    formData.set("rating", String(rating));
    const result = await submitReview(productId, formData);
    if (result?.error) { setError(result.error); } else { setSuccess(true); setRating(0); }
    setLoading(false);
  }

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer reviews</h2>

      {totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 rounded-2xl bg-gray-50">
          <div className="text-center sm:border-r sm:border-gray-200 sm:pr-6">
            <p className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
            <StarRating rating={averageRating} size="md" />
            <p className="text-xs text-gray-400 mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-500">{star}</span>
                <svg className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: totalReviews ? `${(count / totalReviews) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-6 text-right text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a review */}
      {isLoggedIn ? (
        success ? (
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-600 mb-6">✓ Thanks for your review!</div>
        ) : (
          <form action={handleSubmit} className="card mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Write a review</h3>
            <div className="mb-3">
              <InteractiveStars value={rating} onChange={setRating} />
            </div>
            <textarea
              name="comment"
              rows={3}
              placeholder="Share your experience with this product (optional)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary mt-3">
              {loading ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )
      ) : (
        <div className="card mb-6 text-center py-6">
          <p className="text-sm text-gray-500">
            <a href="/account/login" className="font-medium text-brand-500 hover:underline">Sign in</a> to leave a review
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No reviews yet — be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{review.customer.name}</span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
