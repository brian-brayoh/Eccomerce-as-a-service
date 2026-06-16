import Link from "next/link";

export default function StorefrontHeader({ tenantName, categories }: {
  tenantName: string;
  categories: { name: string; slug: string }[];
}) {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white">
              {tenantName.charAt(0)}
            </div>
            <span className="text-lg font-semibold text-gray-900">{tenantName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/products" className="hover:text-gray-900">All Products</Link>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.slug} href={`/products?category=${c.slug}`} className="hover:text-gray-900">
                {c.name}
              </Link>
            ))}
          </nav>

          <a
            href="https://wa.me/254700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 transition"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.15.34-.394.51-.59.171-.198.227-.339.341-.566.114-.226.057-.423-.041-.572-.099-.149-.872-2.105-1.196-2.879-.317-.758-.64-.655-.881-.667-.227-.012-.487-.014-.747-.014-.26 0-.682.098-.929.46-.247.36-.943 1.232-.943 2.605 0 1.373.964 2.7 1.099 2.886.135.187 1.857 2.834 4.502 3.97 2.645 1.135 2.645.756 3.107.71.46-.046 1.857-.756 2.123-1.481.266-.726.266-1.346.187-1.481-.077-.135-.297-.21-.594-.359z" />
              <path d="M12.04 0C5.39 0 0 5.39 0 12.04c0 2.122.55 4.116 1.516 5.85L0 24l6.21-1.49a11.95 11.95 0 005.83 1.49c6.65 0 12.04-5.39 12.04-12.04S18.69 0 12.04 0zm0 21.83a9.78 9.78 0 01-4.98-1.36l-.357-.21-3.69.886.985-3.594-.232-.369A9.78 9.78 0 012.21 12.04c0-5.42 4.41-9.83 9.83-9.83s9.83 4.41 9.83 9.83-4.41 9.83-9.83 9.83z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
}
