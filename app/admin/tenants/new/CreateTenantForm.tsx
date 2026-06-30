"use client";

import { useState } from "react";
import { createTenant } from "./actions";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourplatform.com";

export default function CreateTenantForm() {
  const [name, setName] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const autoSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createTenant(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, createTenant() redirects to /admin
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Business info */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Business name</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="BMM Creations Kenya"
          required
        />
      </div>

      {/* Domain assignment */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">Domain</label>
        <div className="flex gap-3 mb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!useCustomDomain} onChange={() => setUseCustomDomain(false)} className="h-4 w-4" />
            Auto-assign subdomain
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={useCustomDomain} onChange={() => setUseCustomDomain(true)} className="h-4 w-4" />
            Custom domain
          </label>
        </div>

        {useCustomDomain ? (
          <div>
            <input
              type="text"
              name="customDomain"
              placeholder="bmmcreations.com"
              className="font-mono"
            />
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <p className="font-medium mb-1">DNS setup required</p>
              <p>The client must add a CNAME record at their domain registrar:</p>
              <code className="block mt-1 bg-amber-100 rounded px-2 py-1">
                CNAME @ → cname.vercel-dns.com
              </code>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700">
            {autoSlug || "business-name"}.{ROOT_DOMAIN}
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Plan</label>
          <select name="plan">
            <option value="STARTER">Starter — Free</option>
            <option value="BUSINESS">Business — KES 2,500/mo</option>
            <option value="ENTERPRISE">Enterprise — KES 8,000/mo</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Trial days</label>
          <input type="number" name="trialDays" defaultValue={14} min={0} max={90} />
        </div>
      </div>

      {/* Admin account */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Admin account</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Admin full name</label>
            <input type="text" name="adminName" placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Admin email</label>
            <input type="email" name="adminEmail" placeholder="admin@bmmcreations.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Temporary password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="adminPassword"
                placeholder="Min. 8 characters"
                minLength={8}
                required
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
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? "Creating tenant…" : "Create tenant"}
      </button>
    </form>
  );
}
