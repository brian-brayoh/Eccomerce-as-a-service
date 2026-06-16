import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/session";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Handles product image uploads from the dashboard.
 *
 * Files are stored under a tenant-scoped path
 * (`products/{tenantSlug}/{timestamp}-{filename}`) so that two
 * tenants uploading files with the same name never collide, and
 * so it's easy to identify which tenant a file belongs to just by
 * looking at the Blob URL.
 */
export async function POST(request: Request) {
  // Ensures only a logged-in tenant admin/staff can upload — and
  // resolves which tenant the upload belongs to.
  const { tenant } = await requireTenantSession();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const pathname = `products/${tenant.slug}/${Date.now()}-${safeName}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}
