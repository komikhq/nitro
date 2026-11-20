import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { runTask } from "nitro/task";
import { requireAdmin } from "@/server/utils/protect";

defineRouteMeta({
  openAPI: {
    tags: ["System"],
    operationId: "syncSystemViews",
    summary: "Manually trigger view sync and rankings refresh (Admin only)",
    description: "Execute background tasks to sync comic view deltas from KV to DB and refresh rankings.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "Task executed successfully",
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
                    viewsResult: { type: "object" },
                    rankingsResult: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      500: { description: "Task execution failure" },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);

  try {
    const viewsResult = await runTask("views:sync-delta");
    const rankingsResult = await runTask("rankings:refresh");

    const viewsData: any = (viewsResult as any)?.result || viewsResult;
    const rankingsData: any = (rankingsResult as any)?.result || rankingsResult;

    const syncedChapters = viewsData?.syncedChapters ?? 0;
    const syncedComics = viewsData?.syncedComics ?? 0;
    const totalViewsAdded = viewsData?.totalViewsAdded ?? 0;

    return {
      status: "ok",
      success: true,
      message: `Successfully synchronized ${syncedChapters} chapters across ${syncedComics} comics (+${totalViewsAdded} views). Rankings refreshed.`,
      "synced-chapters": syncedChapters,
      "synced-comics": syncedComics,
      "total-views-added": totalViewsAdded,
      "synced-logs": totalViewsAdded,
      "affected-comics": syncedComics,
      rankings: rankingsData,
      data: {
        viewsResult,
        rankingsResult,
        "synced-chapters": syncedChapters,
        "synced-comics": syncedComics,
        "total-views-added": totalViewsAdded,
        "synced-logs": totalViewsAdded,
        "affected-comics": syncedComics,
        rankings: rankingsData,
      },
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to synchronize views.",
    });
  }
});
