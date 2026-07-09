import { createAuthClient } from 'better-auth/client';

/**
 * Browser-side Better Auth client used by the auth pages (login, register,
 * password reset, …). It talks to the Better Auth API on the same origin
 * (`/api/auth/*`) and stores the session cookie automatically.
 *
 * `baseURL` resolves to the current origin in the browser; we guard with
 * `typeof window` so importing this module never breaks a non-DOM context.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
});
