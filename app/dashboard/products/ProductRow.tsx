"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteProduct, toggleFeatured } from "./actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
  featured: boolean;
  categoryName: string;
  imageUrl: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ACTIVE:       { bg: "#E1F5EE", text: "#0F6E56" },
  DRAFT:        { bg: "#F3F4F6", text: "#4B5563" },
  OUT_OF_STOCK: { bg: "#FAECE7", text: "#993C1D" },
  ARCHIVED:     { bg: "#F3F4F6", text: "#9CA3AF" },
};

function fmt(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export default function ProductRow({ product: p }: { product: Product }) {
  const [featured, setFeatured] = useState(p.featured);
  const [deleting, setDeleting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [archivedMsg, setArchivedMsg] = useState("");

  async function handleToggleFeatured() {
    const next = !featured;
    setFeatured(next);
    await toggleFeatured(p.id, next);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setDeleting(true);
    const result = await deleteProduct(p.id);
    if (result?.archived) {
      setArchivedMsg("Archived (has order history)");
    } else if (result?.success) {
      setHidden(true);
    }
    setDeleting(false);
  }

  if (hidden) return null;

  const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.DRAFT;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-300 text-xs">No img</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{p.name}</p>
            <p className="text-xs text-gray-400">/{p.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{p.categoryName}</td>
      <td className="px-4 py-3 text-right">
        {p.salePrice ? (
          <div>
            <span className="font-medium text-danger-500">{fmt(p.salePrice)}</span>
            <span className="ml-1.5 text-xs text-gray-400 line-through">{fmt(p.price)}</span>
          </div>
        ) : (
          <span className="text-gray-700">{fmt(p.price)}</span>
        )}
      </td>
      <td className={`px-4 py-3 text-right ${p.stock <= 5 ? "text-amber-600 font-medium" : "text-gray-600"}`}>
        {p.stock}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: st.bg, color: st.text }}>
          {p.status.replace("_", " ")}
        </span>
        {archivedMsg && <p className="text-xs text-gray-400 mt-1">{archivedMsg}</p>}
      </td>
      <td className="px-4 py-3 text-center">
        <button onClick={handleToggleFeatured} className="text-lg" title="Toggle featured">
          {featured ? "⭐" : "☆"}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <Link href={`/dashboard/products/${p.id}/edit`} className="text-xs font-medium text-brand-500 hover:underline">
            Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="text-xs text-gray-400 hover:text-danger-500 disabled:opacity-50">
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}
