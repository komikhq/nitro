import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { comics, chapters } from "@/server/db";
import { sql, count } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "getSitemapSummary",
    summary: "Sitemap summary statistics",
    description:
      "Returns the latest update timestamps and total counts for comics and chapters, useful for sitemap index generation.",
    responses: {
      200: {
        description: "Sitemap summary with latest updates and totals.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    latestComicUpdate: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                    latestChapterUpdate: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                    totalComics: { type: "integer" },
                    totalChapters: { type: "integer" },
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
  const db = useDb(event);

  const [comicStats, chapterStats] = await Promise.all([
    db
      .select({
        latest: sql<string | null>`max(${comics.updatedAt})`.as("latest"),
        total: count(),
      })
      .from(comics),
    db
      .select({
        latest: sql<string | null>`max(${chapters.updatedAt})`.as("latest"),
        total: count(),
      })
      .from(chapters),
  ]);

  return {
    status: "ok",
    data: {
      latestComicUpdate: comicStats[0]?.latest ?? null,
      latestChapterUpdate: chapterStats[0]?.latest ?? null,
      totalComics: comicStats[0]?.total ?? 0,
      totalChapters: chapterStats[0]?.total ?? 0,
    },
  };
});
