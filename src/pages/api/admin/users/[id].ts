import type { APIRoute } from 'astro';
import { auth } from '../../../../lib/auth';
import { db } from '../../../../db';
import { user } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { isAdminUser } from '../../../../lib/admin';

/**
 * Admin endpoint: moderate a single user account.
 *
 * PATCH  /api/admin/users/:id  → `{ ok }`  body `{ role?: 'user'|'admin', emailVerified?: boolean }`
 * DELETE /api/admin/users/:id  → `{ ok, id }`
 *
 * Guards:
 * - Admin-only (403 otherwise).
 * - You cannot change your own role or delete your own account, to prevent an
 *   accidental lockout where the last admin demotes/deletes themselves.
 * - The `user` row is the single source; sessions/accounts/posts/projects all
 *   cascade on delete (see `src/db/schema.ts`).
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  if (!isAdminUser(session.user)) return json({ error: 'forbidden' }, 403);

  const id = params.id;
  if (!id) return json({ error: 'not_found' }, 404);
  if (id === session.user.id) return json({ error: 'self' }, 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.role === 'user' || body.role === 'admin') {
    patch.role = body.role;
  } else if (body.role !== undefined) {
    return json({ error: 'invalid' }, 400);
  }
  if (body.emailVerified !== undefined) {
    patch.emailVerified = body.emailVerified === true;
  }

  if (Object.keys(patch).length === 1) {
    return json({ error: 'invalid' }, 400);
  }

  try {
    const result = await db
      .update(user)
      .set(patch)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    if (result.length === 0) return json({ error: 'not_found' }, 404);
    return json({ ok: true, id });
  } catch (err) {
    console.error('[admin/users] update failed:', err);
    return json({ error: 'failed' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  if (!isAdminUser(session.user)) return json({ error: 'forbidden' }, 403);

  const id = params.id;
  if (!id) return json({ error: 'not_found' }, 404);
  if (id === session.user.id) return json({ error: 'self' }, 400);

  try {
    const result = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    if (result.length === 0) return json({ error: 'not_found' }, 404);
    return json({ ok: true, id });
  } catch (err) {
    console.error('[admin/users] delete failed:', err);
    return json({ error: 'failed' }, 500);
  }
};
