"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatus } from "../actions";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E" },
  SUCCESS: { bg: "#E1F5EE", text: "#0F6E56" },
  FAILED:  { bg: "#FAECE7", text: "#993C1D" },
};

export default function PaymentStatusControl({ paymentId, currentStatus }: { paymentId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const st = STATUS_STYLES[status];

  async function handleUpdate(newStatus: "SUCCESS" | "FAILED") {
    setLoading(true);
    const result = await updatePaymentStatus(paymentId, newStatus);
    if (result?.success) {
      setStatus(newStatus);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: st.bg, color: st.text }}>
        {status}
      </span>
      {status === "PENDING" && (
        <div className="flex gap-1.5">
          <button onClick={() => handleUpdate("SUCCESS")} disabled={loading} className="text-xs font-medium text-brand-500 hover:underline">
            Mark paid
          </button>
          <button onClick={() => handleUpdate("FAILED")} disabled={loading} className="text-xs text-gray-400 hover:text-danger-500">
            Mark failed
          </button>
        </div>
      )}
    </div>
  );
}
