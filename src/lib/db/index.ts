import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { requireEnv } from '@/lib/env';
import * as schema from './schema';

/**
 * Lazy Drizzle client (plan §9, §2).
 *
 * Production uses the Neon HTTP driver (`@neondatabase/serverless`). Local development
 * and integration tests use the standard node-postgres driver, because neon-http cannot
 * reach a plain local Postgres. The driver is auto-selected from the connection string
 * (or forced via DB_DRIVER); the query-building API is identical either way, so the rest
 * of the app is driver-agnostic.
 *
 * Every write in this app is a single atomic statement (idempotent upsert or a
 * token-scoped conditional UPDATE), so the HTTP driver's lack of session-level
 * transactions is sufficient — no feature needs multi-statement ACID.
 *
 * Created lazily on first use so importing this module never requires DATABASE_URL
 * (keeps `next build` working without secrets).
 */
export type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | undefined;

function shouldUseNodePostgres(url: string): boolean {
  const forced = process.env.DB_DRIVER;
  if (forced === 'node-postgres') return true;
  if (forced === 'neon') return false;
  // Default: Neon HTTP for Neon hosts, node-postgres for everything else (local/test).
  return !/neon\.(tech|database)/i.test(url);
}

export function getDb(): Database {
  if (cached) return cached;
  const url = requireEnv('DATABASE_URL');
  if (shouldUseNodePostgres(url)) {
    cached = drizzleNode(url, { schema }) as unknown as Database;
  } else {
    cached = drizzleNeon(neon(url), { schema });
  }
  return cached;
}

export { schema };
