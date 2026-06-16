import { requireTenantSession } from "@/lib/session";
import PasswordForm from "./PasswordForm";
import EmailForm from "./EmailForm";

export default async function SettingsPage() {
  const { session } = await requireTenantSession();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Account settings</h1>
      </div>

      <div className="p-6 max-w-lg space-y-5">
        <div className="card">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Signed in as</h2>
          <p className="text-sm text-gray-900 font-medium">{session.user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{session.user.name}</p>
        </div>

        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-1">Change email</h2>
          <p className="text-xs text-gray-400 mb-4">You'll be signed out after changing your email — sign back in with the new address.</p>
          <EmailForm />
        </div>

        <div className="card">
          <h2 className="text-sm font-medium text-gray-900 mb-1">Change password</h2>
          <p className="text-xs text-gray-400 mb-4">Use at least 8 characters.</p>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
