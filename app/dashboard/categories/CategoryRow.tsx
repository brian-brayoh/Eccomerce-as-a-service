"use client";

import { useState } from "react";
import { updateCategory, deleteCategory } from "./actions";

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count: { products: number; children: number };
};

type ParentOption = { id: string; name: string; parentId: string | null };

export default function CategoryRow({
  category,
  depth,
  parentOptions,
}: {
  category: CategoryWithCount;
  depth: number;
  parentOptions: ParentOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [parentId, setParentId] = useState(category.parentId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Only top-level categories (excluding self) can be a parent
  const topLevelOptions = parentOptions.filter((p) => !p.parentId && p.id !== category.id);

  async function handleSave() {
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("parentId", parentId);

    const result = await updateCategory(category.id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"?`)) return;
    setError("");
    const result = await deleteCategory(category.id);
    if (result?.error) setError(result.error);
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3" style={{ paddingLeft: `${16 + depth * 24}px` }}>
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="!w-44"
          />
        ) : (
          <span className="font-medium text-gray-800">
            {depth > 0 && <span className="text-gray-300 mr-1">└─</span>}
            {category.name}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400">{category.slug}</td>
      <td className="px-4 py-3 text-right text-gray-600">{category._count.products}</td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-2">
            {depth === 0 ? null : (
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="!w-32 text-xs">
                <option value="">— Top level —</option>
                {topLevelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            )}
            <button onClick={handleSave} disabled={loading} className="text-xs font-medium text-brand-500 hover:underline">
              {loading ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setError(""); }} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand-500 hover:underline">
              Edit
            </button>
            <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-danger-500">
              Delete
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      </td>
    </tr>
  );
}
