import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';
import { isAdminUser } from './lib/admin';
import type { SessionUser } from './env';

/**
 * Global middleware.
 *
 * On every request we ask Better Auth for the current session (from the cookie)
 * and attach a minimal `SessionUser` to `Astro.locals.user`. The header's
 * `UserMenu` reads this to switch between Login/Register (logged out) and
 * Dashboard/Account (logged in).
 *
 * If the database is not reachable (e.g. not configured yet), we fail closed:
 * `locals.user = null` and the request continues as anonymous.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const session = await auth.api.getSession({ headers: context.request.headers });
    if (session) {
      // Better Auth exposes custom `additionalFields` on the session user. We
      // cast defensively so we don't depend on generated client types.
      const u = session.user as {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        username?: string | null;
        role?: string | null;
      };
      const role: 'user' | 'admin' = isAdminUser(u) ? 'admin' : 'user';
      context.locals.user = {
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username ?? null,
        role,
        emailVerified: u.emailVerified,
        avatarUrl: u.image ?? null,
      } satisfies SessionUser;
    } else {
      context.locals.user = null;
    }
  } catch (err) {
    console.error('[middleware] failed to load session:', err);
    context.locals.user = null;
  }
  return next();
});
