import { defineHandler, defineRouteMeta } from "nitro";
import { appendHeader, getQuery, getRequestHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { chapters, comics } from "@/server/db";
import { eq, desc } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "getChaptersSitemapXml",
    summary: "Chapters XML sitemap",
    description: "Generates XML sitemap of all published comic chapters for search engine bots. Supports JSON output via ?format=json or Accept: application/json.",
    parameters: [
      {
        name: "format",
        in: "query",
        required: false,
        schema: { type: "string", enum: ["xml", "json"], default: "xml" },
        description: "Output format (xml or json)",
      },
    ],
    responses: {
      200: {
        description: "XML sitemap or JSON feed.",
        content: {
          "application/xml": {},
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
                          updatedAt: { type: "string" },
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
  const db = useDb(event);
  const query = getQuery(event);
  const acceptHeader = getRequestHeader(event, "accept") || "";

  const wantsJson = query.format === "json" || acceptHeader.includes("application/json");

  const chapterList = await db
    .select({
      comicSlug: comics.slug,
      chapterSlug: chapters.slug,
      updatedAt: chapters.updatedAt,
    })
    .from(chapters)
    .innerJoin(comics, eq(chapters.comicId, comics.id))
    .orderBy(desc(chapters.updatedAt))
    .limit(50000);

  if (wantsJson) {
    return {
      status: "ok",
      data: {
        chapters: chapterList,
        total: chapterList.length,
      },
    };
  }

  appendHeader(event, "Content-Type", "application/xml; charset=utf-8");

  const urls = chapterList
    .map(
      (ch) => `
  <url>
    <loc>https://komikhq.dpdns.org/comics/${ch.comicSlug}/${ch.chapterSlug}</loc>
    <lastmod>${ch.updatedAt ? new Date(ch.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
});
