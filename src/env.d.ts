/// <reference path="../.astro/types.d.ts" />

/**
 * Minimal shape of the authenticated user attached to `Astro.locals.user`
 * by the auth middleware (`src/middleware.ts`). The full Better Auth session
 * is richer; we only expose what the UI needs.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  role: 'user' | 'admin';
  emailVerified: boolean;
  avatarUrl: string | null;
}

declare global {
  namespace App {
    interface Locals {
      /** `null` when no session. Populated by `src/middleware.ts`. */
      user: SessionUser | null;
    }
  }
}
