import { adminEmail } from '../config';

/**
 * Shared admin check.
 *
 * The middleware (`src/middleware.ts`) computes the effective role for the
 * page layer; API endpoints need the same logic so admins can act on content
 * they don't own. A user is considered admin when either:
 *   - their persisted `role` column is `'admin'`, or
 *   - their e-mail matches the `ADMIN_EMAIL` env var (owner fallback).
 *
 * `null`/missing sessions are treated as non-admin (fail closed).
 */
export function isAdminUser(
  u: { email: string; role?: string | null } | null | undefined,
): u is { email: string; role?: string | null } {
  if (!u) return false;
  return u.role === 'admin' || (adminEmail != null && u.email.toLowerCase() === adminEmail);
}
