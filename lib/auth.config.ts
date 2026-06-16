import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config — used by middleware.
 *
 * This MUST NOT import Prisma, bcrypt, or anything that uses
 * React's cache() / Node-only APIs, because middleware runs in
 * the Edge Runtime.
 *
 * It only defines `pages` and `callbacks` — enough for
 * middleware to read `req.auth` (the session) and redirect
 * based on `role`/`tenantId`. The actual `providers` (which DO
 * need Prisma) are added in lib/auth.ts for the Node runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // populated in lib/auth.ts (Node runtime only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantSlug = token.tenantSlug;
      }
      return session;
    },
  },
};
