"use client";

import { useState } from "react";
import { togglePopup, deletePopup } from "./actions";
import PopupForm from "./PopupForm";

type PopupData = {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  enabled: boolean;
  startDate: string | null;
  endDate: string | null;
};

const TYPE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: "bg-blue-50 text-blue-700",
  WELCOME: "bg-purple-50 text-purple-700",
  DISCOUNT: "bg-orange-50 text-orange-700",
  NEW_ARRIVALS: "bg-green-50 text-green-700",
  NEWSLETTER: "bg-pink-50 text-pink-700",
};

export default function PopupCard({ popup }: { popup: PopupData }) {
  const [enabled, setEnabled] = useState(popup.enabled);
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    await togglePopup(popup.id, next);
  }

  async function handleDelete() {
    if (!confirm("Delete this popup?")) return;
    await deletePopup(popup.id);
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className={`card ${!enabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[popup.type] ?? "bg-gray-100 text-gray-600"}`}>
            {popup.type.replace("_", " ")}
          </span>
          <span className="text-sm font-medium text-gray-900">{popup.title ?? "Untitled"}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${enabled ? "bg-brand-500" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          <button onClick={() => setEditing(!editing)} className="text-xs font-medium text-brand-500 hover:underline">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-danger-500">Delete</button>
        </div>
      </div>

      {popup.message && <p className="text-sm text-gray-600 mb-2">{popup.message}</p>}
      {popup.buttonText && (
        <p className="text-xs text-gray-400">Button: "{popup.buttonText}" → {popup.buttonLink ?? "no link"}</p>
      )}
      {(popup.startDate || popup.endDate) && (
        <p className="text-xs text-gray-400 mt-1">
          {popup.startDate && `From ${popup.startDate}`}{popup.endDate && ` to ${popup.endDate}`}
        </p>
      )}

      {editing && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <PopupForm 
            initial={{
              ...popup,
              title: popup.title ?? undefined,
              message: popup.message ?? undefined,
              buttonText: popup.buttonText ?? undefined,
              buttonLink: popup.buttonLink ?? undefined,
              imageUrl: popup.imageUrl ?? undefined,
              startDate: popup.startDate ?? undefined,
              endDate: popup.endDate ?? undefined,
            }} 
          />
        </div>
      )}
    </div>
  );
}