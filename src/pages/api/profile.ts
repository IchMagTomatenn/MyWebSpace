import type { APIRoute } from 'astro';
import { auth } from '../../lib/auth';
import { db } from '../../db';
import { user } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Profile update endpoint (authenticated).
 *
 * Accepts a JSON body: `{ name, username, bio, avatarUrl }` and writes it to
 * the `user` row. `username` is validated and must be unique (checked before
 * the update to return a friendly 409). `bio` is capped at 500 chars.
 * `avatarUrl` comes from a prior `/api/upload` call.
 *
 * The session middleware re-reads the user from the DB on every request, so
 * changes here are reflected immediately without a session refresh.
 */

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/;
const BIO_MAX = 500;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  const userId = session.user.id;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  const name = String(body.name ?? '').trim();
  const username = String(body.username ?? '').trim().toLowerCase();
  const bioRaw = body.bio;
  const avatarUrlRaw = body.avatarUrl;

  if (!name) return json({ error: 'required' }, 400);
  if (username && !USERNAME_RE.test(username)) {
    return json({ error: 'username_invalid' }, 400);
  }

  // Uniqueness: another user already using this username?
  if (username) {
    const [taken] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);
    if (taken && taken.id !== userId) {
      return json({ error: 'username_taken' }, 409);
    }
  }

  const patch: Record<string, unknown> = { name, updatedAt: new Date() };
  // Empty username string clears it (→ null).
  patch.username = username || null;

  if (bioRaw === null) {
    patch.bio = null;
  } else if (typeof bioRaw === 'string') {
    patch.bio = bioRaw.slice(0, BIO_MAX);
  }

  if (avatarUrlRaw === null) {
    patch.image = null;
  } else if (typeof avatarUrlRaw === 'string' && avatarUrlRaw.startsWith('/uploads/')) {
    patch.image = avatarUrlRaw;
  }

  try {
    await db.update(user).set(patch).where(eq(user.id, userId));
  } catch (err) {
    console.error('[profile] update failed:', err);
    return json({ error: 'failed' }, 500);
  }

  return json({ ok: true });
};
