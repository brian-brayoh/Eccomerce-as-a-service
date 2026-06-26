import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import PopupForm from "./PopupForm";
import PopupCard from "./PopupCard";
import Link from "next/link";

export default async function PopupsPage() {
  const { tenant } = await requireTenantSession();

  const popups = await prisma.popup.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Marketing</p>
          <h1 className="text-sm font-semibold text-gray-900">Popups</h1>
        </div>
        <Link href="/dashboard/marketing/banners" className="text-xs font-medium text-gray-500 hover:text-gray-700">
          Switch to Banners →
        </Link>
      </div>

      <div className="p-6 space-y-5">
        <div className="card">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Create popup</h2>
          <PopupForm />
        </div>

        {popups.length === 0 ? (
          <p className="text-sm text-gray-400 pl-1">No popups yet.</p>
        ) : (
          <div className="space-y-3">
            {popups.map((p) => (
              <PopupCard
                key={p.id}
                popup={{
                  id: p.id,
                  type: p.type,
                  title: p.title,
                  message: p.message,
                  buttonText: p.buttonText,
                  buttonLink: p.buttonLink,
                  imageUrl: p.imageUrl,
                  enabled: p.enabled,
                  startDate: p.startDate?.toISOString().slice(0, 10) ?? null,
                  endDate: p.endDate?.toISOString().slice(0, 10) ?? null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
