"use client";

import { useState } from "react";
import { customerSignup } from "@/app/account/actions";

export default function SignupForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await customerSignup(formData);
    // On success, customerSignup() redirects server-side — we only
    // ever come back here if there was an error.
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Full name</label>
        <input type="text" name="name" required placeholder="Jane Doe" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Email</label>
        <input type="email" name="email" required placeholder="jane@example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Phone (optional)</label>
        <input type="tel" name="phone" placeholder="07XX XXX XXX" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Password</label>
        <input type="password" name="password" required minLength={8} placeholder="••••••••" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Confirm password</label>
        <input type="password" name="confirmPassword" required minLength={8} placeholder="••••••••" />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
