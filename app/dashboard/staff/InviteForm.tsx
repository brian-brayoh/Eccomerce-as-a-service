"use client";

import { useState, useRef } from "react";
import { inviteStaff } from "./actions";

export default function InviteForm({ canCreateAdmin }: { canCreateAdmin: boolean }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError(""); setSuccess(""); setLoading(true);
    const result = await inviteStaff(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      const name = String(formData.get("name"));
      setSuccess(`✓ ${name} has been added. Share their login credentials with them.`);
      formRef.current?.reset();
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Full name</label>
        <input type="text" name="name" required placeholder="Jane Doe" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Email address</label>
        <input type="email" name="email" required placeholder="jane@company.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Role</label>
        <select name="role">
          <option value="STAFF">Staff — limited access</option>
          {canCreateAdmin && <option value="ADMIN">Admin — full access</option>}
        </select>
        {!canCreateAdmin && (
          <p className="text-xs text-gray-400 mt-1">Only the platform owner can assign Admin role.</p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Temporary password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Staff should change this after first login via Settings.</p>
      </div>

      {error && <p className="sm:col-span-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      {success && <p className="sm:col-span-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">{success}</p>}

      <button type="submit" className="btn-primary w-fit" disabled={loading}>
        {loading ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}
