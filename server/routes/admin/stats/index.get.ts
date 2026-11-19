import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { findSystemStats } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminGetStats",
    summary: "System overview stats (Admin only)",
    description: "Get aggregate metrics for comics, chapters, users, and comments.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "Dashboard stats summary",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    totalComics: { type: "number" },
                    totalChapters: { type: "number" },
                    totalUsers: { type: "number" },
                    totalComments: { type: "number" },
                    totalViews: { type: "number" },
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
  const db = useDb(event);

  const stats = await findSystemStats(db);

  return {
    status: "ok",
    data: stats,
  };
});
