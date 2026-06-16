import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const { tenant } = await requireTenantSession();

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Add product</h1>
      </div>
      <div className="p-6">
        <div className="card max-w-2xl">
          <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))} />
        </div>
      </div>
    </div>
  );
}
