"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PopupData = {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export default function StorefrontPopup({ popup }: { popup: PopupData }) {
  const [visible, setVisible] = useState(false);
  const storageKey = `pc_popup_dismissed_${popup.id}`;

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(storageKey)) return;

    // Show after a short delay so it doesn't flash immediately on load
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [storageKey]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(storageKey, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={dismiss}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {popup.imageUrl && (
          <div className="aspect-video w-full overflow-hidden">
            <img src={popup.imageUrl} alt={popup.title ?? ""} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-6">
          {popup.title && (
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{popup.title}</h2>
          )}
          {popup.message && (
            <p className="text-sm text-gray-600 leading-relaxed">{popup.message}</p>
          )}

          <div className="mt-5 flex items-center gap-3">
            {popup.buttonText && popup.buttonLink && (
              <Link href={popup.buttonLink} onClick={dismiss} className="btn-primary">
                {popup.buttonText}
              </Link>
            )}
            <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600">
              {popup.buttonText ? "No thanks" : "Close"}
            </button>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
