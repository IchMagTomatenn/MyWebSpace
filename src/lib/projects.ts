import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from '../i18n/ui';

export type ProjectEntry = CollectionEntry<'projects'>;

/** Extract the slug (filename without extension) from a project entry id like `de/my-project`. */
export function projectSlug(entry: ProjectEntry): string {
  const parts = entry.id.split('/');
  return parts.length > 1 ? parts[parts.length - 1] : entry.id;
}

/** Fetch all published project entries for the given language, sorted by date desc. */
export async function getProjectsByLang(lang: Lang): Promise<ProjectEntry[]> {
  const all = await getCollection('projects', (entry) => {
    return entry.data.lang === lang && !entry.data.draft;
  });
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Find a single project entry by slug and language. */
export async function getProjectBySlug(
  slug: string,
  lang: Lang
): Promise<ProjectEntry | undefined> {
  const all = await getCollection('projects');
  return all.find((entry) => projectSlug(entry) === slug && entry.data.lang === lang);
}

/** Build the localized href for a project detail page. */
export function projectHref(slug: string, lang: Lang): string {
  return lang === defaultLang ? `/projects/${slug}` : `/${lang}/projects/${slug}`;
}
