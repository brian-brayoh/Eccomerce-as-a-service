import { requireTenantSession } from "@/lib/session";
import MpesaSettingsForm from "./MpesaSettingsForm";

export default async function MpesaSettingsPage() {
  const { tenant } = await requireTenantSession();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">M-Pesa settings</h1>
      </div>

      <div className="p-6 max-w-lg space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Using Daraja Sandbox?</p>
          <p className="text-xs leading-relaxed">
            Get test credentials at{" "}
            <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer" className="underline">
              developer.safaricom.co.ke
            </a>{" "}
            → create an app → copy the Consumer Key/Secret. Use shortcode <code className="bg-blue-100 px-1 rounded">174379</code> and
            the sandbox passkey shown on the same page — these are Safaricom's shared test values, safe to use for development.
          </p>
        </div>

        <div className="card">
          <MpesaSettingsForm
            initialValues={{
              mpesaEnabled: tenant.mpesaEnabled,
              mpesaShortcode: tenant.mpesaShortcode ?? "",
              mpesaConsumerKey: tenant.mpesaConsumerKey ?? "",
              mpesaConsumerSecret: tenant.mpesaConsumerSecret ?? "",
              mpesaPasskey: tenant.mpesaPasskey ?? "",
              mpesaEnvironment: tenant.mpesaEnvironment,
            }}
          />
        </div>
      </div>
    </div>
  );
}
