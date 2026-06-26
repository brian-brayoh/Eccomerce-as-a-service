import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import BannerForm from "./BannerForm";
import BannerRow from "./BannerRow";
import Link from "next/link";

export default async function BannersPage() {
  const { tenant } = await requireTenantSession();

  const banners = await prisma.banner.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ placement: "asc" }, { position: "asc" }],
  });

  const grouped = {
    HOMEPAGE_HERO: banners.filter((b) => b.placement === "HOMEPAGE_HERO"),
    HOMEPAGE_PROMO: banners.filter((b) => b.placement === "HOMEPAGE_PROMO"),
    CATEGORY_TOP: banners.filter((b) => b.placement === "CATEGORY_TOP"),
  };

  const PLACEMENT_LABELS: Record<string, string> = {
    HOMEPAGE_HERO: "Homepage hero slider",
    HOMEPAGE_PROMO: "Homepage promo strip",
    CATEGORY_TOP: "Category page top",
  };

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Marketing</p>
          <h1 className="text-sm font-semibold text-gray-900">Banners</h1>
        </div>
        <Link href="/dashboard/marketing/popups" className="text-xs font-medium text-gray-500 hover:text-gray-700">
          Switch to Popups →
        </Link>
      </div>

      <div className="p-6 space-y-6">
        <div className="card">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Add new banner</h2>
          <BannerForm />
        </div>

        {Object.entries(grouped).map(([placement, items]) => (
          <div key={placement}>
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">{PLACEMENT_LABELS[placement]}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 pl-1">No banners here yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((b) => (
                  <BannerRow
                    key={b.id}
                    banner={{
                      id: b.id,
                      title: b.title,
                      imageUrl: b.imageUrl,
                      linkUrl: b.linkUrl,
                      placement: b.placement,
                      active: b.active,
                      startDate: b.startDate?.toISOString().slice(0, 10) ?? null,
                      endDate: b.endDate?.toISOString().slice(0, 10) ?? null,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
