import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from '../i18n/ui';

export type BlogEntry = CollectionEntry<'blog'>;

/** Extract the slug (filename without extension) from a blog entry id like `de/my-post`. */
export function blogSlug(entry: BlogEntry): string {
  const parts = entry.id.split('/');
  return parts.length > 1 ? parts[parts.length - 1] : entry.id;
}

/** Fetch all published blog entries for the given language, sorted by date desc. */
export async function getPostsByLang(lang: Lang): Promise<BlogEntry[]> {
  const all = await getCollection('blog', (entry) => {
    return entry.data.lang === lang && !entry.data.draft;
  });
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Find a single blog entry by slug and language. */
export async function getPostBySlug(
  slug: string,
  lang: Lang
): Promise<BlogEntry | undefined> {
  const all = await getCollection('blog');
  return all.find((entry) => blogSlug(entry) === slug && entry.data.lang === lang);
}

/** Build the localized href for a blog post detail page. */
export function blogHref(slug: string, lang: Lang): string {
  return lang === defaultLang ? `/blog/${slug}` : `/${lang}/blog/${slug}`;
}

/** Estimate reading time in minutes for a markdown body. ~200 words/min. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Collect every unique tag across all published posts of a language, alphabetical. */
export async function getTagsByLang(lang: Lang): Promise<string[]> {
  const posts = await getPostsByLang(lang);
  const set = new Set<string>();
  posts.forEach((post) => post.data.tags.forEach((tag) => set.add(tag)));
  return [...set].sort((a, b) => a.localeCompare(b));
}
