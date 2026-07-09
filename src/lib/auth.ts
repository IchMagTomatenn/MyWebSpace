import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import * as schema from '../db/schema';
import { publicSiteUrl } from '../config';
import { sendEmail } from './email';

/** Read an env var, returning undefined when unset. */
const env = (key: string) => process.env[key];

/**
 * Better Auth configuration.
 *
 * Authentication options:
 * - E-mail + password (with mandatory e-mail verification before sign-in)
 * - Password reset via e-mail
 * - Social login: Google + GitHub (each only enabled when its credentials exist)
 *
 * The Drizzle adapter is used against the PostgreSQL schema in `src/db/schema`.
 * Custom user fields (username, bio, role) are declared as `additionalFields`
 * and mirrored as columns in the schema.
 */
export const auth = betterAuth({
  baseURL: publicSiteUrl,
  trustedOrigins: [publicSiteUrl],
  database: drizzleAdapter(db, { provider: 'pg', schema }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Passwort zurücksetzen · MyWebSpace',
        text: `Setze dein Passwort zurück (gültig für 1 Stunde):\n${url}`,
        html: `<p>Setze dein Passwort zurück (gültig für 1 Stunde):</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'E-Mail bestätigen · MyWebSpace',
        text: `Bestätige deine E-Mail-Adresse:\n${url}`,
        html: `<p>Bestätige deine E-Mail-Adresse:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
    sendOnSignUp: true,
  },

  // Only register a social provider when its OAuth credentials are present, so
  // the app still runs in environments where social login isn't configured yet.
  socialProviders: {
    ...(env('GOOGLE_CLIENT_ID')
      ? {
          google: {
            clientId: env('GOOGLE_CLIENT_ID')!,
            clientSecret: env('GOOGLE_CLIENT_SECRET')!,
          },
        }
      : {}),
    ...(env('GITHUB_CLIENT_ID')
      ? {
          github: {
            clientId: env('GITHUB_CLIENT_ID')!,
            clientSecret: env('GITHUB_CLIENT_SECRET')!,
          },
        }
      : {}),
  },

  user: {
    additionalFields: {
      username: { type: 'string', required: false, unique: true },
      bio: { type: 'string', required: false },
      role: { type: 'string', required: false, defaultValue: 'user' },
    },
  },
});

export type Auth = typeof auth;
