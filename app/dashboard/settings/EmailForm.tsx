"use client";

import { useState } from "react";
import { updateEmail } from "./actions";

export default function EmailForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const result = await updateEmail(formData);

    // On success, updateEmail() signs the user out and redirects
    // server-side — so we only ever land back here on failure.
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">New email</label>
        <input type="email" name="newEmail" required autoComplete="email" placeholder="newemail@example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Current password</label>
        <input type="password" name="currentPasswordForEmail" required autoComplete="current-password" />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Updating…" : "Update email"}
      </button>
    </form>
  );
}
