import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Database schema for the Developer Portal.
 *
 * The four tables `user`, `session`, `account`, `verification` are the core
 * tables Better Auth expects (see https://www.better-auth.com/docs/adapters/drizzle).
 * We add custom user fields (`username`, `bio`, `role`) via `additionalFields`
 * in `src/lib/auth.ts`.
 *
 * App tables (`projects`, `blog_posts`, translations, tags) store the
 * user-generated content. Each piece of content belongs to a `user_id`, so
 * every developer has their own area. Translations are separate rows keyed by
 * `lang`, so new languages can be added without schema changes.
 */

// ---------------------------------------------------------------------------
// Better Auth core tables
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // Custom fields (configured as additionalFields in src/lib/auth.ts)
  username: text('username').unique(),
  bio: text('bio'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// App tables: projects & their translations
// ---------------------------------------------------------------------------

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    repoUrl: text('repo_url'),
    demoUrl: text('demo_url'),
    coverUrl: text('cover_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('projects_user_slug_unique').on(t.userId, t.slug)],
);

export const projectTranslations = pgTable(
  'project_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    content: text('content').notNull().default(''),
  },
  (t) => [unique('project_translations_project_lang_unique').on(t.projectId, t.lang)],
);

// ---------------------------------------------------------------------------
// App tables: blog posts & their translations
// ---------------------------------------------------------------------------

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    coverUrl: text('cover_url'),
    published: boolean('published').notNull().default(false),
    views: integer('views').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('blog_posts_user_slug_unique').on(t.userId, t.slug)],
);

export const blogPostTranslations = pgTable(
  'blog_post_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blogPostId: uuid('blog_post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    content: text('content').notNull().default(''),
  },
  (t) => [unique('blog_post_translations_post_lang_unique').on(t.blogPostId, t.lang)],
);

// ---------------------------------------------------------------------------
// Tags (m:n for projects and blog posts)
// ---------------------------------------------------------------------------

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
});

export const projectTags = pgTable(
  'project_tags',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })],
);

export const blogPostTags = pgTable(
  'blog_post_tags',
  {
    blogPostId: uuid('blog_post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.blogPostId, t.tagId] })],
);

// ---------------------------------------------------------------------------
// Relations (for relational queries via db.query.*)
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  projects: many(projects),
  blogPosts: many(blogPosts),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(user, { fields: [projects.userId], references: [user.id] }),
  translations: many(projectTranslations),
}));

export const projectTranslationRelations = relations(projectTranslations, ({ one }) => ({
  project: one(projects, {
    fields: [projectTranslations.projectId],
    references: [projects.id],
  }),
}));

export const blogPostRelations = relations(blogPosts, ({ one, many }) => ({
  user: one(user, { fields: [blogPosts.userId], references: [user.id] }),
  translations: many(blogPostTranslations),
}));

export const blogPostTranslationRelations = relations(blogPostTranslations, ({ one }) => ({
  blogPost: one(blogPosts, {
    fields: [blogPostTranslations.blogPostId],
    references: [blogPosts.id],
  }),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  projectTags: many(projectTags),
  blogPostTags: many(blogPostTags),
}));
