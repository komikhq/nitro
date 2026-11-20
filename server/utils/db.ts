import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { H3Event } from "nitro/h3";
import * as schema from "@/server/db/schema";
import { useCloudflareEnv } from "./cloudflare";
import type { DbClient } from "@/server/db";

let _db: DbClient | null = null;
let _currentDbUrl: string | null = null;

/**
 * Access cached Drizzle ORM client.
 * Resolves DATABASE_URL from Nitro event context, Cloudflare bindings, or process.env.
 */
export function useDb(event?: H3Event): DbClient {
  const env = useCloudflareEnv(event);
  const databaseUrl = env?.DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment or bindings.");
  }

  // Reuse existing client instance if connection string hasn't changed
  if (_db && _currentDbUrl === databaseUrl) {
    return _db;
  }

  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  _currentDbUrl = databaseUrl;

  return _db;
}

export type { DbClient };
