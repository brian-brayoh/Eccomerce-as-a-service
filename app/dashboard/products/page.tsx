import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import Link from "next/link";
import ProductRow from "./ProductRow";

export default async function ProductsPage() {
  const { tenant, isImpersonating } = await requireTenantSession();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { category: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Products</h1>
          {isImpersonating && <p className="text-xs text-gray-400">{tenant.name}</p>}
        </div>
        <Link href="/dashboard/products/new" className="btn-primary text-xs py-1.5 px-3">
          + Add product
        </Link>
      </div>

      <div className="p-6">
        {products.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-500 mb-2">No products yet.</p>
            <Link href="/dashboard/products/new" className="text-sm font-medium text-brand-500 hover:underline">
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400">Featured</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: p.price.toNumber(),
                      salePrice: p.salePrice?.toNumber() ?? null,
                      stock: p.stock,
                      status: p.status,
                      featured: p.featured,
                      categoryName: p.category?.name ?? "—",
                      imageUrl: p.images[0]?.url ?? null,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
