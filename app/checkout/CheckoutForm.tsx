"use client";

import { useState } from "react";
import { placeOrder } from "./actions";
import { validateCoupon } from "@/app/dashboard/coupons/actions";

function fmt(n: number) { return "KES " + n.toLocaleString("en-KE"); }

export default function CheckoutForm({
  isLoggedIn, defaultName, defaultPhone, subtotal, mpesaEnabled,
}: {
  isLoggedIn: boolean; defaultName?: string; defaultPhone?: string;
  subtotal: number; mpesaEnabled: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "MPESA">("CASH_ON_DELIVERY");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ couponId: string; code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true); setCouponError("");
    const result = await validateCoupon(couponCode, subtotal);
    if (result?.error) { setCouponError(result.error); setAppliedCoupon(null); }
    else if (result?.success) {
      setAppliedCoupon({ couponId: result.couponId!, code: result.code!, discount: result.discount! });
    }
    setApplyingCoupon(false);
  }

  async function handleSubmit(formData: FormData) {
    setError(""); setLoading(true);
    if (appliedCoupon) { formData.set("couponId", appliedCoupon.couponId); }
    const result = await placeOrder(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {!isLoggedIn && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Your details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Full name</label><input type="text" name="guestName" required placeholder="Jane Doe" /></div>
            <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Phone</label><input type="tel" name="guestPhone" required placeholder="07XX XXX XXX" /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Email (optional)</label><input type="email" name="guestEmail" placeholder="jane@example.com" /></div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Delivery details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Recipient name</label><input type="text" name="shippingName" required defaultValue={defaultName} placeholder="Who's receiving this?" /></div>
          <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Phone</label><input type="tel" name="shippingPhone" required defaultValue={defaultPhone} placeholder="07XX XXX XXX" /></div>
          <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">County</label><input type="text" name="shippingCounty" placeholder="e.g. Nairobi" /></div>
          <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Town</label><input type="text" name="shippingTown" placeholder="e.g. Westlands" /></div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Street / building / landmark</label><input type="text" name="shippingStreet" placeholder="Apartment, building, or nearby landmark" /></div>
        </div>
      </div>

      {/* Coupon */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Coupon code</h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
            <span className="text-sm text-brand-700 font-medium">✓ {appliedCoupon.code} — {fmt(appliedCoupon.discount)} off</span>
            <button type="button" onClick={() => setAppliedCoupon(null)} className="text-xs text-brand-500 hover:underline">Remove</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1" />
            <button type="button" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode} className="btn-primary px-4 text-xs">
              {applyingCoupon ? "…" : "Apply"}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-xs text-danger-600">{couponError}</p>}
      </div>

      <div className="card">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Payment method</h2>
        <div className="space-y-2">
          <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${paymentMethod === "CASH_ON_DELIVERY" ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
            <input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} className="h-4 w-4 text-brand-500" />
            <div><p className="text-sm font-medium text-gray-900">Cash on delivery</p><p className="text-xs text-gray-400">Pay when your order arrives</p></div>
          </label>
          <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${!mpesaEnabled ? "opacity-50" : ""} ${paymentMethod === "MPESA" ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}>
            <input type="radio" name="paymentMethod" value="MPESA" disabled={!mpesaEnabled} checked={paymentMethod === "MPESA"} onChange={() => setPaymentMethod("MPESA")} className="h-4 w-4 text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">M-Pesa {!mpesaEnabled && <span className="text-xs font-normal text-gray-400">(not available)</span>}</p>
              <p className="text-xs text-gray-400">Pay instantly via STK Push</p>
            </div>
          </label>
        </div>
        {paymentMethod === "MPESA" && (
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">M-Pesa phone number</label>
            <input type="tel" name="mpesaPhone" defaultValue={defaultPhone} placeholder="07XX XXX XXX" required />
          </div>
        )}
      </div>

      {/* Order total with discount */}
      {discount > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-brand-600 mb-1"><span>Coupon discount</span><span>-{fmt(discount)}</span></div>
          <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-100 pt-2 mt-2"><span>Total</span><span>{fmt(total)}</span></div>
          <input type="hidden" name="discountAmount" value={discount} />
        </div>
      )}

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
        {loading ? "Placing order…" : `Place order · ${fmt(total)}`}
      </button>
    </form>
  );
}
