"use client";

import { useState, useRef } from "react";
import { upsertPopup } from "./actions";
import ImageUpload from "@/components/ImageUpload";

type PopupValues = {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string | null;
  enabled?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

export default function PopupForm({ initial }: { initial?: PopupValues }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);
    const result = await upsertPopup(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      if (!initial) formRef.current?.reset();
      setTimeout(() => setSuccess(false), 2000);
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Type</label>
          <select name="type" defaultValue={initial?.type ?? "ANNOUNCEMENT"}>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="WELCOME">Welcome</option>
            <option value="DISCOUNT">Discount / Offer</option>
            <option value="NEW_ARRIVALS">New arrivals</option>
            <option value="NEWSLETTER">Newsletter signup</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Title</label>
          <input type="text" name="title" defaultValue={initial?.title ?? ""} placeholder="Big Sale — 30% off everything" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Message</label>
          <textarea
            name="message"
            rows={2}
            defaultValue={initial?.message ?? ""}
            placeholder="Use code SAVE30 at checkout for 30% off your first order."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Button text (optional)</label>
          <input type="text" name="buttonText" defaultValue={initial?.buttonText ?? ""} placeholder="Shop now" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Button link (optional)</label>
          <input type="text" name="buttonLink" defaultValue={initial?.buttonLink ?? ""} placeholder="/products" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Schedule (optional)</label>
          <div className="flex gap-2">
            <input type="date" name="startDate" defaultValue={initial?.startDate ?? ""} className="!w-auto flex-1" />
            <input type="date" name="endDate" defaultValue={initial?.endDate ?? ""} className="!w-auto flex-1" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Leave blank to always show.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Image (optional)</label>
          <ImageUpload name="imageUrl" defaultUrl={initial?.imageUrl} />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="enabled" name="enabled" defaultChecked={initial?.enabled ?? true} className="h-4 w-4 rounded border-gray-300 text-brand-500" />
          <label htmlFor="enabled" className="text-sm text-gray-700">Enabled (show on storefront)</label>
        </div>
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ {initial ? "Popup updated" : "Popup created"}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : initial ? "Update popup" : "Create popup"}
      </button>
    </form>
  );
}
