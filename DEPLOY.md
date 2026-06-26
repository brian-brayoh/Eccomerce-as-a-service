# PrintCare Commerce — Vercel Deployment Guide

This guide covers deploying to Vercel with:
- Neon PostgreSQL (already set up)
- Vercel Blob Storage (product images)
- Multi-tenant subdomain routing
- Custom domain support

---

## Step 1: Push code to GitHub

Vercel deploys from GitHub. If you haven't set up git yet:

```powershell
cd "C:\Users\user\Music\Saas printacare new version"

git init
git add .
git commit -m "Initial PrintCare Commerce commit"
```

Create a new repository on https://github.com/new (name it `printcare-commerce`,
set it to Private), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/printcare-commerce.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create a Vercel project

1. Go to https://vercel.com and sign in (create a free account if needed)
2. Click **Add New → Project**
3. Click **Import Git Repository** → connect your GitHub account → select `printcare-commerce`
4. Framework preset will auto-detect as **Next.js** — leave it
5. **Don't deploy yet** — configure environment variables first (Step 3)

---

## Step 3: Set environment variables in Vercel

In the project settings → **Environment Variables**, add each of these:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | From Neon dashboard → Connection Details |
| `AUTH_SECRET` | Your secret | Same value as in your local `.env` |
| `ROOT_DOMAIN` | `yourplatform.com` | Your actual domain, e.g. `printcare.co.ke` |
| `DEFAULT_TENANT_SLUG` | `printcare` | The fallback tenant for bare domain visits |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | From Vercel → Storage → Blob |
| `NEXT_PUBLIC_APP_URL` | `https://yourplatform.com` | Your production domain — used for M-Pesa callback URL |

> **Tip:** In Vercel's UI, set each variable for **Production**, **Preview**,
> and **Development** environments simultaneously by checking all three boxes.

---

## Step 4: Set up Vercel Blob Storage

If you haven't already:

1. In your Vercel project → **Storage** tab → **Create Database → Blob**
2. Name it (e.g. `printcare-blob`) → Create
3. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project's
   env vars — you don't need to copy it manually if you link the store
   to the project

---

## Step 5: Deploy

Click **Deploy** in Vercel. The first deploy takes ~2-3 minutes.

Once done, Vercel gives you a URL like `printcare-commerce.vercel.app`.
Visit it — you should see the storefront homepage. The `/login` page
should also work.

### Run the database seed on production

After first deploy, open Vercel → your project → **Functions** tab →
or just run this from your local machine (it uses your production
`DATABASE_URL`):

```powershell
# In your project folder, temporarily set DATABASE_URL to production:
$env:DATABASE_URL="your-neon-production-connection-string"
npx tsx prisma/seed.ts
```

Or use Vercel CLI:
```powershell
npm i -g vercel
vercel env pull   # pulls production env vars to a local .env.production file
```

---

## Step 6: Add your custom domain

### Option A — You own `yourplatform.com` (the SaaS root domain)

This is the domain where tenant subdomains live, e.g.:
- `printcare.yourplatform.com` → PrintCare's store
- `shop.yourplatform.com` → Another tenant's store

1. Vercel project → **Settings → Domains → Add**
2. Add `yourplatform.com` and `*.yourplatform.com` (wildcard for subdomains)
3. Vercel shows you DNS records to add — go to your domain registrar
   (Namecheap, GoDaddy, Cloudflare, etc.) and add:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` (Vercel's IP) |
   | `CNAME` | `*` | `cname.vercel-dns.com` |

4. DNS propagation takes 5 minutes to 48 hours depending on your registrar.
   Cloudflare is fastest (usually minutes).

5. Update your `.env` and Vercel env vars:
   ```env
   ROOT_DOMAIN="yourplatform.com"
   NEXT_PUBLIC_APP_URL="https://yourplatform.com"
   ```

### Option B — PrintCare has its own domain (`printcare.co.ke`)

If PrintCare is the only tenant (or their first) and they want their
own branded domain instead of a subdomain:

1. Vercel → **Settings → Domains → Add** → type `printcare.co.ke`
2. Add the DNS records Vercel shows you at your `.co.ke` registrar
3. In your database, set `Tenant.customDomain = "printcare.co.ke"`:
   ```sql
   UPDATE "Tenant" SET "customDomain" = 'printcare.co.ke'
   WHERE slug = 'printcare';
   ```
   Or do it via Prisma Studio: `npx prisma studio`

The middleware already handles this — `getTenantIdentifierFromHost()`
checks for a custom domain match before falling back to subdomain logic.

---

## Step 7: Set up M-Pesa callback URL

Once deployed to your production domain, update the M-Pesa callback
URL in Safaricom's Daraja portal to:
```
https://yourplatform.com/api/mpesa/callback
```

Or if PrintCare has a custom domain:
```
https://printcare.co.ke/api/mpesa/callback
```

And update your Vercel env var:
```
NEXT_PUBLIC_APP_URL=https://printcare.co.ke
```

For **Daraja production** (going live):
1. Log in to developer.safaricom.co.ke
2. Go to your app → **Go Live** tab
3. Submit the callback URL above for whitelisting
4. Safaricom reviews and approves (usually 1-3 business days)
5. Switch `mpesaEnvironment` from `sandbox` to `production` in
   `/dashboard/settings/mpesa`

---

## Step 8: Onboarding a second tenant

Once the platform is live, here's how to add a new business (e.g. "ABC Electronics"):

### 1. Create the tenant record

Use Prisma Studio or a quick script:

```typescript
// scripts/create-tenant.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.create({
    data: {
      name: "ABC Electronics",
      slug: "abc-electronics",
      plan: "STARTER",
      planStatus: "TRIALING",
    },
  });

  const password = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "ABC Admin",
      email: "admin@abcelectronics.co.ke",
      password,
      role: "ADMIN",
    },
  });

  console.log("Tenant created:", tenant.slug);
}

main();
```

Run with: `npx tsx scripts/create-tenant.ts`

### 2. Their storefront URL

Immediately accessible at:
- **Subdomain**: `abc-electronics.yourplatform.com`
- **Custom domain** (optional): add `Tenant.customDomain = "abcelectronics.co.ke"`,
  then add that domain in Vercel → Settings → Domains

### 3. Their admin URL

Same URL as their storefront — `/login` routes to their dashboard based
on which hostname you're on. They log in at:
`https://abc-electronics.yourplatform.com/login`

---

## Common issues

**Q: `/dashboard` redirects back to `/login` after deploying**
A: `AUTH_SECRET` is missing or different from what was used to generate
existing sessions. Set it in Vercel env vars, redeploy, and log in fresh.

**Q: Images from Vercel Blob don't load**
A: Add your Vercel Blob domain to `next.config.mjs`:
```js
const nextConfig = {
  images: {
    domains: ["your-blob-store.public.blob.vercel-storage.com"],
  },
};
export default nextConfig;
```

**Q: Subdomain routing doesn't work locally after pulling a production env**
A: `DEFAULT_TENANT_SLUG` handles `localhost` — subdomains like
`printcare.localhost:3000` work in Chrome/Edge without any hosts file
changes. Firefox may need `127.0.0.1 printcare.localhost` in `/etc/hosts`.

**Q: M-Pesa callback isn't being received**
A: The callback URL must be HTTPS and publicly reachable. Check:
1. Vercel logs (Functions tab) for incoming POST requests to `/api/mpesa/callback`
2. The URL registered in Daraja matches exactly (no trailing slash)
3. For sandbox, use ngrok for local testing: `npx ngrok http 3000`

**Q: `prisma generate` fails on Vercel build**
A: Add this to `package.json` scripts:
```json
"postinstall": "prisma generate"
```
Vercel runs `npm install` → triggers `postinstall` → generates Prisma
Client before building. This is the standard Vercel + Prisma setup.

---

## Checklist before going live

- [ ] `AUTH_SECRET` set in Vercel env vars
- [ ] `DATABASE_URL` points to production Neon database
- [ ] `ROOT_DOMAIN` set to your actual domain
- [ ] `NEXT_PUBLIC_APP_URL` set to your HTTPS domain
- [ ] `BLOB_READ_WRITE_TOKEN` linked from Vercel Blob storage
- [ ] Seed script run on production database
- [ ] Custom domain added in Vercel + DNS configured
- [ ] Wildcard subdomain (`*.yourdomain.com`) DNS record added
- [ ] Admin passwords changed from default `ChangeMe123!`
- [ ] M-Pesa callback URL updated to production domain
- [ ] `postinstall: prisma generate` added to `package.json`
