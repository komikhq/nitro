import { defineHandler, defineRouteMeta } from "nitro";
import { sql } from "drizzle-orm";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

defineRouteMeta({
  openAPI: {
    tags: ["Health"],
    operationId: "getHealthStatus",
    summary: "Service health check",
    description: "Returns database latency and Cloudflare resource binding connectivity status.",
    responses: {
      200: {
        description: "Health status details.",
      },
    },
  },
});

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
