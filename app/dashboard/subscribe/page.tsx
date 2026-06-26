import { requireTenantSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SubscribeClient from "./SubscribeClient";

export default async function SubscribePage() {
  const { tenant, session } = await requireTenantSession();

  // Re-fetch fresh tenant data with subscription dates
  const freshTenant = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  if (!freshTenant) redirect("/login");

  const now = new Date();
  const expiryDate = (freshTenant as any).subscriptionEndsAt ?? (freshTenant as any).trialEndsAt;

  // If still active, redirect to dashboard
  if (freshTenant.planStatus === "ACTIVE" && expiryDate && new Date(expiryDate) > now) {
    redirect("/dashboard");
  }
  if (freshTenant.planStatus === "TRIALING" && expiryDate && new Date(expiryDate) > now) {
    redirect("/dashboard");
  }

  const planPrices: Record<string, number> = {
    STARTER: 0,
    BUSINESS: 2500,
    ENTERPRISE: 8000,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 mb-4">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {freshTenant.planStatus === "TRIALING" ? "Your trial has ended" : "Subscription required"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {freshTenant.planStatus === "TRIALING"
              ? `Your free trial for ${freshTenant.name} has expired. Choose a plan to continue.`
              : `Your subscription for ${freshTenant.name} has lapsed. Renew to regain access.`}
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { plan: "STARTER", label: "Starter", price: 0, features: ["Up to 50 products", "Basic storefront", "WhatsApp orders", "1 staff account"] },
            { plan: "BUSINESS", label: "Business", price: 2500, features: ["Unlimited products", "M-Pesa payments", "Reviews & coupons", "5 staff accounts", "Analytics"], popular: true },
            { plan: "ENTERPRISE", label: "Enterprise", price: 8000, features: ["Everything in Business", "Custom domain", "Priority support", "Unlimited staff", "API access"] },
          ].map((p) => (
            <div key={p.plan} className={`card relative ${p.popular ? "border-brand-500 ring-1 ring-brand-500" : ""}`}>
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-[10px] font-semibold text-white">
                  Popular
                </span>
              )}
              <p className="text-sm font-semibold text-gray-900">{p.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {p.price === 0 ? "Free" : `KES ${p.price.toLocaleString("en-KE")}`}
                {p.price > 0 && <span className="text-xs font-normal text-gray-400">/mo</span>}
              </p>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <SubscribeClient tenantId={freshTenant.id} currentPlan={freshTenant.plan} tenantPhone={session.user.email ?? ""} />

        <p className="text-center text-xs text-gray-400 mt-4">
          Need help? Contact support or{" "}
          <a href="/login" className="text-brand-500 hover:underline">sign out</a>
        </p>
      </div>
    </div>
  );
}
