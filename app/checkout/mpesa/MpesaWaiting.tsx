"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

type Phase = "initiating" | "waiting" | "success" | "failed" | "timeout" | "error";

export default function MpesaWaiting({
  orderId,
  phone,
  amount,
}: {
  orderId: string;
  phone: string;
  amount: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("initiating");
  const [errorMsg, setErrorMsg] = useState("");
  const pollCount = useRef(0);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 1: trigger the STK Push once on mount
  useEffect(() => {
    let cancelled = false;

    async function trigger() {
      try {
        const res = await fetch("/api/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, phone }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setPhase("error");
          setErrorMsg(data.error ?? "Could not start M-Pesa payment");
          return;
        }

        setPhase("waiting");
        startPolling();
      } catch {
        if (!cancelled) {
          setPhase("error");
          setErrorMsg("Network error — check your connection and try again");
        }
      }
    }

    trigger();
    return () => { cancelled = true; };
  }, [orderId, phone]);

  function startPolling() {
    pollInterval.current = setInterval(async () => {
      pollCount.current += 1;

      // Stop after ~90 seconds (Daraja STK Push prompts expire around then)
      if (pollCount.current > 30) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        setPhase("timeout");
        return;
      }

      try {
        const res = await fetch(`/api/mpesa/status?orderId=${orderId}`);
        const data = await res.json();

        if (data.paymentStatus === "SUCCESS") {
          if (pollInterval.current) clearInterval(pollInterval.current);
          setPhase("success");
          setTimeout(() => router.push(`/checkout/success?order=${orderId}`), 1200);
        } else if (data.paymentStatus === "FAILED") {
          if (pollInterval.current) clearInterval(pollInterval.current);
          setPhase("failed");
        }
      } catch {
        // Swallow transient poll errors — keep trying until timeout
      }
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  return (
    <div className="card text-center py-10">
      {(phase === "initiating" || phase === "waiting") && (
        <>
          <div className="mb-5 flex justify-center">
            <div className="h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {phase === "initiating" ? "Starting M-Pesa payment…" : "Check your phone"}
          </h1>
          <p className="text-sm text-gray-500 mb-1">
            {phase === "waiting"
              ? `Enter your M-Pesa PIN to complete payment of ${fmt(amount)}`
              : "Sending payment request…"}
          </p>
          <p className="text-xs text-gray-400">Sent to {phone}</p>
        </>
      )}

      {phase === "success" && (
        <>
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Payment received!</h1>
          <p className="text-sm text-gray-500">Redirecting to your order…</p>
        </>
      )}

      {(phase === "failed" || phase === "timeout" || phase === "error") && (
        <>
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50">
              <svg className="h-7 w-7 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {phase === "timeout" ? "Payment request expired" : "Payment didn't go through"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {phase === "error" ? errorMsg : "You can try again, or choose cash on delivery instead."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/checkout" className="btn-primary">Try again</Link>
            <Link href="/account/orders" className="text-sm font-medium text-gray-500 hover:text-gray-700">
              View order
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
