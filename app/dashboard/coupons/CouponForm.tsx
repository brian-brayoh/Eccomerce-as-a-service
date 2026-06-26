"use client";

import { useState, useRef } from "react";
import { createCoupon } from "./actions";

export default function CouponForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError(""); setSuccess(false); setLoading(true);
    const result = await createCoupon(formData);
    if (result?.error) { setError(result.error); } else { setSuccess(true); formRef.current?.reset(); }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Code</label>
        <input type="text" name="code" placeholder="SAVE20" style={{ textTransform: "uppercase" }} required />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Discount type</label>
        <select name="discountType">
          <option value="PERCENTAGE">Percentage (%)</option>
          <option value="FIXED_AMOUNT">Fixed amount (KES)</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Discount value</label>
        <input type="number" name="discountValue" min="1" step="0.01" placeholder="20" required />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Max uses (optional)</label>
        <input type="number" name="maxUses" min="1" placeholder="Unlimited" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Start date</label>
        <input type="date" name="startDate" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">End date</label>
        <input type="date" name="endDate" />
      </div>

      {error && <p className="sm:col-span-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="sm:col-span-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ Coupon created</p>}

      <button type="submit" className="btn-primary sm:col-span-3 w-fit" disabled={loading}>
        {loading ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}
