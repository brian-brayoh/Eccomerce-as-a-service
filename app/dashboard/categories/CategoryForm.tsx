"use client";

import { useState, useRef } from "react";
import { createCategory } from "./actions";

type ParentOption = { id: string; name: string; parentId: string | null };

export default function CategoryForm({ parentOptions }: { parentOptions: ParentOption[] }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Only top-level categories can be parents (keep it to 2 levels)
  const topLevelOptions = parentOptions.filter((p) => !p.parentId);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await createCategory(formData);

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
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Name</label>
        <input type="text" name="name" placeholder="e.g. Laser Printers" required />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Parent category (optional)</label>
        <select name="parentId" defaultValue="">
          <option value="">— Top level —</option>
          {topLevelOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding…" : "Add category"}
      </button>

      {error && <p className="w-full text-sm text-danger-600">{error}</p>}
      {success && <p className="w-full text-sm text-brand-600">✓ Category added</p>}
    </form>
  );
}
