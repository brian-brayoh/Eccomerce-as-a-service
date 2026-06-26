import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WishlistGrid from "./WishlistGrid";

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const items = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    include: {
      product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const validItems = items.filter((i) => i.product); // guard against orphaned rows

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Wishlist</h1>

      {validItems.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm text-gray-400 mb-2">Your wishlist is empty.</p>
          <Link href="/products" className="text-sm font-medium text-brand-500 hover:underline">Browse products →</Link>
        </div>
      ) : (
        <WishlistGrid
          items={validItems.map((i) => ({
            wishlistItemId: i.id,
            slug: i.product.slug,
            name: i.product.name,
            price: i.product.price.toNumber(),
            salePrice: i.product.salePrice?.toNumber() ?? null,
            brand: i.product.brand,
            imageUrl: i.product.images[0]?.url ?? null,
            stock: i.product.stock,
          }))}
        />
      )}
    </div>
  );
}
