import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { blogSlug } from '../lib/blog';
import { defaultLang } from '../i18n/ui';
import { siteConfig } from '../config';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog')).filter(
    (entry) => entry.data.lang === defaultLang && !entry.data.draft
  );
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `${siteConfig.name} – Blog`,
    description: 'Notizen, Learnings und gelegentliche Begeisterungsausbrüche.',
    site: context.site ?? siteConfig.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: `/blog/${blogSlug(post)}/`,
    })),
    customData: `<language>de-de</language>`,
  });
}
