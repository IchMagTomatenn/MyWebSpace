import type { APIRoute } from 'astro';
import { auth } from '../../lib/auth';
import { db } from '../../db';
import { blogPosts, blogPostTranslations } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { supportedLocales } from '../../config';
import {
  validateSlug,
  slugify,
  normalizeTranslations,
  normalizeCoverUrl,
  type PostPayload,
} from '../../lib/posts';

/**
 * Create a new blog post (authenticated).
 *
 * Body (PostPayload):
 *   { slug?, coverUrl?, published?, translations: { de?: {title,excerpt,content}, en?: {...} } }
 *
 * - `slug` is optional on the wire (the client pre-fills it via `slugify`).
 *   When omitted we derive it from the first translation's title.
 * - At least one translation must have a non-empty title.
 * - The slug must be unique per user (handled by the
 *   `blog_posts_user_slug_unique` constraint, checked explicitly here for a
 *   friendly 409).
 * - Post + translations are written in a single transaction.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);
  const userId = session.user.id;

  let body: PostPayload;
  try {
    body = (await request.json()) as PostPayload;
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  const { rows: translations, error: tErr } = normalizeTranslations(
    body.translations,
    supportedLocales,
  );
  if (tErr) return json({ error: tErr }, 400);

  // Slug: take the provided one, otherwise derive from the first translation.
  let slug = String(body.slug ?? '').trim().toLowerCase();
  if (!slug) slug = slugify(translations[0].title);
  const slugErr = validateSlug(slug);
  if (slugErr) return json({ error: slugErr }, 400);

  // Uniqueness within the user's posts.
  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.userId, userId), eq(blogPosts.slug, slug)))
    .limit(1);
  if (existing) return json({ error: 'posts.error.slug_taken' }, 409);

  const coverUrl = normalizeCoverUrl(body.coverUrl);
  const published = body.published === true;

  try {
    const result = await db.transaction(async (tx) => {
      const [post] = await tx
        .insert(blogPosts)
        .values({
          userId,
          slug,
          coverUrl,
          published,
        })
        .returning({ id: blogPosts.id, slug: blogPosts.slug });

      if (!post) throw new Error('insert returned no row');

      if (translations.length > 0) {
        await tx.insert(blogPostTranslations).values(
          translations.map((t) => ({
            blogPostId: post.id,
            lang: t.lang,
            title: t.title,
            excerpt: t.excerpt,
            content: t.content,
          })),
        );
      }
      return post;
    });
    return json({ id: result.id, slug: result.slug }, 201);
  } catch (err) {
    console.error('[posts] create failed:', err);
    return json({ error: 'posts.error.failed' }, 500);
  }
};
