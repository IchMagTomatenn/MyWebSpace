/**
 * Site-wide configuration for the Developer Portal.
 *
 * Secrets / environment-specific values live in `.env` (see `.env.example`)
 * and are read via `import.meta.env`. This file only holds non-secret,
 * compile-time constants and convenience accessors.
 */

export const siteConfig = {
  name: 'MyWebSpace',
  domain: 'j-bot.net',
  url: 'https://j-bot.net',
  /** Contact address for the platform owner (shown in footer / fallback). */
  email: 'ubztomaten@gmail.com',
  social: {
    github: 'https://github.com/IchMagTomatenn',
  },
} as const;

/**
 * Public base URL of the site. Falls back to localhost during development.
 * Used for absolute URLs in emails and OAuth callbacks.
 */
export const publicSiteUrl =
  (import.meta.env.PUBLIC_SITE_URL as string | undefined) ??
  `http://localhost:${process.env.PORT ?? 4321}`;

/**
 * Directory where user-uploaded files (avatars, project covers) are stored.
 * Defaults to a local `uploads` dir in development and `/data/uploads` (the
 * Railway volume mount) in production.
 */
export const uploadDir =
  (import.meta.env.UPLOAD_DIR as string | undefined) ??
  (process.env.NODE_ENV === 'production' ? '/data/uploads' : './uploads');

/**
 * Upload constraints.
 */
export const uploadLimits = {
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB per file
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

/**
 * Admin / owner e-mail. The account registered with this address receives
 * the `admin` role automatically (see `src/lib/auth.ts`). Set via env.
 */
export const adminEmail =
  (import.meta.env.ADMIN_EMAIL as string | undefined)?.toLowerCase() ?? null;

/**
 * Supported UI languages. Keep in sync with `src/i18n/ui.ts` and
 * `astro.config.mjs`. New languages can be added here without schema changes
 * — per-entry translations use a free-form `lang` column.
 */
export const supportedLocales = ['de', 'en'] as const;
export const defaultLocale = 'de' as const;
