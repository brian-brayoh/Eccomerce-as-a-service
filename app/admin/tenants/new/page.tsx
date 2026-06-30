import CreateTenantForm from "./CreateTenantForm";

export default function NewTenantPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Add new tenant</h1>
      </div>

      <div className="p-6 max-w-xl">
        <div className="card space-y-1 mb-5 bg-blue-50 border-blue-200">
          <p className="text-xs font-medium text-blue-800">How domains work</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            If the business has their own domain (e.g. <code>bmmcreations.com</code>), enter it below —
            they'll need to point a CNAME record to your platform.
            If they don't have one, leave it blank and the system will assign them a subdomain
            automatically (e.g. <code>bmmcreations.yourplatform.com</code>).
          </p>
        </div>

        <div className="card">
          <CreateTenantForm />
        </div>
      </div>
    </div>
  );
}
