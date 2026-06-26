"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type BannerItem = {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
};

export default function BannerCarousel({ banners }: { banners: BannerItem[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const content = (
    <div className="relative w-full overflow-hidden rounded-2xl aspect-[3/1] bg-gray-100">
      <img
        src={banner.imageUrl}
        alt={banner.title ?? "Banner"}
        className="h-full w-full object-cover transition-opacity duration-500"
      />
      {banner.title && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-6">
          <p className="text-white text-lg font-semibold">{banner.title}</p>
        </div>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return banner.linkUrl ? (
    <Link href={banner.linkUrl}>{content}</Link>
  ) : (
    content
  );
}
