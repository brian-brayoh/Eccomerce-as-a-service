"use client";

import { useState } from "react";
import { updateMpesaSettings } from "./actions";

type Values = {
  mpesaEnabled: boolean;
  mpesaShortcode: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  mpesaEnvironment: string;
};

export default function MpesaSettingsForm({ initialValues }: { initialValues: Values }) {
  const [enabled, setEnabled] = useState(initialValues.mpesaEnabled);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await updateMpesaSettings(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable M-Pesa</p>
          <p className="text-xs text-gray-400">Show M-Pesa as a payment option at checkout</p>
        </div>
        <input
          type="checkbox"
          name="mpesaEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-9 rounded-full"
          style={{ accentColor: "#1D9E75" }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Environment</label>
        <select name="mpesaEnvironment" defaultValue={initialValues.mpesaEnvironment}>
          <option value="sandbox">Sandbox (testing)</option>
          <option value="production">Production (live)</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Shortcode (Till / Paybill)</label>
        <input type="text" name="mpesaShortcode" defaultValue={initialValues.mpesaShortcode} placeholder="174379" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Consumer key</label>
        <input type="text" name="mpesaConsumerKey" defaultValue={initialValues.mpesaConsumerKey} placeholder="From Daraja app" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Consumer secret</label>
        <input type="password" name="mpesaConsumerSecret" defaultValue={initialValues.mpesaConsumerSecret} placeholder="From Daraja app" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Passkey</label>
        <input type="password" name="mpesaPasskey" defaultValue={initialValues.mpesaPasskey} placeholder="Lipa Na M-Pesa Online passkey" />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ M-Pesa settings saved</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
