import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { db } from '../../../db';
import { isAdminUser } from '../../../lib/admin';

/**
 * Admin endpoint: list every blog post across all users.
 *
 * GET /api/admin/posts → `[{ id, slug, published, views, createdAt, authorId, authorName, title }]`
 *
 * Admin-only. Returns 403 for non-admins (and 401 for anonymous). The list is
 * newest-first; the title is the best match for the requested language
 * (`?lang=`), falling back to the first translation, then the slug.
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

  const url = new URL(request.url);
  const lang = (url.searchParams.get('lang') ?? 'de').slice(0, 5);

  try {
    const rows = await db.query.blogPosts.findMany({
      with: { translations: true, user: true },
    });
    const posts = rows
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => {
        const tr = p.translations.find((x) => x.lang === lang) ?? p.translations[0];
        return {
          id: p.id,
          slug: p.slug,
          published: p.published,
          views: p.views,
          createdAt: p.createdAt,
          authorId: p.userId,
          authorName: p.user.name,
          authorEmail: p.user.email,
          title: tr?.title ?? p.slug,
        };
      });
    return json({ posts });
  } catch (err) {
    console.error('[admin/posts] list failed:', err);
    return json({ error: 'failed' }, 500);
  }
};
