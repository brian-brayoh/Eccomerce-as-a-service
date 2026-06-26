"use client";

import { useState } from "react";

type Plan = "STARTER" | "BUSINESS" | "ENTERPRISE";

const PLAN_PRICES: Record<Plan, number> = {
  STARTER: 0,
  BUSINESS: 2500,
  ENTERPRISE: 8000,
};

export default function SubscribeClient({
  tenantId, currentPlan, tenantPhone,
}: {
  tenantId: string;
  currentPlan: string;
  tenantPhone: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>((currentPlan as Plan) ?? "BUSINESS");
  const [phone, setPhone] = useState(tenantPhone.includes("@") ? "" : tenantPhone);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "mpesa_waiting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const price = PLAN_PRICES[selectedPlan];

  async function handleSubscribe() {
    setLoading(true);
    setMessage("");

    if (price === 0) {
      // Starter is free — just activate
      const res = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setPhase("success");
        setMessage("Your Starter plan is now active! Redirecting…");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        setPhase("error");
        setMessage(data.error ?? "Something went wrong");
      }
      setLoading(false);
      return;
    }

    if (!phone) { setMessage("Enter your M-Pesa phone number"); setLoading(false); return; }

    // Trigger STK Push for subscription payment
    const res = await fetch("/api/subscription/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, plan: selectedPlan, phone }),
    });
    const data = await res.json();

    if (!data.success) {
      setPhase("error");
      setMessage(data.error ?? "Payment failed");
      setLoading(false);
      return;
    }

    setPhase("mpesa_waiting");
    setLoading(false);

    // Poll for payment confirmation
    let polls = 0;
    const interval = setInterval(async () => {
      polls++;
      if (polls > 40) {
        clearInterval(interval);
        setPhase("error");
        setMessage("Payment timed out. Contact support if you were charged.");
        return;
      }

      const statusRes = await fetch(`/api/subscription/status?tenantId=${tenantId}`);
      const status = await statusRes.json();

      if (status.active) {
        clearInterval(interval);
        setPhase("success");
        setMessage("Payment confirmed! Redirecting to your dashboard…");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      }
    }, 3000);
  }

  return (
    <div className="card space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Select plan</label>
        <div className="grid grid-cols-3 gap-2">
          {(["STARTER", "BUSINESS", "ENTERPRISE"] as Plan[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPlan(p)}
              className={`rounded-lg border py-2 text-xs font-medium transition ${
                selectedPlan === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
              }`}
            >
              {p}
              <span className="block text-[10px] font-normal mt-0.5">
                {PLAN_PRICES[p] === 0 ? "Free" : `KES ${PLAN_PRICES[p].toLocaleString("en-KE")}/mo`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {price > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">M-Pesa phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
          />
          <p className="text-xs text-gray-400 mt-1">
            You'll receive an M-Pesa prompt for KES {price.toLocaleString("en-KE")}/month
          </p>
        </div>
      )}

      {phase === "mpesa_waiting" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-center gap-2">
          <span className="animate-pulse">⏳</span>
          Check your phone and enter your M-Pesa PIN to complete payment…
        </div>
      )}

      {message && phase !== "mpesa_waiting" && (
        <p className={`text-sm ${phase === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
      )}

      {(phase === "idle" || phase === "error") && (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full justify-center py-3"
        >
          {loading ? "Processing…" : price === 0 ? "Activate free plan" : `Pay KES ${price.toLocaleString("en-KE")} via M-Pesa`}
        </button>
      )}
    </div>
  );
}
