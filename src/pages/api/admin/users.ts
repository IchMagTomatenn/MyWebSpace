import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { db } from '../../../db';
import { user, blogPosts } from '../../../db/schema';
import { desc, count } from 'drizzle-orm';
import { isAdminUser } from '../../../lib/admin';

/**
 * Admin endpoint: list every user account.
 *
 * GET /api/admin/users → `{ users: [{ id, name, email, username, role, emailVerified, createdAt, postCount }] }`
 *
 * Admin-only. Post counts are fetched in a single grouped query and merged in
 * JS to avoid N+1. Passwords live in the `account` table, so selecting from
 * `user` never leaks credentials.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  if (!isAdminUser(session.user)) return json({ error: 'forbidden' }, 403);

  try {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    const counts = await db
      .select({ userId: blogPosts.userId, n: count() })
      .from(blogPosts)
      .groupBy(blogPosts.userId);
    const countMap = new Map(counts.map((c) => [c.userId, Number(c.n)]));

    const out = users.map((u) => ({
      ...u,
      postCount: countMap.get(u.id) ?? 0,
    }));
    return json({ users: out });
  } catch (err) {
    console.error('[admin/users] list failed:', err);
    return json({ error: 'failed' }, 500);
  }
};
