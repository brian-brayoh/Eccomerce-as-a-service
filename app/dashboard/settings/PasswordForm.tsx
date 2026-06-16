"use client";

import { useState, useRef } from "react";
import { updatePassword } from "./actions";

export default function PasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await updatePassword(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      formRef.current?.reset();
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Current password</label>
        <input type="password" name="currentPassword" required autoComplete="current-password" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">New password</label>
        <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Confirm new password</label>
        <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">✓ Password updated</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
