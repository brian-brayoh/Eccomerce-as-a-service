import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/session";
import ProductForm from "../../ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { tenant } = await requireTenantSession();

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: { images: { take: 1, orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-3.5">
        <h1 className="text-sm font-semibold text-gray-900">Edit product</h1>
      </div>
      <div className="p-6">
        <div className="card max-w-2xl">
          <ProductForm
            categories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price.toString(),
              salePrice: product.salePrice?.toString() ?? null,
              brand: product.brand,
              sku: product.sku,
              stock: product.stock,
              featured: product.featured,
              categoryId: product.categoryId,
              imageUrl: product.images[0]?.url ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
