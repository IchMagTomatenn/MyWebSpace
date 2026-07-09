import type { APIRoute } from 'astro';
import { auth } from '../../../../lib/auth';
import { db } from '../../../../db';
import { blogPosts } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { isAdminUser } from '../../../../lib/admin';

/**
 * Admin endpoint: delete any blog post by id.
 *
 * DELETE /api/admin/posts/:id → `{ ok, id }`
 *
 * Unlike the owner-scoped `/api/posts/:id`, an admin can delete posts that
 * belong to any user. Still 404 when the post doesn't exist (no information
 * leak about other users' content beyond what an admin is already allowed to
 * see). The `blog_post_translations` and `blog_post_tags` rows cascade.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  if (!isAdminUser(session.user)) return json({ error: 'forbidden' }, 403);

  const id = params.id;
  if (!id || !UUID_RE.test(id)) return json({ error: 'not_found' }, 404);

  try {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning({ id: blogPosts.id });
    if (result.length === 0) return json({ error: 'not_found' }, 404);
    return json({ ok: true, id });
  } catch (err) {
    console.error('[admin/posts] delete failed:', err);
    return json({ error: 'failed' }, 500);
  }
};
