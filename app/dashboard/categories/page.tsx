import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import CategoryForm from "./CategoryForm";
import CategoryRow from "./CategoryRow";

export default async function CategoriesPage() {
  const { tenant } = await requireTenantSession();

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  // Build a simple two-level tree: top-level categories with their children nested
  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  // Flat list for the "parent" dropdown — exclude nothing here since
  // creation doesn't need self-exclusion (only edit does, handled client-side)
  const parentOptions = categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }));

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Categories</h1>
      </div>

      <div className="p-6 space-y-5">
        <div className="card">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">Add category</h2>
          <CategoryForm parentOptions={parentOptions} />
        </div>

        <div className="card overflow-hidden p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No categories yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Slug</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Products</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topLevel.map((cat) => (
                  <>
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      depth={0}
                      parentOptions={parentOptions}
                    />
                    {childrenOf(cat.id).map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        depth={1}
                        parentOptions={parentOptions}
                      />
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
