"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { customerLogout } from "@/app/account/actions";

const NAV = [
  { href: "/account",          label: "Overview" },
  { href: "/account/orders",   label: "Order history" },
  { href: "/account/wishlist", label: "Wishlist" },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block rounded-lg px-3 py-2 text-sm font-medium ${
            pathname === item.href ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <form action={customerLogout} className="pt-1">
        <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          Sign out
        </button>
      </form>
    </nav>
  );
}
