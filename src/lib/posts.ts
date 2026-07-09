/**
 * Shared helpers for the blog post API endpoints (`/api/posts` and
 * `/api/posts/[id]`). Keeps validation, slug rules and translation
 * normalisation in one place so create + update stay consistent.
 */

import { blogPostTranslations } from '../db/schema';
import type { Lang } from '../i18n/ui';

/** Slug rules: lowercase letters, digits, hyphens. Must contain at least one
 *  letter or digit (no leading/trailing/double hyphens). */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 80;

/** Per-field caps to keep the DB rows tidy. */
export const TITLE_MAX = 200;
export const EXCERPT_MAX = 500;
export const CONTENT_MAX = 100_000;

/** One translation row as it comes out of the normaliser. */
export interface NormalizedTranslation {
  lang: string;
  title: string;
  excerpt: string;
  content: string;
}

/** Shape of a single translation coming from the client. */
export interface TranslationInput {
  title?: string;
  excerpt?: string;
  content?: string;
}

/** Shape of the post payload accepted by create (POST) and update (PATCH). */
export interface PostPayload {
  slug?: string;
  coverUrl?: string | null;
  published?: boolean;
  translations?: Record<string, TranslationInput>;
}

/**
 * Turn a free-form title into a URL-safe slug. Falls back to `untitled` when
 * the title yields nothing usable (e.g. only emoji/punctuation). This is only
 * a convenience default — the user can always override the slug in the editor.
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip combining accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX) || 'untitled'
  );
}

/**
 * Validate a slug. Returns an error key (from i18n) or `null` when ok.
 */
export function validateSlug(slug: string): string | null {
  if (!slug) return 'posts.error.slug_required';
  if (slug.length > SLUG_MAX || !SLUG_RE.test(slug)) return 'posts.error.slug_invalid';
  return null;
}

/**
 * Normalise the incoming `translations` map into a list of rows ready to
 * insert. A translation is kept only when its `title` (after trimming) is
 * non-empty — empty-title rows are dropped (and on update deleted from the
 * DB). Long fields are truncated to their caps so we never write a row that
 * violates the (loose) length expectations.
 *
 * Returns `{ rows, error }` where `error` is an i18n key when no translation
 * has a usable title.
 */
export function normalizeTranslations(
  input: Record<string, TranslationInput> | undefined,
  supported: readonly Lang[],
): { rows: NormalizedTranslation[]; error: string | null } {
  const rows: NormalizedTranslation[] = [];
  for (const lang of supported) {
    const t = input?.[lang];
    if (!t) continue;
    const title = String(t.title ?? '').trim();
    if (!title) continue; // empty title → translation omitted (deleted on update)
    rows.push({
      lang,
      title: title.slice(0, TITLE_MAX),
      excerpt: String(t.excerpt ?? '').slice(0, EXCERPT_MAX),
      content: String(t.content ?? '').slice(0, CONTENT_MAX),
    });
  }
  if (rows.length === 0) {
    return { rows, error: 'posts.error.title_required' };
  }
  return { rows, error: null };
}

/**
 * Coerce a cover URL into either a safe `/uploads/...` path or `null`.
 * Anything else (external URLs, empty string) is dropped.
 */
export function normalizeCoverUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value === '') return null;
  if (value.startsWith('/uploads/')) return value;
  return null;
}

/** Type of a single translation row as returned by the GET endpoint. */
export type TranslationRow = Pick<
  typeof blogPostTranslations.$inferSelect,
  'lang' | 'title' | 'excerpt' | 'content'
>;
