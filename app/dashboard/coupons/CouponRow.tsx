"use client";

import { useState } from "react";
import { toggleCoupon, deleteCoupon } from "./actions";

type Coupon = {
  id: string; code: string; discountType: string; discountValue: number;
  maxUses: number | null; usedCount: number; active: boolean;
  startDate: string | null; endDate: string | null;
};

export default function CouponRow({ coupon }: { coupon: Coupon }) {
  const [active, setActive] = useState(coupon.active);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const discount = coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `KES ${coupon.discountValue.toLocaleString("en-KE")} off`;

  const validity = [
    coupon.startDate && `From ${coupon.startDate}`,
    coupon.endDate && `Until ${coupon.endDate}`,
  ].filter(Boolean).join(" · ") || "Always valid";

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono font-medium text-gray-800">{coupon.code}</code>
      </td>
      <td className="px-4 py-3 text-gray-700">{discount}</td>
      <td className="px-4 py-3 text-gray-500">
        {coupon.usedCount}{coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{validity}</td>
      <td className="px-4 py-3">
        <button
          onClick={async () => { const next = !active; setActive(next); await toggleCoupon(coupon.id, next); }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${active ? "bg-brand-500" : "bg-gray-200"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${active ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={async () => { if (confirm("Delete coupon?")) { await deleteCoupon(coupon.id); setHidden(true); } }} className="text-xs text-gray-400 hover:text-danger-500">
          Delete
        </button>
      </td>
    </tr>
  );
}
