import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getTenantByHost } from "@/lib/session";
import { headers } from "next/headers";
import { authConfig } from "@/lib/auth.config";

// Full Auth.js setup — Node runtime only (server components, API
// routes, server actions). Imports Prisma and bcrypt, so this file
// must NEVER be imported from middleware.ts directly.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Resolve the tenant from the request's hostname.
        // A user with the same email can exist under different tenants
        // (see @@unique([tenantId, email]) in the schema), so we must
        // scope the lookup to the current tenant.
        const headersList = headers();
        const host = headersList.get("host");
        const tenant = await getTenantByHost(host);

        if (!tenant) return null;

        const user = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email } },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          // Custom fields carried through to the JWT/session
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
        };
      },
    }),
  ],
});
