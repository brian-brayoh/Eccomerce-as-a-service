import { requireTenantSession } from "@/lib/session";
import MpesaSettingsForm from "./MpesaSettingsForm";

export default async function PaymentSettingsPage() {
  const { tenant, session } = await requireTenantSession();

  const canEdit = session.user.role !== "STAFF";

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Payment settings</h1>
      </div>

      <div className="p-6 max-w-lg space-y-5">
        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-1">M-Pesa (Lipa Na M-Pesa Online)</h2>
          <p className="text-xs text-gray-400 mb-4">
            Get these credentials from your{" "}
            <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
              Safaricom Daraja
            </a>{" "}
            app. Use Sandbox while testing.
          </p>

          {!canEdit ? (
            <p className="text-sm text-gray-400">Only store admins can view or change payment settings.</p>
          ) : (
            <MpesaSettingsForm
              currentlyEnabled={tenant.mpesaEnabled}
              shortcode={tenant.mpesaShortcode ?? ""}
              consumerKey={tenant.mpesaConsumerKey ?? ""}
              hasSecret={!!tenant.mpesaConsumerSecret}
              hasPasskey={!!tenant.mpesaPasskey}
              environment={tenant.mpesaEnvironment}
            />
          )}
        </div>

        <div className="card bg-gray-50 border-gray-100">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Callback URL</h2>
          <p className="text-xs text-gray-500 mb-2">Daraja needs this URL configured in your app (sandbox apps usually accept any HTTPS URL here):</p>
          <code className="block rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700 break-all">
            {process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com"}/api/mpesa/callback
          </code>
        </div>
      </div>
    </div>
  );
}
