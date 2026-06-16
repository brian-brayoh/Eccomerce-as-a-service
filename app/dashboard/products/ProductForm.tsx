"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "./actions";
import ImageUpload from "@/components/ImageUpload";

type Category = { id: string; name: string; parentId: string | null };

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  salePrice: string | null;
  brand: string | null;
  sku: string | null;
  stock: number;
  featured: boolean;
  categoryId: string | null;
  imageUrl: string | null;
};

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductData;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard/products");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Product name</label>
          <input type="text" name="name" defaultValue={product?.name} placeholder="e.g. HP LaserJet Pro MFP M428fdw" required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Price (KES)</label>
          <input type="number" name="price" min="0" step="0.01" defaultValue={product?.price} placeholder="55000" required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Sale price (optional)</label>
          <input type="number" name="salePrice" min="0" step="0.01" defaultValue={product?.salePrice ?? ""} placeholder="49500" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Category</label>
          <select name="categoryId" defaultValue={product?.categoryId ?? ""}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? "— " : ""}{c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Brand</label>
          <input type="text" name="brand" defaultValue={product?.brand ?? ""} placeholder="e.g. HP" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">SKU</label>
          <input type="text" name="sku" defaultValue={product?.sku ?? ""} placeholder="e.g. HP-M428FDW" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Stock quantity</label>
          <input type="number" name="stock" min="0" defaultValue={product?.stock ?? 0} required />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Product image</label>
          <ImageUpload name="imageUrl" defaultUrl={product?.imageUrl} />
        </div>


        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            placeholder="Describe the product, features, what's in the box, etc."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="featured" name="featured" defaultChecked={product?.featured} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
          <label htmlFor="featured" className="text-sm text-gray-700">Show on homepage as featured product</label>
        </div>
      </div>

      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        <button type="button" onClick={() => router.push("/dashboard/products")} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}
