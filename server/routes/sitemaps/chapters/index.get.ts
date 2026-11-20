import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { comics, chapters } from "@/server/db";
import { eq, desc, count } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "listSitemapChapters",
    summary: "List chapters for sitemap",
    description:
      "Returns a paginated list of chapters with their comic slug for sitemap generation.",
    parameters: [
      {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
        description: "Page number.",
      },
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 1000 },
        description: "Number of chapters per page.",
      },
    ],
    responses: {
      200: {
        description: "Paginated list of chapters for sitemap.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    chapters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          comicSlug: { type: "string" },
                          chapterSlug: { type: "string" },
                          updatedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                        },
                      },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
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
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(Number(query.limit) || 1000, 50000));
  const offset = (page - 1) * limit;

  const db = useDb(event);

  const [chapterList, totalResult] = await Promise.all([
    db
      .select({
        comicSlug: comics.slug,
        chapterSlug: chapters.slug,
        updatedAt: chapters.updatedAt,
      })
      .from(chapters)
      .innerJoin(comics, eq(chapters.comicId, comics.id))
      .orderBy(desc(chapters.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(chapters),
  ]);

  return {
    status: "ok",
    data: {
      chapters: chapterList,
      total: totalResult[0]?.total ?? 0,
      page,
      limit,
    },
    chapters: chapterList,
    total: totalResult[0]?.total ?? 0,
    page,
    limit,
  };
});
