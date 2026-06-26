"use client";

import { useState } from "react";
import { updateTenantPlan } from "./actions";

export default function PlanControl({
  tenantId,
  currentPlan,
  currentStatus,
}: {
  tenantId: string;
  currentPlan: string;
  currentStatus: string;
}) {
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.set("plan", plan);
    fd.set("planStatus", status);

    const result = await updateTenantPlan(tenantId, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
    setLoading(false);
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand-500 hover:underline">
        Edit
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select value={plan} onChange={(e) => setPlan(e.target.value)} className="!w-28 text-xs">
        <option value="STARTER">Starter</option>
        <option value="BUSINESS">Business</option>
        <option value="ENTERPRISE">Enterprise</option>
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-24 text-xs">
        <option value="TRIALING">Trialing</option>
        <option value="ACTIVE">Active</option>
        <option value="PAST_DUE">Past due</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button onClick={handleSave} disabled={loading} className="text-xs font-medium text-brand-500 hover:underline">
        {loading ? "…" : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
      {error && <span className="text-xs text-danger-600">{error}</span>}
    </div>
  );
}
