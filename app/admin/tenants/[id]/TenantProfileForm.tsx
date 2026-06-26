"use client";

import { useState } from "react";
import { updateTenantProfile } from "./actions";

type Values = {
  name: string;
  tagline: string;
  description: string;
  whatsappPhone: string;
  email: string;
  phone: string;
  address: string;
};

export default function TenantProfileForm({
  tenantId,
  initialValues,
}: {
  tenantId: string;
  initialValues: Values;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);
    const result = await updateTenantProfile(tenantId, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Business name</label>
        <input type="text" name="name" defaultValue={initialValues.name} required />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
          Tagline <span className="text-gray-300 font-normal">(shown in hero section)</span>
        </label>
        <input
          type="text"
          name="tagline"
          defaultValue={initialValues.tagline}
          placeholder="Fresh groceries delivered to your door"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
          Description <span className="text-gray-300 font-normal">(subtitle under tagline)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialValues.description}
          placeholder="Quality products from BMM Creations. Order online or chat with us on WhatsApp."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Contact details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">WhatsApp number</label>
            <input
              type="text"
              name="whatsappPhone"
              defaultValue={initialValues.whatsappPhone}
              placeholder="254700000000"
            />
            <p className="text-xs text-gray-400 mt-1">Format: 254XXXXXXXXX (no + sign)</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Phone</label>
            <input type="tel" name="phone" defaultValue={initialValues.phone} placeholder="07XX XXX XXX" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Email</label>
            <input type="email" name="email" defaultValue={initialValues.email} placeholder="info@bmmcreations.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Address / location</label>
            <input type="text" name="address" defaultValue={initialValues.address} placeholder="Nairobi, Kenya" />
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ Store profile updated</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
