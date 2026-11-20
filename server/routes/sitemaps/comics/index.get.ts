import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { comics } from "@/server/db";
import { desc, count } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "listSitemapComics",
    summary: "List comics for sitemap",
    description:
      "Returns a list of comic slugs and their last update timestamps for sitemap generation.",
    parameters: [
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 50000 },
        description: "Maximum number of comics to return.",
      },
    ],
    responses: {
      200: {
        description: "List of comics with slug and updatedAt.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    comics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          slug: { type: "string" },
                          updatedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                        },
                      },
                    },
                    total: { type: "integer" },
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
  const { limit } = getQuery(event);
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 50000, 50000));

  const db = useDb(event);

  const [comicList, totalResult] = await Promise.all([
    db
      .select({ slug: comics.slug, updatedAt: comics.updatedAt })
      .from(comics)
      .orderBy(desc(comics.updatedAt))
      .limit(parsedLimit),
    db.select({ total: count() }).from(comics),
  ]);

  return {
    status: "ok",
    data: {
      comics: comicList,
      total: totalResult[0]?.total ?? 0,
    },
  };
});
