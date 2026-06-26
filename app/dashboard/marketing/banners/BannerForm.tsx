"use client";

import { useState, useRef } from "react";
import { createBanner } from "./actions";
import ImageUpload from "@/components/ImageUpload";

export default function BannerForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);
    const result = await createBanner(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => setSuccess(false), 2000);
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Placement</label>
          <select name="placement">
            <option value="HOMEPAGE_HERO">Homepage hero slider</option>
            <option value="HOMEPAGE_PROMO">Homepage promo strip</option>
            <option value="CATEGORY_TOP">Category page top</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Title (optional)</label>
          <input type="text" name="title" placeholder="Summer Sale — Up to 40% off" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Link URL (optional)</label>
          <input type="url" name="linkUrl" placeholder="https://... or /products?category=printers" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Schedule (optional)</label>
          <div className="flex gap-2">
            <input type="date" name="startDate" className="!w-auto flex-1" />
            <input type="date" name="endDate" className="!w-auto flex-1" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Start → End. Leave blank to always show.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Banner image</label>
          <ImageUpload name="imageUrl" />
          <p className="text-xs text-gray-400 mt-1">Recommended: 1200×400px for hero, 800×200px for promo strip.</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ Banner added</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding…" : "Add banner"}
      </button>
    </form>
  );
}
