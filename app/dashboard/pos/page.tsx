import { requireTenantSession } from "@/lib/session";
import PosClient from "./PosClient";

export default async function PosPage() {
  const { tenant } = await requireTenantSession();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="border-b border-gray-100 bg-white px-6 py-3.5 flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">
          Point of Sale
          <span className="ml-2 text-xs font-normal text-gray-400">{tenant.name}</span>
        </h1>
      </div>
      <PosClient mpesaEnabled={tenant.mpesaEnabled} />
    </div>
  );
}
