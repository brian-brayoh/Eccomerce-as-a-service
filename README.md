# PrintCare Commerce SaaS — Database Schema (V1.0 Foundation)

This is the **multi-tenant Prisma schema**. PrintCare is tenant #1 — but every
table is designed so a second business (ABC Electronics, Office World, etc.)
can be added with **zero schema changes**, just a new row in `Tenant`.

---

## 🏗️ Core Design Principle: `tenantId` Everywhere

Every business-data table — `Product`, `Category`, `Order`, `Customer`,
`Offer`, `Popup`, `Banner`, `BlogPost` — has a `tenantId` foreign key
pointing to `Tenant`. There is **no special PrintCare table** anywhere.

```
Tenant (id: "printcare")
  ├── Category   (tenantId = "printcare")
  ├── Product    (tenantId = "printcare")
  ├── Order      (tenantId = "printcare")
  ├── Customer   (tenantId = "printcare")
  └── ...

Tenant (id: "abc-electronics")  ← added later, same tables, instant isolation
  ├── Category   (tenantId = "abc-electronics")
  ├── Product    (tenantId = "abc-electronics")
  └── ...
```

**Every query in the app must filter by `tenantId`.** This is the only rule
that keeps tenants isolated — there's no database-level row security here
(Prisma + Postgres doesn't give you that automatically), so it has to be
enforced in application code (middleware resolves the tenant from the
subdomain/domain, then every Prisma query includes `where: { tenantId }`).

---

## 📦 Tables Overview

| Table | Purpose |
|---|---|
| `Tenant` | One row per business (PrintCare, ABC Electronics...). Holds plan, custom domain, branding. |
| `SubscriptionEvent` | Billing history — every payment/plan change is logged here. |
| `User` | Staff accounts (ADMIN, STAFF, SUPER_ADMIN). Scoped per tenant. |
| `Category` | Self-referencing (`parentId`) for nested categories like Printers → Laser Printers. |
| `Product` | Core catalog item. `specs` is a JSON field for flexible key/value specs. |
| `ProductImage` | Multiple images per product, ordered by `position`. |
| `Customer` | Storefront accounts — separate from staff `User`. Supports guest checkout (no password). |
| `Address` | Saved shipping addresses per customer. |
| `WishlistItem` | Customer ↔ Product saved items. |
| `Review` | Star ratings + comments per product. |
| `Order` | Supports both registered customers and guest checkout (`guestName`, `guestPhone`, etc.) |
| `OrderItem` | Snapshots `productName` and `unitPrice` at time of order — so historical orders stay accurate even if the product is edited/deleted later. |
| `Payment` | M-Pesa/Pesapal/Flutterwave/cash records, linked to an order. |
| `Offer` | Automatic promotions ("20% Off HP Printers"). |
| `Coupon` | Manual discount codes ("SAVE10"). |
| `Popup` | Welcome/discount/newsletter popups with scheduling. |
| `Banner` | Homepage hero/promo banners with placement + scheduling. |
| `BlogPost` | SEO content with meta tags. |
| `NewsletterSubscriber` | Email capture, scoped per tenant. |

---

## 🔑 Key Design Decisions

### 1. Slugs are unique **per tenant**, not globally
```prisma
@@unique([tenantId, slug])
```
This means PrintCare can have `/products/hp-laserjet-pro` and ABC Electronics
can *also* have a product at `/products/hp-laserjet-pro` — they don't collide,
because each tenant has its own URL namespace (subdomain or custom domain).

### 2. Order items snapshot product data
`OrderItem` stores `productName` and `unitPrice` directly instead of always
joining to `Product`. If PrintCare edits a product's price next month, last
month's orders still show what the customer actually paid.

### 3. Guest checkout is built in from day one
`Order.customerId` is optional. `guestName`, `guestPhone`, `guestEmail` cover
walk-in/WhatsApp orders where no account exists. This matches the V1.0
requirement for WhatsApp ordering without forcing signups.

### 4. Categories support unlimited nesting
```prisma
parentId  String?
parent    Category? @relation("CategoryToSubcategory", ...)
children  Category[] @relation("CategoryToSubcategory")
```
Covers `Printers → Laser Printers → (future: Color Laser)` without schema changes.

### 5. Specs are JSON, not rigid columns
Different product categories need different spec fields (a printer needs
"Print Speed"; a toner needs "Page Yield"). `Product.specs` is a `Json`
column so the admin can add any key/value pairs per product.

### 6. Billing is decoupled from the tenant row
`Tenant.plan` shows the *current* plan, but `SubscriptionEvent` is an
append-only log of every payment — needed for the Super Admin revenue
dashboard in Phase 2.

### 7. Roles are tenant-scoped, except SUPER_ADMIN
```prisma
enum UserRole {
  SUPER_ADMIN  // platform owner
  ADMIN        // tenant owner (e.g. PrintCare's owner)
  STAFF        // tenant employee
}
```
A `SUPER_ADMIN` user manages the whole platform (`/admin/tenants`,
`/admin/subscriptions`). `ADMIN`/`STAFF` only ever see their own tenant's data.

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure database
Copy `.env.example` to `.env` and add your PostgreSQL connection string
(Supabase, Neon, Railway, or any Postgres host).

```bash
cp .env.example .env
```

### 3. Push schema to database
```bash
npm run db:push
```
(Use `db:migrate` instead if you want versioned migration files for production.)

### 4. Seed PrintCare as the first tenant
```bash
npm run db:seed
```

This creates:
- Tenant: **PrintCare** (`slug: "printcare"`)
- Admin login: `admin@printcare.co.ke` / `ChangeMe123!` ⚠️ change this immediately
- Categories: Printers → Laser/Inkjet, Accessories → Toners
- 2 sample products (HP LaserJet, Epson EcoTank)
- 1 disabled welcome popup

### 5. Explore the data
```bash
npm run db:studio
```
Opens Prisma Studio — a visual database browser.

---

## 🔮 What Comes Next (V1.0 build order)

This schema supports the full V1.0 feature set immediately:

1. **Auth** — `User` table + Auth.js credentials provider (tenant resolved via middleware)
2. **Product catalog** — `Product`, `Category`, `ProductImage` already modeled
3. **Admin dashboard** — CRUD on `Product`/`Category`, scoped by `tenantId` from session
4. **Public storefront** — homepage, category pages, product detail — all query by `tenantId`
5. **WhatsApp orders** — `Order` with `channel: WHATSAPP` and guest fields, no payment needed yet

Later versions (1.5+) layer on `OrderItem`, `Payment`, `Coupon`, `Offer`,
`Popup`, `Banner`, `BlogPost` — all already present in this schema so no
migrations are needed when you build those features.

---

## ⚠️ Multi-Tenancy Reminder for Developers

**Every Prisma query that touches business data MUST include `tenantId`.**

```ts
// ❌ WRONG — leaks data across tenants
const products = await prisma.product.findMany();

// ✅ CORRECT — scoped to the current tenant
const products = await prisma.product.findMany({
  where: { tenantId: currentTenant.id },
});
```

Consider wrapping Prisma in a helper that injects `tenantId` automatically
once you start building the app layer, to make this mistake impossible.

---

# 🔐 Authentication & Tenant Resolution (V1.0 Layer 2)

This layer adds **Next.js + Auth.js + middleware-based tenant resolution**
on top of the schema.

## How a request resolves to a tenant

Every request hits `middleware.ts` first, which calls
`getTenantIdentifierFromHost()`:

| Hostname | Resolves to |
|---|---|
| `printcare.yourplatform.com` | `Tenant.slug = "printcare"` |
| `printcare.co.ke` (custom domain) | `Tenant.customDomain = "printcare.co.ke"` |
| `printcare.localhost:3000` (local dev) | `Tenant.slug = "printcare"` |
| `localhost:3000` (local dev, no subdomain) | `DEFAULT_TENANT_SLUG` env var |

This identifier is attached as a request header (`x-tenant-slug` /
`x-tenant-domain`) and re-resolved into a full `Tenant` row via
`getTenantByHost()` (cached per-request with React's `cache()`).

## Login flow

1. User visits `printcare.yourplatform.com/login`
2. `lib/auth.ts`'s `authorize()` reads the `host` header, resolves the
   tenant, then looks up `User` by `{ tenantId, email }` — **the same
   email can exist under different tenants** because of
   `@@unique([tenantId, email])` in the schema.
3. On success, the JWT/session carries `role`, `tenantId`, and `tenantSlug`.

## The critical guard: `requireTenantSession()`

A user could theoretically have a valid session cookie for Tenant A but
visit Tenant B's subdomain. `lib/session.ts`'s `requireTenantSession()`
checks `session.user.tenantId === tenant.id` (tenant resolved from the
*current* hostname) and redirects to `/login` if they don't match. Every
`/dashboard/**` page must call this before querying the database.

```ts
// app/dashboard/some-page/page.tsx
export default async function SomePage() {
  const { session, tenant } = await requireTenantSession();
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id }, // always scope by tenant.id
  });
  // ...
}
```

## Roles

| Role | Access |
|---|---|
| `STAFF` | `/dashboard/**` for their own tenant |
| `ADMIN` | `/dashboard/**` for their own tenant (same access as STAFF for now — extend with permission checks as needed) |
| `SUPER_ADMIN` | `/admin/**` — platform-wide tenant list, subscriptions, revenue |

## Setup

1. Generate an auth secret:
   ```bash
   npx auth secret
   ```
   Paste the output into `.env` as `AUTH_SECRET`.

2. Set `ROOT_DOMAIN` and `DEFAULT_TENANT_SLUG` in `.env` (see `.env.example`).

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. **Local testing without subdomains**: visit `http://localhost:3000/login`
   — this resolves to `DEFAULT_TENANT_SLUG` ("printcare" by default).

5. **Local testing WITH subdomains**: visit
   `http://printcare.localhost:3000/login` — most browsers resolve
   `*.localhost` to `127.0.0.1` automatically, no `/etc/hosts` edit needed.

6. Seeded logins:
   - **Tenant admin**: `admin@printcare.co.ke` / `ChangeMe123!` → redirects to `/dashboard`
   - **Super admin**: `owner@yourplatform.com` / `SuperAdmin123!` → redirects to `/admin`

   ⚠️ Change both passwords immediately in production.

## Production domain setup

- Point `*.yourplatform.com` (wildcard subdomain) at your Vercel deployment
- For Enterprise tenants with custom domains (`printcare.co.ke`), add the
  domain in Vercel's dashboard AND set `Tenant.customDomain` to match

---

# 🔁 Super Admin: Tenant Switcher (V1.0 Layer 3)

The Super Admin (`owner@yourplatform.com`) manages the whole platform from
`/admin`, but also needs to actually *use* each tenant's `/dashboard` — to
help onboard a new client, debug an issue, or just check on a customer.

## How it works

1. From `/admin` (Tenants list), click **"Manage →"** next to any tenant.
2. This sets an httpOnly cookie (`pc_view_as_tenant`) and redirects to `/dashboard`.
3. While that cookie is set, `requireTenantSession()` (in `lib/session.ts`)
   shows that tenant's data instead of resolving from the hostname.
4. An amber banner appears at the top of every `/dashboard` page:
   *"👁 Viewing **[Tenant Name]**'s dashboard as Super Admin"*
5. A dropdown in the sidebar also lets the Super Admin switch tenants
   without going back to `/admin`.
6. Click **"← Back to platform admin"** to clear the cookie and return to `/admin`.

## Why a cookie instead of a URL param

A cookie persists across navigation within `/dashboard/**` without needing
every link to carry `?tenant=...`. It's scoped to 24 hours and is only ever
honored for `SUPER_ADMIN` sessions — `lib/session.ts` checks
`session.user.role === "SUPER_ADMIN"` before even looking at the cookie, so
a regular tenant ADMIN/STAFF can never use this to view another tenant's data.

## Files

| File | Role |
|---|---|
| `app/dashboard/tenant-actions.ts` | `setViewAsTenant()` / `clearViewAsTenant()` server actions |
| `lib/session.ts` | `requireTenantSession()` now checks the cookie for SUPER_ADMIN before falling back to hostname resolution |
| `components/DashboardSidebar.tsx` | Tenant switcher dropdown (Super Admin only) |
| `app/admin/page.tsx` | "Manage →" button per tenant row |

---

# 🖼️ Product Image Uploads (V1.0 Layer 3)

Product images now upload directly from the admin's device to **Vercel Blob
Storage** — no more pasting external URLs.

## Setup

1. In your Vercel project dashboard: **Storage → Create Database → Blob**
2. Copy the generated `BLOB_READ_WRITE_TOKEN`
3. Add it to `.env`:
   ```env
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
   ```
4. Locally, you can also run `vercel env pull` if the project is linked to
   Vercel, to pull this automatically.

## How it works

1. `components/ImageUpload.tsx` — a drag-and-drop/click file picker with
   instant local preview (`URL.createObjectURL`) while the real upload
   happens in the background.
2. On file select, it POSTs to `app/api/upload/route.ts`, which:
   - Verifies the caller is a logged-in tenant admin/staff (`requireTenantSession()`)
   - Validates file type (JPG/PNG/WEBP/GIF) and size (max 5MB)
   - Uploads to Vercel Blob under `products/{tenantSlug}/{timestamp}-{filename}`
     — tenant-scoped paths so two tenants' files never collide
   - Returns the public Blob URL
3. The component writes that URL into a hidden `<input name="imageUrl">`
   inside the surrounding product form, so it submits along with the rest
   of the form data on save — no extra form-handling code needed in
   `createProduct`/`updateProduct`.

## Local development note

Vercel Blob works the same in local dev as in production as long as
`BLOB_READ_WRITE_TOKEN` is set — it's a real cloud upload, not a local
filesystem mock. There's no local-only fallback needed.

---

# 👤 Account Settings: Change Email & Password (V1.0 Layer 3)

Any logged-in user (ADMIN, STAFF, or SUPER_ADMIN) can update their own
email and password from `/dashboard/settings`.

## Change password

Requires the **current password** to be entered correctly before accepting
a new one — this stops someone who walks up to an unlocked, already-logged-in
session from locking the real account owner out. New password must be at
least 8 characters and different from the current one.

## Change email

Also requires the current password as confirmation. A few details:

- Emails are unique **per tenant**, not globally (`@@unique([tenantId, email])`
  in the schema) — so the uniqueness check only looks within the same
  tenant, matching how login already works.
- After a successful change, the user is **signed out automatically** and
  redirected to `/login?emailUpdated=1`, which shows a confirmation banner.
  This is because the email is baked into the JWT session token at login
  time — rather than building token-refresh logic, it's simpler and safer
  to just have them log back in with the new address.

## Files

| File | Role |
|---|---|
| `app/dashboard/settings/page.tsx` | Settings page — shows current email/name, hosts both forms |
| `app/dashboard/settings/actions.ts` | `updatePassword()` and `updateEmail()` server actions |
| `app/dashboard/settings/PasswordForm.tsx` | Password change form |
| `app/dashboard/settings/EmailForm.tsx` | Email change form |
| `app/login/page.tsx` | Shows "✓ Email updated" banner after the forced re-login |
