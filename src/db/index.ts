import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * PostgreSQL client + Drizzle instance.
 *
 * We construct the pool lazily-friendly: if `DATABASE_URL` is not set we fall
 * back to libpq defaults, so importing this module never throws at build time
 * (only actual queries fail when misconfigured). This keeps `astro build` /
 * `astro check` working without a live database.
 */
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(connectionString ? { connectionString } : {});

export const db = drizzle(pool, { schema });

export type DB = typeof db;
