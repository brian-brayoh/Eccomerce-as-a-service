"use client";

import { useState } from "react";
import { toggleBanner, deleteBanner } from "./actions";

type BannerData = {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
};

export default function BannerRow({ banner }: { banner: BannerData }) {
  const [active, setActive] = useState(banner.active);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const next = !active;
    setActive(next);
    await toggleBanner(banner.id, next);
  }

  async function handleDelete() {
    if (!confirm("Delete this banner?")) return;
    setLoading(true);
    await deleteBanner(banner.id);
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className={`card flex items-center gap-4 p-3 ${!active ? "opacity-60" : ""}`}>
      <div className="h-14 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <img src={banner.imageUrl} alt={banner.title ?? "Banner"} className="h-full w-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{banner.title ?? "Untitled banner"}</p>
        <p className="text-xs text-gray-400">
          {banner.linkUrl ? `→ ${banner.linkUrl}` : "No link"}
          {banner.startDate && ` · From ${banner.startDate}`}
          {banner.endDate && ` to ${banner.endDate}`}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${active ? "bg-brand-500" : "bg-gray-200"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${active ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <button onClick={handleDelete} disabled={loading} className="text-xs text-gray-400 hover:text-danger-500">
          Delete
        </button>
      </div>
    </div>
  );
}
