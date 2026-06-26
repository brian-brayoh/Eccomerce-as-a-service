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

---

# 🛍️ Customer Accounts (V1.0 Layer 4)

Customers (storefront shoppers) now have their own signup/login, separate
from staff (`User`) accounts — matching the schema's existing split between
`User` and `Customer`.

## Why a separate session system from staff Auth.js

| | Staff (`User`) | Customers (`Customer`) |
|---|---|---|
| Cookie | `next-auth.session-token` (Auth.js) | `pc_customer_session` (custom JWT via `jose`) |
| Routes | `/dashboard/**`, `/admin/**` | `/account/**`, `/products`, `/` |
| Purpose | Manage the store | Shop, track orders, save wishlist |

Keeping these completely separate means a customer session can **never**
be mistaken for staff access, even by accident — they're different cookies
verified by different code paths. This is a deliberate security boundary,
not just a stylistic choice.

## Pages

| Route | Purpose |
|---|---|
| `/signup` | Create a customer account (name, email, phone, password) |
| `/account/login` | Customer sign-in, supports `?callbackUrl=` to return to where they were |
| `/account` | Overview — order count, wishlist count, 3 most recent orders |
| `/account/orders` | Full order history with status badges and line items |
| `/account/wishlist` | Saved products grid with remove button |

## Key files

| File | Role |
|---|---|
| `lib/customer-session.ts` | JWT creation/verification, cross-tenant safety check (same pattern as staff `requireTenantSession()`) |
| `app/account/actions.ts` | `customerSignup()`, `customerLogin()`, `customerLogout()` |
| `app/account/wishlist/actions.ts` | `toggleWishlist()`, `removeFromWishlist()` |
| `app/account/layout.tsx` | Protects all `/account/**` routes, redirects to login if no session |
| `components/WishlistButton.tsx` | Heart toggle on product detail page — redirects to login if not signed in |
| `components/AccountNav.tsx` | Sidebar nav within the account section |

## Cross-tenant safety

Same principle as staff sessions: `getCurrentCustomer()` verifies the
session's `tenantId` matches the tenant resolved from the **current
hostname** before returning any data. A customer logged into PrintCare's
subdomain can never see ABC Electronics' account data, even if their
browser somehow still has a valid `pc_customer_session` cookie from a
previous visit to a different tenant's site.

## What's NOT included yet

This layer covers accounts, history, and wishlist — but actual checkout
(cart, payment) isn't built yet. Right now, `Order` records only get
created via the admin manually or (in a future layer) the cart/checkout
flow. The order history page will simply show "no orders yet" until that's
built.

---

# 🛒 Shopping Cart & Checkout (V1.5 Layer 1)

Customers can now actually buy products — not just inquire via WhatsApp.
This is the first piece of "V1.5 Professional E-commerce" from the roadmap.

## Cart storage: cookie, not database

The cart is stored as a single JSON cookie (`pc_cart_{tenantId}`), holding
`{ productId, quantity }` pairs. This works identically for guests and
logged-in customers — no `Cart` database table needed, no abandoned-cart
cleanup job required. It's tenant-scoped by including the tenant ID in the
cookie name, so a browser that's visited two different tenant storefronts
keeps separate carts for each.

## Checkout flow

1. **Add to cart** — from any product detail page, pick a quantity and add.
   Stock is checked server-side before adding.
2. **`/cart`** — review items, adjust quantity, remove items. Shows subtotal.
3. **`/checkout`** — collects delivery details (name, phone, county, town,
   street/landmark) and a payment method (Cash on Delivery works now;
   M-Pesa is visible but disabled — wired up in the next layer).
   - **Guest checkout** also collects name/phone/email since there's no
     account to pull them from.
   - **Logged-in customers** get their name/phone pre-filled.
4. **`placeOrder()`** (`app/checkout/actions.ts`) — the critical piece:
   - Re-fetches every product **server-side** and re-validates stock —
     never trusts client-supplied prices or quantities.
   - Creates the `Order` + `OrderItem` rows (snapshotting `productName`
     and `unitPrice` per the schema's design) and a `Payment` row, all
     inside a single `prisma.$transaction()` alongside the stock
     decrements — so a crash mid-checkout can never leave stock counts
     wrong or create a payment record without a matching order.
5. **`/checkout/success`** — order confirmation with a summary.

## Why guest checkout matters here

Per the original V1.0 requirements (WhatsApp ordering, walk-in customers),
forcing account creation before purchase would lose customers. The schema
already supports this (`Order.customerId` is optional, with
`guestName`/`guestPhone`/`guestEmail` as fallback) — this layer is the
first to actually exercise that path.

## Files

| File | Role |
|---|---|
| `lib/cart.ts` | Cookie read/write helpers, tenant-scoped |
| `app/cart/actions.ts` | `addToCart()`, `updateCartQuantity()`, `removeFromCart()` |
| `app/cart/page.tsx` + `CartItemRow.tsx` | Cart review page |
| `app/checkout/page.tsx` + `CheckoutForm.tsx` | Delivery + payment method form |
| `app/checkout/actions.ts` | `placeOrder()` — the order creation transaction |
| `app/checkout/success/page.tsx` | Confirmation page |
| `components/AddToCartButton.tsx` | Quantity selector + add button on product pages |

## What's still missing

- **Orders don't show up in `/dashboard/orders` yet** — that admin page
  doesn't exist. Orders are being created correctly in the database, but
  there's no admin UI to view/manage them yet (next logical layer).
- **M-Pesa is UI-only** — the radio option is visible but disabled. Real
  STK Push integration is a separate layer.
- **No email/SMS order confirmation** — only the on-screen success page.

---

# 📦 Orders Management (V1.5 Layer 2)

Admins can now see and manage every order placed through the storefront,
WhatsApp, or manually.

## Pages

| Route | Purpose |
|---|---|
| `/dashboard/orders` | Full order list with status filter tabs (All/Pending/Paid/Processing/Delivered/Cancelled) |
| `/dashboard/orders/[id]` | Order detail — items, customer/guest info, delivery address, payment record, status controls |

## Status workflow

Orders move through a defined state machine — `app/dashboard/orders/actions.ts`
enforces valid transitions so an order can't jump from `PENDING` straight
to `DELIVERED` by mistake:

```
PENDING → PAID → PROCESSING → DELIVERED
   ↓        ↓         ↓
   └──── CANCELLED ───┘
```

`DELIVERED` and `CANCELLED` are terminal — no further transitions allowed
from either.

## Cancelling restocks automatically

If an admin cancels an order that hasn't been delivered yet,
`updateOrderStatus()` restocks every item in the same database transaction
that updates the order's status — so cancelled orders never leave stock
counts permanently reduced.

## Payment tracking

Each order's `Payment` record (created automatically at checkout) can be
marked **Paid** or **Failed** from the order detail page. Marking a
payment as paid while the order is still `PENDING` automatically advances
the order to `PAID` — this is the manual stand-in for what M-Pesa's
callback will eventually do automatically once that integration is built.

## Files

| File | Role |
|---|---|
| `app/dashboard/orders/page.tsx` | List view with status tabs and counts per status |
| `app/dashboard/orders/[id]/page.tsx` | Detail view |
| `app/dashboard/orders/actions.ts` | `updateOrderStatus()`, `updatePaymentStatus()` — both enforce tenant scoping and valid transitions |
| `app/dashboard/orders/[id]/OrderStatusControl.tsx` | Status dropdown, only shows valid next states |
| `app/dashboard/orders/[id]/PaymentStatusControl.tsx` | Mark paid/failed buttons |

---

# 💰 M-Pesa STK Push Integration (V2.5)

Real M-Pesa payments via Safaricom's Daraja API — each tenant configures
their own credentials, since each business has its own till/paybill number.

## Setup (per tenant)

1. Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Go to `/dashboard/payment-settings` (ADMIN role required, not STAFF)
3. Toggle **Enable M-Pesa**, select **Sandbox**, and fill in:
   - **Shortcode** — sandbox test shortcode is usually `174379`
   - **Consumer Key** / **Consumer Secret** — from your Daraja app
   - **Passkey** — the sandbox Lipa Na M-Pesa passkey (published in Daraja docs)
4. Set `NEXT_PUBLIC_APP_URL` in `.env` to your dev tunnel or deployed URL
   (Daraja needs a publicly reachable callback URL — use `ngrok` for local
   testing: `ngrok http 3000`, then use that HTTPS URL)

## How it works end to end

```
Checkout (M-Pesa selected)
  → placeOrder() creates Order + Payment (status: PENDING)
  → redirect to /checkout/mpesa
  → MpesaWaiting.tsx calls POST /api/mpesa/stk-push
  → lib/mpesa.ts gets a Daraja OAuth token, sends the STK Push
  → Payment.providerRef = CheckoutRequestID (so the callback can find it later)
  → Customer enters M-Pesa PIN on their phone
  → Safaricom calls POST /api/mpesa/callback (async, no direct response to us)
  → callback matches providerRef, sets Payment.status + Order.status
  → meanwhile, MpesaWaiting.tsx polls GET /api/mpesa/status every 3s
  → once it sees SUCCESS, redirects to /checkout/success
```

## Why polling instead of waiting on one request

STK Push is fundamentally asynchronous — Safaricom calls our callback
URL whenever the customer finishes on their phone, which could be seconds
or a minute later, completely independent of the original `/stk-push`
request (which only confirms the prompt was *sent*, not that it was
*paid*). The browser can't "wait" on a callback that hits a different
endpoint, so `MpesaWaiting.tsx` polls `/api/mpesa/status` every 3 seconds
until it sees a final state, or gives up after 90 seconds (Daraja STK
Push prompts expire around then anyway).

## Security note on the callback endpoint

`/api/mpesa/callback` is intentionally public with no auth header check —
Safaricom doesn't send one. Instead, it's safe because:
- It only ever updates a `Payment` row that **already exists**, matched by
  `CheckoutRequestID` — a value only our own `/stk-push` call generates.
- An attacker can't guess a valid `CheckoutRequestID` from a real pending
  payment, and even if they could, the only effect is marking that
  specific payment paid/failed — not creating new orders or charging
  anyone.
- Per Daraja's requirements, it always responds `{ ResultCode: 0 }` even
  on internal errors, so Safaricom doesn't endlessly retry a callback
  we've already logged and moved on from.

## Files

| File | Role |
|---|---|
| `lib/mpesa.ts` | Daraja OAuth + STK Push request builder, phone number normalization |
| `app/api/mpesa/stk-push/route.ts` | Triggers the push for a given order |
| `app/api/mpesa/callback/route.ts` | Receives Safaricom's async result, updates Payment/Order |
| `app/api/mpesa/status/route.ts` | Polled by the waiting screen to check current status |
| `app/checkout/mpesa/page.tsx` + `MpesaWaiting.tsx` | "Check your phone" UI with polling |
| `app/dashboard/payment-settings/` | Per-tenant Daraja credential form |

## Schema additions

```prisma
model Tenant {
  // ...
  mpesaEnabled        Boolean @default(false)
  mpesaShortcode       String?
  mpesaConsumerKey     String?
  mpesaConsumerSecret  String?
  mpesaPasskey         String?
  mpesaEnvironment     String  @default("sandbox")
}
```

`Payment.providerRef` and `Payment.mpesaReceipt` already existed in the
original schema design — this layer is the first to actually populate them.

## What's NOT done yet

- Credentials are stored in plain text in the database. For production,
  consider encrypting `mpesaConsumerSecret` and `mpesaPasskey` at rest.
- No retry/reconciliation job for payments stuck in PENDING if a callback
  is ever lost (rare, but possible) — would need a scheduled job that
  queries Daraja's transaction status API directly.
- C2B (Pay Bill without STK Push, e.g. customer-initiated) is not covered
  — only STK Push (merchant-initiated) is implemented.

---

# 💳 M-Pesa STK Push (V2.5 Layer 1)

Real payments via Safaricom's Daraja API — customers get an STK Push
prompt on their phone at checkout, and the order auto-updates to PAID
the moment they enter their PIN.

## Per-tenant credentials, not global

Each tenant has their own M-Pesa till/paybill, so credentials live on
the `Tenant` model, not in a single shared `.env` value:

```prisma
mpesaEnabled        Boolean
mpesaShortcode      String?  // Till or Paybill number
mpesaConsumerKey    String?
mpesaConsumerSecret String?
mpesaPasskey        String?  // Lipa Na M-Pesa Online passkey
mpesaEnvironment    String   // "sandbox" | "production"
```

Tenant admins set these from **`/dashboard/settings/mpesa`** — only
`ADMIN`/`SUPER_ADMIN` roles can change them (not `STAFF`), since they
control where the business's money goes.

## Getting Daraja Sandbox credentials

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke), create an account
2. Create an app — this gives you a Consumer Key and Consumer Secret
3. Use the shared sandbox shortcode `174379` and the sandbox passkey
   shown on the same page (these are Safaricom's public test values —
   same for everyone, safe to use for development)
4. Enter all four values into `/dashboard/settings/mpesa`, toggle "Enable M-Pesa" on, save

## The payment flow

1. **Checkout** — customer selects M-Pesa, enters their phone number
2. **`placeOrder()`** creates the `Order` + `Payment` (status `PENDING`)
   immediately, then redirects to `/checkout/mpesa-pending` — it does
   **not** call Safaricom synchronously, so checkout never hangs waiting
   on an external API
3. **`/checkout/mpesa-pending`** (client-side):
   - POSTs to `/api/mpesa/stk-push`, which calls Daraja and stores the
     returned `CheckoutRequestID` on the `Payment` row (`providerRef` field)
   - Polls `/api/mpesa/status` every 3 seconds (up to ~2 minutes — STK
     prompts expire around then anyway)
4. **Customer's phone** receives the prompt, enters M-Pesa PIN
5. **Safaricom calls `/api/mpesa/callback`** — matches the
   `CheckoutRequestID` back to the `Payment` row, sets it to `SUCCESS`
   (storing the `MpesaReceiptNumber`) and the `Order` to `PAID`, all in
   one transaction. On failure/cancellation, only the `Payment` is
   marked `FAILED` — the `Order` stays `PENDING` so the customer can
   retry or switch to Cash on Delivery.
6. **The polling client** sees the status change and redirects to
   `/checkout/success`

## Why polling instead of websockets

Daraja callbacks land on the server, not the browser — there's no way
for Safaricom to push directly to the customer's open tab. Polling a
lightweight status endpoint every 3 seconds is simpler than setting up
websockets/SSE for what's typically a 5-15 second wait.

## Idempotency

The callback checks `if (payment.status !== "PENDING") return` before
processing — Safaricom sometimes retries callbacks, and this guard
prevents double-processing (e.g. accidentally double-incrementing
something, or processing a stale retry after the customer already
succeeded via a different path).

## Local development note

Safaricom needs a **publicly reachable HTTPS URL** to call your callback
endpoint — `localhost` won't work. For local testing, use a tunnel like
`ngrok http 3000` and set `NEXT_PUBLIC_APP_URL` to the ngrok HTTPS URL.
In production on Vercel, this is just your deployed domain.

## Files

| File | Role |
|---|---|
| `lib/mpesa.ts` | Daraja API client — OAuth token, phone normalization, STK Push request |
| `app/api/mpesa/stk-push/route.ts` | Triggers the push for a given order, stores `CheckoutRequestID` |
| `app/api/mpesa/status/route.ts` | Read-only polling endpoint |
| `app/api/mpesa/callback/route.ts` | Safaricom's webhook target — always returns HTTP 200 |
| `app/checkout/mpesa-pending/` | The "check your phone" waiting screen with polling |
| `app/dashboard/settings/mpesa/` | Tenant admin settings for Daraja credentials |

---

# ⭐ Customer Reviews (V2.0)
Reviews and star ratings on product pages. Customers must be signed in
to leave a review — one review per customer per product (submitting again
updates the existing one). Star distribution bar chart shows on products
with multiple reviews. Average rating shown under the product title and
on product cards in the listing.

# 🏷️ Coupon Codes (V2.0)
Admin creates codes at `/dashboard/coupons` — percentage or fixed-amount
discounts, optional max uses and date ranges. Customers enter codes at
checkout to see the discount applied before placing the order. POS staff
can also enter coupon codes at the till. `usedCount` is incremented on
each successful order placement.

# 🔍 Quick View (V2.0)
Hovering any product card reveals a "Quick view" button. Clicking opens
a modal with the product image, price, rating, description, and an
"Add to cart" button — without navigating away from the listing page.

# 🖥️ Point of Sale / POS (V2.0)
Available at `/dashboard/pos` — for ADMIN and STAFF to sell products
in-store:
- **Product search** — type name, SKU, or brand; results appear instantly
- **Cart** — add/remove items with quantity controls
- **Customer details** — name and phone (optional, recorded on the order)
- **Coupon codes** — same coupon system as the web checkout
- **Cash payment** — marks the order PAID immediately
- **M-Pesa STK Push** — enters the customer's number, triggers the prompt
  directly and polls for confirmation on-screen (no page redirect needed
  since staff are watching the terminal)

POS orders are created with `channel: IN_STORE` for easy filtering in the
orders dashboard. Schema updated: `OrderChannel` enum now includes `IN_STORE`.

Run `npm run db:push` after pulling this update to apply the schema change.
