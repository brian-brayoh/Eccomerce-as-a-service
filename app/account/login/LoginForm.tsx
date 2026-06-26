"use client";

import { useState } from "react";
import { customerLogin } from "@/app/account/actions";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    formData.set("callbackUrl", callbackUrl);
    const result = await customerLogin(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Email</label>
        <input type="email" name="email" required placeholder="jane@example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Password</label>
        <input type="password" name="password" required placeholder="••••••••" />
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
