import { defineHandler } from "nitro";
import { sql } from "drizzle-orm";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export default defineHandler(async (event) => {
  const env = useCloudflareEnv(event);
  let dbStatus = "unknown";
  let dbLatencyMs: number | null = null;

  try {
    const db = useDb(event);
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - start;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `disconnected (${err?.message || "error"})`;
  }

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    bindings: {
      hasKvKomikhq: Boolean(env?.KV_KOMIKHQ),
      hasKvViews: Boolean(env?.KV_VIEWS),
      hasBucketUsers: Boolean(env?.BUCKET_USERS),
      hasBucketMedia: Boolean(env?.BUCKET_MEDIA),
      hasAeViews: Boolean(env?.AE_COMIC_VIEWS),
    },
  };
});
