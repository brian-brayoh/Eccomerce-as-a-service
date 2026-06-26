import { getCurrentTenantOrThrow } from "@/lib/session";
import { getCurrentCustomer } from "@/lib/customer-session";
import { redirect, notFound } from "next/navigation";
import StorefrontHeader from "@/components/StorefrontHeader";
import { prisma } from "@/lib/prisma";
import SignupForm from "./SignupForm";
import Link from "next/link";

export default async function SignupPage() {
  let tenant;
  try {
    tenant = await getCurrentTenantOrThrow();
  } catch {
    notFound();
  }

  const existingCustomer = await getCurrentCustomer();
  if (existingCustomer) redirect("/account");

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader tenantName={tenant.name} categories={categories} />

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">Shop faster and track your orders with {tenant.name}</p>
          </div>

          <div className="card">
            <SignupForm />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/account/login" className="font-medium text-brand-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
