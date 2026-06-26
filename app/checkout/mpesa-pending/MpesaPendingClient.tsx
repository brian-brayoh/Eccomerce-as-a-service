"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Phase = "sending" | "waiting" | "success" | "failed" | "timeout";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default function MpesaPendingClient({
  orderId,
  phone,
  amount,
}: {
  orderId: string;
  phone: string;
  amount: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("sending");
  const [error, setError] = useState("");
  const pollCount = useRef(0);
  const maxPolls = 40; // ~2 minutes at 3s intervals — Daraja STK prompts expire around then anyway

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval>;

    async function triggerPush() {
      try {
        const res = await fetch("/api/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, phone }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setPhase("failed");
          setError(data.error ?? "Could not send payment request. Please try again.");
          return;
        }

        setPhase("waiting");
        startPolling();
      } catch {
        setPhase("failed");
        setError("Network error. Check your connection and try again.");
      }
    }

    function startPolling() {
      pollTimer = setInterval(async () => {
        pollCount.current += 1;

        try {
          const res = await fetch(`/api/mpesa/status?orderId=${orderId}`);
          const data = await res.json();

          if (data.paymentStatus === "SUCCESS") {
            clearInterval(pollTimer);
            setPhase("success");
            setTimeout(() => router.push(`/checkout/success?order=${orderId}`), 1200);
          } else if (data.paymentStatus === "FAILED") {
            clearInterval(pollTimer);
            setPhase("failed");
            setError("Payment was not completed. You may have cancelled the prompt or it timed out.");
          } else if (pollCount.current >= maxPolls) {
            clearInterval(pollTimer);
            setPhase("timeout");
          }
        } catch {
          // Transient network error during polling — keep trying until maxPolls
        }
      }, 3000);
    }

    triggerPush();
    return () => clearInterval(pollTimer);
  }, [orderId, phone, router]);

  return (
    <div className="text-center">
      {(phase === "sending" || phase === "waiting") && (
        <>
          <div className="mb-6 flex justify-center">
            <div className="h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {phase === "sending" ? "Sending payment request…" : "Check your phone"}
          </h1>
          <p className="text-sm text-gray-500">
            {phase === "sending"
              ? "Sending an M-Pesa prompt to your phone."
              : `An M-Pesa prompt for ${fmt(amount)} has been sent to ${phone}. Enter your PIN to complete the payment.`}
          </p>
        </>
      )}

      {phase === "success" && (
        <>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Payment received!</h1>
          <p className="text-sm text-gray-500">Redirecting to your order confirmation…</p>
        </>
      )}

      {(phase === "failed" || phase === "timeout") && (
        <>
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50">
              <svg className="h-7 w-7 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {phase === "timeout" ? "Still waiting…" : "Payment not completed"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {phase === "timeout"
              ? "We haven't received confirmation yet. Your order is saved — you can check its status from your account or contact us."
              : error}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try again
            </button>
            <Link href="/cart" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Back to cart
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
