"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../actions";

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: "#FEF3C7", text: "#92400E" },
  PAID:       { bg: "#E1F5EE", text: "#0F6E56" },
  PROCESSING: { bg: "#E6F1FB", text: "#185FA5" },
  DELIVERED:  { bg: "#E1F5EE", text: "#0F6E56" },
  CANCELLED:  { bg: "#FAECE7", text: "#993C1D" },
};

export default function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextOptions = TRANSITIONS[status] ?? [];
  const st = STATUS_STYLES[status];

  async function handleChange(newStatus: string) {
    if (newStatus === "CANCELLED" && !confirm("Cancel this order? This will restock the items.")) {
      return;
    }
    setLoading(true);
    setError("");
    const result = await updateOrderStatus(orderId, newStatus);
    if (result?.error) {
      setError(result.error);
    } else {
      setStatus(newStatus);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: st.bg, color: st.text }}>
        {status}
      </span>
      {nextOptions.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && handleChange(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-brand-500"
        >
          <option value="">Move to…</option>
          {nextOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}
      {error && <span className="text-xs text-danger-600">{error}</span>}
    </div>
  );
}
