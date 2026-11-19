import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { purgeStorageOrphans } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["System"],
    operationId: "purgeSystemStorage",
    summary: "Purge orphan files from R2 storage (Admin only)",
    description: "Scan R2 bucket and delete orphaned files not associated with any comic or user.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "Storage purge operation completed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    purgedCount: { type: "number" },
                    totalSizeMB: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      500: { description: "Internal server error" },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  try {
    const result = await purgeStorageOrphans(db, env);
    return {
      status: "ok",
      message: `Cleanup successful! ${result.purgedCount} orphan files (${result.totalSizeMB} MB) deleted from storage.`,
      data: result,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to purge orphan storage files.",
    });
  }
});
