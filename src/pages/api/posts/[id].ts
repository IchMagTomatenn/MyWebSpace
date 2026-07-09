import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { db } from '../../../db';
import { blogPosts, blogPostTranslations } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { supportedLocales } from '../../../config';
import {
  validateSlug,
  normalizeTranslations,
  normalizeCoverUrl,
  type PostPayload,
  type TranslationRow,
} from '../../../lib/posts';

/**
 * Single-post endpoints (authenticated, owner-only):
 *
 * - GET    /api/posts/:id  → `{ post, translations }` for the editor
 * - PATCH  /api/posts/:id  → update slug/cover/published/translations
 * - DELETE /api/posts/:id  → delete the post (cascades translations)
 *
 * Every method first resolves the post scoped to the session user, so a miss
 * returns 404 whether the post doesn't exist or belongs to someone else (no
 * information leak).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const GET: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);

  const id = params.id;
  if (!id || !UUID_RE.test(id)) return json({ error: 'posts.error.not_found' }, 404);

  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.userId, session.user.id)))
      .limit(1);
    if (!post) return json({ error: 'posts.error.not_found' }, 404);

    const trRows = await db
      .select({
        lang: blogPostTranslations.lang,
        title: blogPostTranslations.title,
        excerpt: blogPostTranslations.excerpt,
        content: blogPostTranslations.content,
      })
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.blogPostId, id));

    return json({ post, translations: trRows as TranslationRow[] });
  } catch (err) {
    console.error('[posts] get failed:', err);
    return json({ error: 'posts.error.failed' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  const userId = session.user.id;

  const id = params.id;
  if (!id || !UUID_RE.test(id)) return json({ error: 'posts.error.not_found' }, 404);

  let body: PostPayload;
  try {
    body = (await request.json()) as PostPayload;
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  try {
    const [post] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.userId, userId)))
      .limit(1);
    if (!post) return json({ error: 'posts.error.not_found' }, 404);

    // Build the post-row patch. Slug is only updated when provided.
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.slug !== undefined) {
      const slug = String(body.slug).trim().toLowerCase();
      const slugErr = validateSlug(slug);
      if (slugErr) return json({ error: slugErr }, 400);
      // Uniqueness, excluding the current row.
      const [dup] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(and(eq(blogPosts.userId, userId), eq(blogPosts.slug, slug)))
        .limit(1);
      if (dup && dup.id !== id) return json({ error: 'posts.error.slug_taken' }, 409);
      patch.slug = slug;
    }
    if (body.coverUrl !== undefined) patch.coverUrl = normalizeCoverUrl(body.coverUrl);
    if (body.published !== undefined) patch.published = body.published === true;

    // Translations: full replace of the post's translation rows. Empty-title
    // translations are dropped, which on update means they get deleted.
    const trResult = normalizeTranslations(body.translations, supportedLocales);
    if (body.translations !== undefined && trResult.error) {
      return json({ error: trResult.error }, 400);
    }

    await db.transaction(async (tx) => {
      await tx.update(blogPosts).set(patch).where(eq(blogPosts.id, id));

      if (body.translations !== undefined) {
        await tx.delete(blogPostTranslations).where(eq(blogPostTranslations.blogPostId, id));
        if (trResult.rows.length > 0) {
          await tx.insert(blogPostTranslations).values(
            trResult.rows.map((t) => ({
              blogPostId: id,
              lang: t.lang,
              title: t.title,
              excerpt: t.excerpt,
              content: t.content,
            })),
          );
        }
      }
    });

    return json({ ok: true, id });
  } catch (err) {
    console.error('[posts] update failed:', err);
    return json({ error: 'posts.error.failed' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);

  const id = params.id;
  if (!id || !UUID_RE.test(id)) return json({ error: 'posts.error.not_found' }, 404);

  try {
    // Delete scoped to the owner so a miss is indistinguishable from "not
    // yours" — both return 404.
    const result = await db
      .delete(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.userId, session.user.id)))
      .returning({ id: blogPosts.id });
    if (result.length === 0) return json({ error: 'posts.error.not_found' }, 404);
    return json({ ok: true, id });
  } catch (err) {
    console.error('[posts] delete failed:', err);
    return json({ error: 'posts.error.failed' }, 500);
  }
};
