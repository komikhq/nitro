import { defineHandler, defineRouteMeta } from "nitro";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findSystemHealth } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["System"],
    operationId: "getSystemStatus",
    summary: "System infrastructure status (Admin only)",
    description: "Inspect Cloudflare KV, R2, and Durable Objects connectivity status.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "System infrastructure diagnostic report",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    kv: { type: "string" },
                    r2: { type: "string" },
                    realtime: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const env = useCloudflareEnv(event);
  const health = await findSystemHealth(env);

  return {
    status: "ok",
    data: health,
  };
});
