import { defineHandler, defineRouteMeta } from "nitro";
import { sql } from "drizzle-orm";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

defineRouteMeta({
  openAPI: {
    tags: ["Health"],
    operationId: "getHealthStatus",
    summary: "Service health and runtime environment check",
    description: "Returns database latency, Node.js runtime compatibility, and Cloudflare resource binding connectivity status.",
    responses: {
      200: {
        description: "Health and environment diagnostic details.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", format: "date-time" },
                database: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    latencyMs: { type: "number", nullable: true },
                  },
                },
                bindings: {
                  type: "object",
                  properties: {
                    hasKvKomikhq: { type: "boolean" },
                    hasKvViews: { type: "boolean" },
                    hasBucketUsers: { type: "boolean" },
                    hasBucketMedia: { type: "boolean" },
                    hasAeViews: { type: "boolean" },
                    hasGlobalPresenceDO: { type: "boolean" },
                    hasCommentStreamDO: { type: "boolean" },
                  },
                },
                nodeCompat: {
                  type: "object",
                  properties: {
                    bufferBase64: { type: "string" },
                    sha256: { type: "string" },
                    isNodeProcessAvailable: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
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

  // Node.js crypto & Buffer compatibility verification on Workers runtime
  const testBuffer = Buffer.from("komikhq-nitro-workers", "utf-8").toString("base64");
  const testHash = crypto.createHash("sha256").update("komikhq-test").digest("hex");

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
      hasGlobalPresenceDO: Boolean(env?.GLOBAL_PRESENCE_DO),
      hasCommentStreamDO: Boolean(env?.COMMENT_STREAM_DO),
    },
    nodeCompat: {
      bufferBase64: testBuffer,
      sha256: testHash,
      isNodeProcessAvailable: typeof process !== "undefined" && typeof process.cwd === "function",
    },
  };
});
