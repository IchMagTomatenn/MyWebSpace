import { defineConfig } from 'drizzle-kit';

// Drizzle Kit configuration.
// - schema: the Drizzle schema to generate migrations from.
// - out:    directory for generated SQL migration files.
// - dbCredentials.url: read from DATABASE_URL (set in .env). Required only for
//   `db:push` / `db:studio` (live DB). `db:generate` works without a connection.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
