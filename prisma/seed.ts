// ============================================================
// Seed script — creates PrintCare as the first tenant.
//
// Run with: npx prisma db seed
// (configure in package.json: "prisma": { "seed": "ts-node prisma/seed.ts" })
// ============================================================

import { PrismaClient, UserRole, SubscriptionPlan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Create PrintCare tenant ──────────────────────────
  const printcare = await prisma.tenant.upsert({
    where: { slug: "printcare" },
    update: {},
    create: {
      name: "PrintCare",
      slug: "printcare",
      phone: "+254700000000",
      email: "info@printcare.co.ke",
      plan: SubscriptionPlan.BUSINESS,
    },
  });

  console.log(`✅ Tenant created: ${printcare.name} (${printcare.id})`);

  // ── 2. Create admin user for PrintCare ──────────────────
  const hashedPassword = await bcrypt.hash("ChangeMe123!", 10);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: printcare.id, email: "admin@printcare.co.ke" } },
    update: {},
    create: {
      tenantId: printcare.id,
      name: "PrintCare Admin",
      email: "admin@printcare.co.ke",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (password: ChangeMe123!)`);

  // ── 2b. Create platform Super Admin (not tied to one tenant's data,
  //        but must belong to a tenant row due to schema constraints —
  //        we attach it to PrintCare as a technicality) ────────────
  const superAdminPassword = await bcrypt.hash("SuperAdmin123!", 10);
  const superAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: printcare.id, email: "owner@yourplatform.com" } },
    update: {},
    create: {
      tenantId: printcare.id,
      name: "Platform Owner",
      email: "owner@yourplatform.com",
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email} (password: SuperAdmin123!)`);

  // ── 3. Create categories (with one level of nesting) ────
  const printers = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "printers" } },
    update: {},
    create: { tenantId: printcare.id, name: "Printers", slug: "printers" },
  });

  const laserPrinters = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "laser-printers" } },
    update: {},
    create: {
      tenantId: printcare.id,
      name: "Laser Printers",
      slug: "laser-printers",
      parentId: printers.id,
    },
  });

  const inkjetPrinters = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "inkjet-printers" } },
    update: {},
    create: {
      tenantId: printcare.id,
      name: "Inkjet Printers",
      slug: "inkjet-printers",
      parentId: printers.id,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "accessories" } },
    update: {},
    create: { tenantId: printcare.id, name: "Accessories", slug: "accessories" },
  });

  await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "toners" } },
    update: {},
    create: {
      tenantId: printcare.id,
      name: "Toners & Cartridges",
      slug: "toners",
      parentId: accessories.id,
    },
  });

  console.log("✅ Categories created");

  // ── 4. Create sample products ───────────────────────────
  await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "hp-laserjet-pro-mfp-m428fdw" } },
    update: {},
    create: {
      tenantId: printcare.id,
      categoryId: laserPrinters.id,
      name: "HP LaserJet Pro MFP M428fdw",
      slug: "hp-laserjet-pro-mfp-m428fdw",
      description: "All-in-one monochrome laser printer with fast duplex printing, scanning, and faxing.",
      price: 55000,
      salePrice: 49500,
      brand: "HP",
      sku: "HP-M428FDW",
      stock: 12,
      featured: true,
      specs: {
        "Print Speed": "38 ppm",
        "Connectivity": "Wi-Fi, Ethernet, USB",
        "Functions": "Print, Scan, Copy, Fax",
        "Duplex Printing": "Yes",
      },
    },
  });

  await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: printcare.id, slug: "epson-ecotank-l3250" } },
    update: {},
    create: {
      tenantId: printcare.id,
      categoryId: inkjetPrinters.id,
      name: "Epson EcoTank L3250",
      slug: "epson-ecotank-l3250",
      description: "Wireless all-in-one ink tank printer with low running costs — ideal for home and small offices.",
      price: 22000,
      brand: "Epson",
      sku: "EP-L3250",
      stock: 25,
      featured: true,
      specs: {
        "Print Speed": "10 ppm (black)",
        "Connectivity": "Wi-Fi, USB",
        "Functions": "Print, Scan, Copy",
        "Tank Capacity": "Up to 7,500 pages (black)",
      },
    },
  });

  console.log("✅ Sample products created");

  // ── 5. Create a welcome popup ───────────────────────────
  await prisma.popup.create({
    data: {
      tenantId: printcare.id,
      type: "WELCOME",
      title: "Welcome to PrintCare!",
      message: "Browse our latest printers and accessories. Chat with us on WhatsApp for instant help.",
      buttonText: "Shop Now",
      buttonLink: "/products",
      enabled: false,
    },
  });

  console.log("✅ Sample popup created");
  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
