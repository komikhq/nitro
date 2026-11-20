import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";

defineRouteMeta({
  openAPI: {
    tags: ["System"],
    operationId: "clearSystemCache",
    summary: "Clear search cache (Admin only)",
    description: "Invalidate all cached search suggestions stored in Cloudflare KV.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "Cache cleared successfully",
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
                    clearedKeys: { type: "number" },
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
  const env = useCloudflareEnv(event);

  if (!env?.KV_KOMIKHQ) {
    throw new HTTPError({ status: 500, message: "KV_KOMIKHQ binding is not available." });
  }

  let clearedKeys = 0;
  let cursor: string | undefined = undefined;

  try {
    do {
      const listRes: any = await env.KV_KOMIKHQ.list({
        prefix: "comic-search:suggestions:",
        cursor,
      });

      cursor = listRes.cursor;

      if (Array.isArray(listRes.keys)) {
        for (const key of listRes.keys) {
          await env.KV_KOMIKHQ.delete(key.name);
          clearedKeys++;
        }
      }
    } while (cursor);

    return {
      status: "ok",
      success: true,
      message: `Search suggestion cache invalidated successfully (${clearedKeys} cached queries cleared).`,
      data: {
        clearedKeys,
      },
      "cleared-keys": clearedKeys,
      clearedKeys,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to clear search cache.",
    });
  }
});
