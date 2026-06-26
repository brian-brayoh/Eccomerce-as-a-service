"use client";

import { useState } from "react";
import { updateMpesaSettings } from "./actions";

export default function MpesaSettingsForm({
  currentlyEnabled,
  shortcode,
  consumerKey,
  hasSecret,
  hasPasskey,
  environment,
}: {
  currentlyEnabled: boolean;
  shortcode: string;
  consumerKey: string;
  hasSecret: boolean;
  hasPasskey: boolean;
  environment: string;
}) {
  const [enabled, setEnabled] = useState(currentlyEnabled);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);

    if (enabled) formData.set("mpesaEnabled", "on");

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
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="mpesaEnabledToggle"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="mpesaEnabledToggle" className="text-sm font-medium text-gray-700">
          Enable M-Pesa at checkout
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Environment</label>
        <select name="mpesaEnvironment" defaultValue={environment}>
          <option value="sandbox">Sandbox (testing)</option>
          <option value="production">Production (live payments)</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Shortcode (Till/Paybill number)</label>
        <input type="text" name="mpesaShortcode" defaultValue={shortcode} placeholder="e.g. 174379 (sandbox test shortcode)" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Consumer Key</label>
        <input type="text" name="mpesaConsumerKey" defaultValue={consumerKey} placeholder="From your Daraja app" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Consumer Secret</label>
        <input type="password" name="mpesaConsumerSecret" placeholder={hasSecret ? "•••••••• (saved — leave blank to keep)" : "From your Daraja app"} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Passkey</label>
        <input type="password" name="mpesaPasskey" placeholder={hasPasskey ? "•••••••• (saved — leave blank to keep)" : "Lipa Na M-Pesa Online passkey"} />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ Payment settings saved</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
