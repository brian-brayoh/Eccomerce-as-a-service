import { getCurrentTenant } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { emailUpdated?: string };
}) {
  const tenant = await getCurrentTenant();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white text-xl font-semibold">
              {tenant?.name?.charAt(0) ?? "P"}
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {tenant?.name ?? "BMM Creations"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your dashboard</p>
        </div>

        {searchParams.emailUpdated && (
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-center text-sm text-brand-600">
            ✓ Email updated. Sign in with your new email address.
          </p>
        )}

        <div className="card">
          <LoginForm />
        </div>

        {!tenant && (
          <p className="mt-4 text-center text-xs text-gray-400">
            No store found for this address. Check your domain configuration
            or set <code className="rounded bg-gray-100 px-1">DEFAULT_TENANT_SLUG</code> in your environment.
          </p>
        )}
      </div>
    </div>
  );
}
